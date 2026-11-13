import { describe, expect, it, vi } from "vitest";

import { fetchFranceTravailOffers } from "./france-travail";

describe("fetchFranceTravailOffers", () => {
  it("authenticates via OAuth2 client_credentials, maps maxDaysOld to official bracket, and normalizes offers", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "ft-token-123" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            resultats: [
              {
                id: "184ABCD",
                intitule: "Développeur TypeScript",
                description: "Poste full-stack Next.js",
                dateCreation: "2026-11-10T08:30:00.000Z",
                typeContrat: "CDI",
                entreprise: { nom: "Acme Tech" },
                lieuTravail: {
                  libelle: "75 - Paris",
                  codePostal: "75008",
                },
                salaire: { libelle: "Annuel de 48000 Euros à 55000 Euros" },
                origineOffre: {
                  urlOrigine: "https://candidat.francetravail.fr/offres/184ABCD",
                },
              },
            ],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    const offers = await fetchFranceTravailOffers(
      { clientId: "ft-id", clientSecret: "ft-secret" },
      { keywords: "TypeScript React", maxDaysOld: 10 },
      fetchMock,
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0];
    expect(String(tokenUrl)).toBe(
      "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire",
    );
    expect(tokenInit?.method).toBe("POST");
    const tokenBody = String(tokenInit?.body);
    expect(tokenBody).toContain("grant_type=client_credentials");
    expect(tokenBody).toContain("client_id=ft-id");
    expect(tokenBody).toContain("client_secret=ft-secret");
    expect(tokenBody).toContain("scope=api_offresdemploiv2+o2dsoffre");

    const [searchUrl, searchInit] = fetchMock.mock.calls[1];
    const parsedSearchUrl = new URL(String(searchUrl));
    expect(parsedSearchUrl.origin + parsedSearchUrl.pathname).toBe(
      "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search",
    );
    expect(parsedSearchUrl.searchParams.get("range")).toBe("0-49");
    expect(parsedSearchUrl.searchParams.get("motsCles")).toBe("TypeScript React");
    expect(parsedSearchUrl.searchParams.get("publieeDepuis")).toBe("14");
    expect(
      new Headers(searchInit?.headers).get("Authorization"),
    ).toBe("Bearer ft-token-123");

    expect(offers).toHaveLength(1);
    expect(offers[0]).toMatchObject({
      source: "france_travail",
      externalId: "184ABCD",
      url: "https://candidat.francetravail.fr/offres/184ABCD",
      title: "Développeur TypeScript",
      company: "Acme Tech",
      locationLabel: "75 - Paris",
      department: "75",
      contractType: "cdi",
      salaryText: "Annuel de 48000 Euros à 55000 Euros",
      description: "Poste full-stack Next.js",
    });
    expect(offers[0].publishedAt).toEqual(new Date("2026-11-10T08:30:00.000Z"));
  });

  it("returns an empty array on HTTP 204 No Content and maps 30 days to bracket 31", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "ft-token" }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const offers = await fetchFranceTravailOffers(
      { clientId: "ft-id", clientSecret: "ft-secret" },
      { keywords: "", maxDaysOld: 30 },
      fetchMock,
    );

    const parsedSearchUrl = new URL(String(fetchMock.mock.calls[1][0]));
    expect(parsedSearchUrl.searchParams.get("motsCles")).toBeNull();
    expect(parsedSearchUrl.searchParams.get("publieeDepuis")).toBe("31");
    expect(offers).toEqual([]);
  });

  it("throws without leaking clientSecret when OAuth fails", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("Unauthorized", { status: 401 }));

    await expect(
      fetchFranceTravailOffers(
        { clientId: "ft-id", clientSecret: "top-secret-value" },
        { keywords: "dev" },
      fetchMock,
    ),
    ).rejects.toThrow(/France Travail OAuth failed \(401\)/);
  });

  it("paginates ranges until fewer than 50 offers are returned", async () => {
    const page1 = Array.from({ length: 50 }, (_, i) => ({
      id: `FT-${i}`,
      intitule: `Poste ${i}`,
    }));
    const page2 = [{ id: "FT-50", intitule: "Poste 50" }];

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "ft-token" }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ resultats: page1 }), { status: 206 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ resultats: page2 }), { status: 200 }),
      );

    const offers = await fetchFranceTravailOffers(
      { clientId: "ft-id", clientSecret: "ft-secret" },
      { keywords: "dev", maxDaysOld: 30 },
      fetchMock,
    );

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(
      new URL(String(fetchMock.mock.calls[1][0])).searchParams.get("range"),
    ).toBe("0-49");
    expect(
      new URL(String(fetchMock.mock.calls[2][0])).searchParams.get("range"),
    ).toBe("50-99");
    expect(offers).toHaveLength(51);
  });
});
