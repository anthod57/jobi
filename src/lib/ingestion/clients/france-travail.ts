import type {
  ContractType,
  NormalizedOfferInput,
} from "../offer-repository";
import type { IngestionSearchQuery } from "../search-query";

const FT_TOKEN_URL =
  "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire";
const FT_SEARCH_URL =
  "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search";
const FT_SCOPE = "api_offresdemploiv2 o2dsoffre";
const FT_BUCKETS = [1, 3, 7, 14, 31] as const;
const FT_PAGE_SIZE = 50;
const FT_MAX_PAGES = 20;
const HTTP_TIMEOUT_MS = 15_000;

type FranceTravailRawOffer = {
  id?: string;
  intitule?: string;
  description?: string;
  dateCreation?: string;
  typeContrat?: string;
  entreprise?: { nom?: string };
  lieuTravail?: { libelle?: string; codePostal?: string };
  salaire?: { libelle?: string };
  origineOffre?: { urlOrigine?: string };
};

function mapPublieeDepuis(maxDaysOld: number): number {
  for (const bucket of FT_BUCKETS) {
    if (maxDaysOld <= bucket) return bucket;
  }
  return 31;
}

function mapContractType(raw: string | undefined): ContractType | null {
  const code = (raw ?? "").trim().toUpperCase();
  if (code === "CDI") return "cdi";
  if (code === "CDD" || code === "SAI") return "cdd";
  if (code === "MIS") return "interim";
  if (code === "LIB" || code === "FRA") return "freelance";
  if (code === "DIN" || code === "ALT") return "alternance";
  if (code === "STA") return "stage";
  return null;
}

function extractDepartment(
  codePostal?: string,
  locationLabel?: string,
): string | null {
  const cp = (codePostal ?? "").trim();
  if (/^\d{5}$/.test(cp)) {
    return cp.startsWith("97") || cp.startsWith("98")
      ? cp.slice(0, 3)
      : cp.slice(0, 2);
  }
  const match = (locationLabel ?? "").match(/^(\d{2,3})\s*-/);
  return match ? match[1] : null;
}

function normalizeOffer(raw: FranceTravailRawOffer): NormalizedOfferInput | null {
  const externalId = (raw.id ?? "").trim();
  const title = (raw.intitule ?? "").trim();
  if (!externalId || !title) return null;

  const locationLabel = (raw.lieuTravail?.libelle ?? "").trim();
  const publishedAt = raw.dateCreation ? new Date(raw.dateCreation) : null;

  return {
    source: "france_travail",
    externalId,
    url:
      raw.origineOffre?.urlOrigine?.trim() ||
      `https://candidat.francetravail.fr/offres/recherche/detail/${externalId}`,
    title,
    company: (raw.entreprise?.nom ?? "").trim(),
    locationLabel,
    department: extractDepartment(raw.lieuTravail?.codePostal, locationLabel),
    contractType: mapContractType(raw.typeContrat),
    remoteMode: null,
    salaryMin: null,
    salaryMax: null,
    salaryText: raw.salaire?.libelle?.trim() || null,
    description: (raw.description ?? "").trim(),
    publishedAt:
      publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
    rawPayload: raw as Record<string, unknown>,
  };
}

/** Fetches and normalizes job offers from the official France Travail v2 API. */
export async function fetchFranceTravailOffers(
  creds: { clientId: string; clientSecret: string },
  query: IngestionSearchQuery,
  fetchImpl: typeof fetch = fetch,
): Promise<NormalizedOfferInput[]> {
  const tokenRes = await fetchImpl(FT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      scope: FT_SCOPE,
    }).toString(),
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  });

  if (!tokenRes.ok) {
    throw new Error(`France Travail OAuth failed (${tokenRes.status})`);
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    throw new Error("France Travail OAuth response missing access_token");
  }

  const allOffers: NormalizedOfferInput[] = [];

  for (let page = 0; page < FT_MAX_PAGES; page += 1) {
    const start = page * FT_PAGE_SIZE;
    const end = start + FT_PAGE_SIZE - 1;
    const url = new URL(FT_SEARCH_URL);
    url.searchParams.set("range", `${start}-${end}`);
    if (query.keywords.trim()) {
      url.searchParams.set("motsCles", query.keywords.trim());
    }
    if (query.maxDaysOld !== undefined) {
      url.searchParams.set(
        "publieeDepuis",
        String(mapPublieeDepuis(query.maxDaysOld)),
      );
    }

    const searchRes = await fetchImpl(url.toString(), {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    });

    if (searchRes.status === 204) {
      break;
    }
    if (!searchRes.ok) {
      throw new Error(`France Travail search failed (${searchRes.status})`);
    }

    const body = (await searchRes.json()) as {
      resultats?: FranceTravailRawOffer[];
    };
    const rawOffers = body.resultats ?? [];
    for (const raw of rawOffers) {
      const normalized = normalizeOffer(raw);
      if (normalized) {
        allOffers.push(normalized);
      }
    }

    if (rawOffers.length < FT_PAGE_SIZE) {
      break;
    }
  }

  return allOffers;
}
