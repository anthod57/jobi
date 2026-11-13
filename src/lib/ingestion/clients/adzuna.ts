import type {
  ContractType,
  NormalizedOfferInput,
} from "../offer-repository";
import type { IngestionSearchQuery } from "../search-query";

const ADZUNA_SEARCH_BASE_URL = "https://api.adzuna.com/v1/api/jobs/fr/search";
const ADZUNA_PAGE_SIZE = 50;
const ADZUNA_MAX_PAGES = 20;
const HTTP_TIMEOUT_MS = 15_000;

type AdzunaRawOffer = {
  id?: string | number;
  title?: string;
  description?: string;
  created?: string;
  redirect_url?: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  contract_type?: string;
  salary_min?: number;
  salary_max?: number;
};

function mapContractType(raw: string | undefined): ContractType | null {
  const code = (raw ?? "").trim().toLowerCase();
  if (code === "permanent") return "cdi";
  if (code === "contract") return "cdd";
  return null;
}

function normalizeSalary(
  minRaw: number | undefined,
  maxRaw: number | undefined,
): { salaryMin: number | null; salaryMax: number | null } {
  const min =
    typeof minRaw === "number" && Number.isFinite(minRaw)
      ? Math.round(minRaw)
      : null;
  const max =
    typeof maxRaw === "number" && Number.isFinite(maxRaw)
      ? Math.round(maxRaw)
      : null;
  if (min !== null && max !== null && min > max) {
    return { salaryMin: max, salaryMax: min };
  }
  return { salaryMin: min, salaryMax: max };
}

function normalizeOffer(raw: AdzunaRawOffer): NormalizedOfferInput | null {
  const externalId = raw.id !== undefined ? String(raw.id).trim() : "";
  const title = (raw.title ?? "").trim();
  if (!externalId || !title) return null;

  const { salaryMin, salaryMax } = normalizeSalary(
    raw.salary_min,
    raw.salary_max,
  );
  const publishedAt = raw.created ? new Date(raw.created) : null;

  return {
    source: "adzuna",
    externalId,
    url: (raw.redirect_url ?? "").trim(),
    title,
    company: (raw.company?.display_name ?? "").trim(),
    locationLabel: (raw.location?.display_name ?? "").trim(),
    department: null,
    contractType: mapContractType(raw.contract_type),
    remoteMode: null,
    salaryMin,
    salaryMax,
    salaryText: null,
    description: (raw.description ?? "").trim(),
    publishedAt:
      publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
    rawPayload: raw as Record<string, unknown>,
  };
}

/** Fetches and normalizes job offers from the official Adzuna FR API. */
export async function fetchAdzunaOffers(
  creds: { appId: string; appKey: string },
  query: IngestionSearchQuery,
  fetchImpl: typeof fetch = fetch,
): Promise<NormalizedOfferInput[]> {
  const allOffers: NormalizedOfferInput[] = [];

  for (let page = 1; page <= ADZUNA_MAX_PAGES; page += 1) {
    const url = new URL(`${ADZUNA_SEARCH_BASE_URL}/${page}`);
    url.searchParams.set("app_id", creds.appId);
    url.searchParams.set("app_key", creds.appKey);
    url.searchParams.set("results_per_page", String(ADZUNA_PAGE_SIZE));
    if (query.keywords.trim()) {
      url.searchParams.set("what", query.keywords.trim());
    }
    if (query.maxDaysOld !== undefined) {
      url.searchParams.set("max_days_old", String(query.maxDaysOld));
    }

    const res = await fetchImpl(url.toString(), {
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(`Adzuna search failed (${res.status})`);
    }

    const body = (await res.json()) as { results?: AdzunaRawOffer[] };
    const rawOffers = body.results ?? [];
    for (const raw of rawOffers) {
      const normalized = normalizeOffer(raw);
      if (normalized) {
        allOffers.push(normalized);
      }
    }

    if (rawOffers.length < ADZUNA_PAGE_SIZE) {
      break;
    }
  }

  return allOffers;
}
