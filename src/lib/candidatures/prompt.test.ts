import { describe, expect, it } from "vitest";

import { buildApplicationPrompt } from "./prompt";

describe("buildApplicationPrompt", () => {
  it("includes offer details, profile headline, skills, experiences, CV excerpt, tone, and custom instructions", () => {
    const prompt = buildApplicationPrompt(
      {
        title: "Développeur Fullstack TypeScript",
        company: "Acme Corp",
        locationLabel: "Paris",
        contractType: "cdi",
        remoteMode: "hybrid",
        description: "Nous recherchons un développeur Next.js et PostgreSQL.",
      },
      {
        headline: "Ingénieur Fullstack 5 ans d'expérience",
        skills: ["TypeScript", "React", "PostgreSQL"],
        experiences: [
          {
            title: "Lead Dev",
            company: "TechSA",
            description: "Architecture microservices et CI/CD.",
          },
        ],
        cvText: "Expérience confirmée en TypeScript et Node.js.",
      },
      "direct",
      "Mentionner la disponibilité immédiate.",
    );

    const combined = `${prompt.system}\n${prompt.user}`;
    expect(combined).toContain("Développeur Fullstack TypeScript");
    expect(combined).toContain("Acme Corp");
    expect(combined).toContain("Paris");
    expect(combined).toContain("cdi");
    expect(combined).toContain("hybrid");
    expect(combined).toContain("Nous recherchons un développeur Next.js et PostgreSQL.");
    expect(combined).toContain("Ingénieur Fullstack 5 ans d'expérience");
    expect(combined).toContain("TypeScript");
    expect(combined).toContain("Lead Dev");
    expect(combined).toContain("TechSA");
    expect(combined).toContain("Architecture microservices et CI/CD.");
    expect(combined).toContain("Expérience confirmée en TypeScript et Node.js.");
    expect(combined).toContain("direct");
    expect(combined).toContain("Mentionner la disponibilité immédiate.");
  });

  it("excludes email, phone, and fullName even if present on input profile object", () => {
    const profileWithPii = {
      fullName: "Jean Dupont-Secret",
      email: "jean.dupont@secret.example.com",
      phone: "+33612345678",
      headline: "Développeur Backend",
      skills: ["Go"],
      experiences: [],
      cvText: "CV sans coordonnées.",
    };

    const prompt = buildApplicationPrompt(
      {
        title: "Dev Go",
        company: "Beta",
        locationLabel: "Lyon",
        contractType: "cdi",
        remoteMode: "remote",
        description: "Poste Go.",
      },
      profileWithPii,
      "professional",
      "",
    );

    const combined = `${prompt.system}\n${prompt.user}`;
    expect(combined).not.toContain("Jean Dupont-Secret");
    expect(combined).not.toContain("jean.dupont@secret.example.com");
    expect(combined).not.toContain("+33612345678");
  });

  it("truncates offer description and CV excerpt to 6000 characters", () => {
    const longDescription = "D".repeat(8000);
    const longCv = "C".repeat(8000);

    const prompt = buildApplicationPrompt(
      {
        title: "Dev",
        company: "Corp",
        locationLabel: "Remote",
        contractType: null,
        remoteMode: null,
        description: longDescription,
      },
      {
        headline: "Dev",
        skills: [],
        experiences: [],
        cvText: longCv,
      },
      "enthusiastic",
      "",
    );

    const dMatches = prompt.user.match(/D/g)?.length ?? 0;
    const cMatches = prompt.user.match(/C/g)?.length ?? 0;
    expect(dMatches).toBeLessThanOrEqual(6000);
    expect(cMatches).toBeLessThanOrEqual(6000);
  });
});
