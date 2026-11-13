import { sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  getProfile,
  saveProfile,
  upsertCvAfterParse,
} from "@/lib/profile/repository";
import { getDb } from "@/server/db/client";
import { profileCv, profileSkills, profiles } from "@/server/db/schema";

import {
  isTestDbAvailable,
  prepareTestDatabase,
  resetProfileFixture,
} from "./db-harness";

const CV_TEXT = [
  "Jane Doe",
  "jane@example.com",
  "+33 6 00 00 00 00",
  "Software Engineer with TypeScript and React experience.",
].join("\n");

const integration = describe.runIf(isTestDbAvailable());

integration("Postgres integration", { concurrent: false }, () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  });

  beforeEach(async () => {
    await resetProfileFixture();
  });

  describe("schema constraints", () => {
    it("rejects search_radius_km outside 0–500", async () => {
      const db = getDb();
      await expect(
        db
          .update(profiles)
          .set({ searchRadiusKm: 501 })
          .where(sql`${profiles.id} = 1`),
      ).rejects.toThrow();
    });

    it("rejects duplicate skill labels per profile (case-insensitive)", async () => {
      const db = getDb();
      await db.insert(profileSkills).values({
        profileId: 1,
        label: "TypeScript",
        sortOrder: 0,
      });
      await expect(
        db.insert(profileSkills).values({
          profileId: 1,
          label: "typescript",
          sortOrder: 1,
        }),
      ).rejects.toThrow();
    });

    it("cascades delete from profiles to CV", async () => {
      const db = getDb();
      await db.insert(profileCv).values({
        profileId: 1,
        originalFilename: "cv.pdf",
        mimeType: "application/pdf",
        extractedText: "Hello",
      });
      await db.delete(profiles).where(sql`${profiles.id} = 1`);
      const rows = await db.select().from(profileCv);
      expect(rows).toHaveLength(0);
    });

    it("rejects ats_score outside 0–100", async () => {
      const db = getDb();
      await expect(
        db.insert(profileCv).values({
          profileId: 1,
          originalFilename: "cv.pdf",
          mimeType: "application/pdf",
          extractedText: "",
          atsScore: 101,
        }),
      ).rejects.toThrow();
    });
  });

  describe("profile repository", () => {
    it("saveProfile and getProfile round-trip PROFILE_ID=1", async () => {
      await saveProfile({
        fullName: "Jane Doe",
        headline: "Backend",
        email: "jane@example.com",
        phone: "+33600000000",
        locationLabel: "Paris",
        searchRadiusKm: 25,
        remotePreference: "hybrid",
        minSalaryAnnualGross: 48_000,
        contractTypes: ["cdi"],
        skills: ["TypeScript", "PostgreSQL"],
        experiences: [
          {
            title: "Dev",
            company: "ACME",
            location: "Paris",
            startDate: "2020-01-01",
            endDate: "2022-06-01",
            description: "APIs",
            sortOrder: 0,
          },
        ],
      });

      const dto = await getProfile();
      expect(dto.fullName).toBe("Jane Doe");
      expect(dto.skills.map((s) => s.label)).toEqual([
        "TypeScript",
        "PostgreSQL",
      ]);
      expect(dto.experiences).toHaveLength(1);
      expect(dto.experiences[0]?.title).toBe("Dev");
    });

    it("upsertCvAfterParse inserts CV and persists ATS fields", async () => {
      await saveProfile({
        fullName: "Jane Doe",
        headline: "",
        email: "jane@example.com",
        phone: "+33600000000",
        locationLabel: "Lyon",
        searchRadiusKm: 30,
        remotePreference: "flexible",
        minSalaryAnnualGross: null,
        contractTypes: [],
        skills: ["TypeScript"],
        experiences: [],
      });

      await upsertCvAfterParse(
        "cv.pdf",
        "application/pdf",
        CV_TEXT,
        ["TypeScript"],
        "jane@example.com",
        "+33600000000",
      );

      const dto = await getProfile();
      expect(dto.cv).not.toBeNull();
      expect(dto.cv?.originalFilename).toBe("cv.pdf");
      expect(dto.cv?.atsScore).not.toBeNull();
      expect(Array.isArray(dto.cv?.atsFindings)).toBe(true);
      expect(dto.cv?.atsAnalyzedAt).toBeInstanceOf(Date);
    });

    it("upsertCvAfterParse updates existing CV row", async () => {
      await saveProfile({
        fullName: "Jane",
        headline: "",
        email: "jane@example.com",
        phone: "",
        locationLabel: "Nantes",
        searchRadiusKm: 20,
        remotePreference: "remote",
        minSalaryAnnualGross: null,
        contractTypes: ["cdd"],
        skills: [],
        experiences: [],
      });

      await upsertCvAfterParse(
        "old.pdf",
        "application/pdf",
        CV_TEXT,
        [],
        "jane@example.com",
        "",
      );
      await upsertCvAfterParse(
        "new.pdf",
        "application/pdf",
        CV_TEXT,
        [],
        "jane@example.com",
        "",
      );

      const dto = await getProfile();
      expect(dto.cv?.originalFilename).toBe("new.pdf");
    });
  });
});
