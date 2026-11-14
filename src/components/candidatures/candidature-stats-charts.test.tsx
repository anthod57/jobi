/**
 * @vitest-environment jsdom
 */
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { CandidatureStats } from "@/lib/candidatures/types";
import { renderWithTheme } from "@/test/render-ui";

import { CandidatureStatsCharts } from "./candidature-stats-charts";

const SAMPLE_STATS: CandidatureStats = {
  totalApplications: 8,
  byStatus: {
    draft: 3,
    validated: 2,
    sent: 2,
    archived: 1,
  },
  totalPromptTokens: 4200,
  totalCompletionTokens: 1800,
  totalTokens: 6000,
  totalCostUsd: 0.0145,
  usageByProvider: [
    { provider: "mistral", calls: 5, totalTokens: 3500, costUsd: 0.0045 },
    { provider: "openai", calls: 3, totalTokens: 2500, costUsd: 0.01 },
  ],
};

describe("CandidatureStatsCharts", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the 4 KPI cards with accurate totals", () => {
    renderWithTheme(<CandidatureStatsCharts stats={SAMPLE_STATS} />);

    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();

    expect(screen.getByText("En préparation")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();

    expect(screen.getByText("Envoyées")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    expect(screen.getByText("Coût LLM estimé")).toBeInTheDocument();
    expect(screen.getByText("$0.0145")).toBeInTheDocument();
  });

  it("renders accessible SVG charts with role='img', aria-label, status counts, and provider usage", () => {
    renderWithTheme(<CandidatureStatsCharts stats={SAMPLE_STATS} />);

    const statusChart = screen.getByRole("img", {
      name: /Répartition des candidatures par statut/i,
    });
    expect(statusChart.tagName.toLowerCase()).toBe("svg");

    const llmChart = screen.getByRole("img", {
      name: /Consommation tokens et coût LLM par fournisseur/i,
    });
    expect(llmChart.tagName.toLowerCase()).toBe("svg");

    expect(screen.getByText(/Mistral/i)).toBeInTheDocument();
    expect(screen.getByText(/OpenAI/i)).toBeInTheDocument();
    expect(screen.getByText(/4.*200/)).toBeInTheDocument();
    expect(screen.getByText(/1.*800/)).toBeInTheDocument();
  });

  it("handles empty stats gracefully without NaN", () => {
    renderWithTheme(
      <CandidatureStatsCharts
        stats={{
          totalApplications: 0,
          byStatus: { draft: 0, validated: 0, sent: 0, archived: 0 },
          totalPromptTokens: 0,
          totalCompletionTokens: 0,
          totalTokens: 0,
          totalCostUsd: 0,
          usageByProvider: [],
        }}
      />,
    );

    expect(screen.getByText("$0.0000")).toBeInTheDocument();
    expect(
      screen.getByText(/Aucune consommation LLM enregistrée/i),
    ).toBeInTheDocument();
  });
});
