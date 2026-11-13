import { describe, expect, it, vi } from "vitest";

import { fetchAdzunaOffers } from "./adzuna";

describe("fetchAdzunaOffers", () => {
  it("queries Adzuna FR search endpoint with max_days_old and normalizes offers", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              id: "4912001",
              title: "Ingénieur Backend Node.js",
              description: "API TypeScript & PostgreSQL",
              created: "2026-11-11T10:15:00Z",
              redirect_url: "https://www.adzuna.fr/details/4912001",
              company: { display_name: "DataPulse" },
              location: { display_name: "Lyon, Rhône" },
              contract_type: "permanent",
              salary_min: 45000,
              salary_max: 58000,
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const offers = await fetchAdzunaOffers(
      { appId: "adz-id", appKey: "adz-key" },
      { keywords: "Node.js TypeScript", maxDaysOld: 12 },
      fetchMock,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const parsedUrl = new URL(String(fetchMock.mock.calls[0][0]));
    expect(parsedUrl.origin + parsedUrl.pathname).toBe(
      "https://api.adzuna.com/v1/api/jobs/fr/search/1",
    );
    expect(parsedUrl.searchParams.get("app_id")).toBe("adz-id");
    expect(parsedUrl.searchParams.get("app_key")).toBe("adz-key");
    expect(parsedUrl.searchParams.get("results_per_page")).toBe("50");
    expect(parsedUrl.searchParams.get("what")).toBe("Node.js TypeScript");
    expect(parsedUrl.searchParams.get("max_days_old")).toBe("12");

    expect(offers).toHaveLength(1);
    expect(offers[0]).toMatchObject({
      source: "adzuna",
      externalId: "4912001",
      url: "https://www.adzuna.fr/details/4912001",
      title: "Ingénieur Backend Node.js",
      company: "DataPulse",
      locationLabel: "Lyon, Rhône",
      department: null,
      contractType: "cdi",
      salaryMin: 45000,
      salaryMax: 58000,
      description: "API TypeScript & PostgreSQL",
    });
    expect(offers[0].publishedAt).toEqual(new Date("2026-11-11T10:15:00Z"));
  });

  it("throws without leaking appKey when Adzuna returns an HTTP error", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("Forbidden", { status: 403 }));

    await expect(
      fetchAdzunaOffers(
        { appId: "adz-id", appKey: "secret-adz-key" },
        { keywords: "" },
        fetchMock,
      ),
    ).rejects.toThrow(/Adzuna search failed \(403\)/);
  });
});
