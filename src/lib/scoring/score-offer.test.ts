import { describe, expect, it } from "vitest";
import {
  scoreOffer,
  type ScorableOffer,
  type ScorableProfile,
} from "./score-offer";

const baseOffer: ScorableOffer = {
  title: "Développeur Fullstack TypeScript / React",
  company: "Acme",
  locationLabel: "Lyon",
  contractType: "cdi",
  remoteMode: "hybrid",
  salaryMin: 48000,
  salaryMax: 55000,
  description:
    "Nous cherchons un développeur maîtrisant TypeScript, React, PostgreSQL et Docker.",
};

const baseProfile: ScorableProfile = {
  headline: "Développeur Fullstack TypeScript",
  locationLabel: "Lyon",
  remotePreference: "hybrid",
  minSalaryAnnualGross: 45000,
  contractTypes: ["cdi"],
  skills: ["TypeScript", "React", "PostgreSQL", "GraphQL"],
};

describe("scoreOffer", () => {
  it("returns null score and isEmptyProfile=true for an empty profile", () => {
    const emptyProfile: ScorableProfile = {
      headline: "",
      locationLabel: "",
      remotePreference: "flexible",
      minSalaryAnnualGross: null,
      contractTypes: [],
      skills: [],
    };

    const result = scoreOffer(baseOffer, emptyProfile);

    expect(result.score).toBeNull();
    expect(result.breakdown.isEmptyProfile).toBe(true);
    expect(result.breakdown.matchedSkills).toEqual([]);
    expect(result.breakdown.missingSkills).toEqual([]);
    expect(result.breakdown.criteria).toHaveLength(6);
    expect(result.breakdown.criteria.every((c) => c.status === "neutral")).toBe(
      true,
    );
  });

  it("evaluates all 6 weighted criteria deterministically", () => {
    const result = scoreOffer(baseOffer, baseProfile);

    expect(result.breakdown.isEmptyProfile).toBe(false);
    expect(result.breakdown.matchedSkills).toEqual([
      "TypeScript",
      "React",
      "PostgreSQL",
    ]);
    expect(result.breakdown.missingSkills).toEqual(["GraphQL"]);

    const byKey = Object.fromEntries(
      result.breakdown.criteria.map((c) => [c.key, c]),
    );
    expect(byKey.skills.weight).toBe(40);
    expect(byKey.skills.score).toBe(75);
    expect(byKey.skills.status).toBe("partial");

    expect(byKey.title.weight).toBe(15);
    expect(byKey.title.score).toBe(100);
    expect(byKey.title.status).toBe("matched");

    expect(byKey.contract.weight).toBe(15);
    expect(byKey.contract.score).toBe(100);
    expect(byKey.contract.status).toBe("matched");

    expect(byKey.remote.weight).toBe(10);
    expect(byKey.remote.score).toBe(100);
    expect(byKey.remote.status).toBe("matched");

    expect(byKey.salary.weight).toBe(10);
    expect(byKey.salary.score).toBe(100);
    expect(byKey.salary.status).toBe("matched");

    expect(byKey.location.weight).toBe(10);
    expect(byKey.location.score).toBe(100);
    expect(byKey.location.status).toBe("matched");

    // 75*0.4 + 100*0.6 = 30 + 60 = 90
    expect(result.score).toBe(90);
  });

  it("re-weights active criteria when absent criteria are neutral", () => {
    const offerWithoutSalaryOrRemote: ScorableOffer = {
      ...baseOffer,
      remoteMode: null,
      salaryMin: null,
      salaryMax: null,
    };

    const result = scoreOffer(offerWithoutSalaryOrRemote, {
      ...baseProfile,
      skills: ["TypeScript", "React"],
    });

    const byKey = Object.fromEntries(
      result.breakdown.criteria.map((c) => [c.key, c]),
    );
    expect(byKey.remote.status).toBe("neutral");
    expect(byKey.remote.score).toBeNull();
    expect(byKey.salary.status).toBe("neutral");
    expect(byKey.salary.score).toBeNull();
    expect(result.score).toBe(100);
  });

  it("uses NFD accent/case-insensitive token matching without partial false positives", () => {
    const offer: ScorableOffer = {
      ...baseOffer,
      title: "Developpeur JavaScript Senior",
      description: "Stack: JavaScript, Node, SQL.",
      locationLabel: "Évry-Courcouronnes",
    };
    const profile: ScorableProfile = {
      ...baseProfile,
      headline: "Développeur",
      locationLabel: "Evry",
      skills: ["Java", "JavaScript"],
    };

    const result = scoreOffer(offer, profile);

    expect(result.breakdown.matchedSkills).toEqual(["JavaScript"]);
    expect(result.breakdown.missingSkills).toEqual(["Java"]);

    const byKey = Object.fromEntries(
      result.breakdown.criteria.map((c) => [c.key, c]),
    );
    expect(byKey.title.score).toBe(100);
    expect(byKey.location.score).toBe(100);
  });
});
