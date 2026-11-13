import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDbMock } = vi.hoisted(() => ({
  getDbMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({
  getDb: getDbMock,
}));

import { getProfile } from "./repository";

type SelectTerminal = "limit" | "orderBy";

function makeSelectChain(rows: unknown[], terminal: SelectTerminal) {
  const chain: {
    from: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    orderBy: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
  } = {
    from: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
  };

  const resolve = () => Promise.resolve(rows);

  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);

  if (terminal === "limit") {
    chain.orderBy.mockReturnValue(chain);
    chain.limit.mockImplementation(resolve);
  } else {
    chain.limit.mockReturnValue(chain);
    chain.orderBy.mockImplementation(resolve);
  }

  return chain;
}

function mockDbForGetProfile(options: {
  profile: Record<string, unknown> | null;
  skills?: Record<string, unknown>[];
  experiences?: Record<string, unknown>[];
  cv?: Record<string, unknown> | null;
}) {
  const {
    profile,
    skills = [],
    experiences = [],
    cv = null,
  } = options;

  const sequences: { rows: unknown[]; terminal: SelectTerminal }[] = [
    { rows: profile ? [profile] : [], terminal: "limit" },
    { rows: skills, terminal: "orderBy" },
    { rows: experiences, terminal: "orderBy" },
    { rows: cv ? [cv] : [], terminal: "limit" },
  ];

  let selectIndex = 0;

  getDbMock.mockReturnValue({
    select: vi.fn(() => {
      const step = sequences[selectIndex];
      selectIndex += 1;
      if (!step) {
        throw new Error("Unexpected extra select() call");
      }
      return makeSelectChain(step.rows, step.terminal);
    }),
  });
}

describe("getProfile", () => {
  beforeEach(() => {
    getDbMock.mockReset();
  });

  it("maps DB rows into ProfileDto with defaults for nullable fields", async () => {
    const uploadedAt = new Date("2024-06-01T12:00:00.000Z");
    const atsAnalyzedAt = new Date("2024-06-02T08:00:00.000Z");

    mockDbForGetProfile({
      profile: {
        id: 1,
        fullName: "Ada Lovelace",
        headline: null,
        email: null,
        phone: null,
        locationLabel: "Paris",
        searchRadiusKm: 40,
        remotePreference: "remote",
        minSalaryAnnualGross: 55_000,
        contractTypes: ["cdi"],
      },
      skills: [
        { id: 1, label: "TypeScript", sortOrder: 0 },
        { id: 2, label: "Node", sortOrder: 1 },
      ],
      experiences: [
        {
          id: 10,
          title: "Ingénieure",
          company: "ACME",
          location: null,
          startDate: "2019-03-01",
          endDate: "2022-12-31",
          description: "Backend",
          sortOrder: 0,
        },
      ],
      cv: {
        originalFilename: "cv.pdf",
        mimeType: "application/pdf",
        extractedText: "Experience…",
        uploadedAt,
        atsScore: 82,
        atsFindings: [
          {
            code: "missing_email",
            severity: "warning",
            category: "contact",
            message: "Email absent du CV",
            pointsDeducted: 5,
          },
        ],
        atsAnalyzedAt,
      },
    });

    const dto = await getProfile();

    expect(dto).toEqual({
      fullName: "Ada Lovelace",
      headline: "",
      email: "",
      phone: "",
      locationLabel: "Paris",
      searchRadiusKm: 40,
      remotePreference: "remote",
      minSalaryAnnualGross: 55_000,
      contractTypes: ["cdi"],
      skills: [
        { id: 1, label: "TypeScript", sortOrder: 0 },
        { id: 2, label: "Node", sortOrder: 1 },
      ],
      experiences: [
        {
          id: 10,
          title: "Ingénieure",
          company: "ACME",
          location: "",
          startDate: "2019-03-01",
          endDate: "2022-12-31",
          description: "Backend",
          sortOrder: 0,
        },
      ],
      cv: {
        originalFilename: "cv.pdf",
        mimeType: "application/pdf",
        extractedText: "Experience…",
        uploadedAt,
        atsScore: 82,
        atsFindings: [
          {
            code: "missing_email",
            severity: "warning",
            category: "contact",
            message: "Email absent du CV",
            pointsDeducted: 5,
          },
        ],
        atsAnalyzedAt,
      },
    });
  });

  it("returns cv null when no CV row exists", async () => {
    mockDbForGetProfile({
      profile: {
        id: 1,
        fullName: "Test",
        headline: "",
        email: "t@example.com",
        phone: "",
        locationLabel: "Lyon",
        searchRadiusKm: 30,
        remotePreference: "flexible",
        minSalaryAnnualGross: null,
        contractTypes: [],
      },
      cv: null,
    });

    const dto = await getProfile();
    expect(dto.cv).toBeNull();
  });

  it("throws when the profile row is missing", async () => {
    mockDbForGetProfile({ profile: null });

    await expect(getProfile()).rejects.toThrow("Profil introuvable.");
  });
});
