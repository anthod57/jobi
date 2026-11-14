/**
 * @vitest-environment jsdom
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGenerateDraftAction,
  mockUpdateApplicationAction,
  mockRouterRefresh,
} = vi.hoisted(() => ({
  mockGenerateDraftAction: vi.fn(),
  mockUpdateApplicationAction: vi.fn(),
  mockRouterRefresh: vi.fn(),
}));

vi.mock("@/app/candidatures/actions", () => ({
  generateDraftAction: mockGenerateDraftAction,
  updateApplicationAction: mockUpdateApplicationAction,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRouterRefresh }),
}));

import type { ApplicationWithOffer } from "@/lib/candidatures/types";
import { renderWithTheme } from "@/test/render-ui";

import { OfferApplicationPanel } from "./offer-application-panel";

const BASE_APPLICATION: ApplicationWithOffer = {
  id: 10,
  offerId: 42,
  status: "draft",
  tone: "professional",
  customInstructions: "",
  draftSubject: "Candidature Développeur React",
  draftBody: "Bonjour, je postule avec intérêt.",
  notes: "",
  provider: "mistral",
  model: "mistral-small-latest",
  sentAt: null,
  createdAt: new Date("2026-11-10T10:00:00Z"),
  updatedAt: new Date("2026-11-10T10:00:00Z"),
  offerTitle: "Développeur React",
  offerCompany: "Acme",
  offerLocationLabel: "Paris",
  offerContractType: "cdi",
  offerRemoteMode: "hybrid",
};

describe("OfferApplicationPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("shows link to /parametres when LLM is not configured", () => {
    renderWithTheme(
      <OfferApplicationPanel
        offerId={42}
        llmConfigured={false}
        activeProviderLabel="Mistral"
        initialApplication={null}
      />,
    );

    expect(screen.getByText(/Préparer ma candidature/i)).toBeInTheDocument();
    const settingsLink = screen.getByRole("link", { name: /Paramètres/i });
    expect(settingsLink).toHaveAttribute("href", "/parametres");
    expect(
      screen.getByRole("button", { name: /Générer le brouillon/i }),
    ).toBeDisabled();
  });

  it("shows privacy notice and submits tone + customInstructions to generateDraftAction", async () => {
    mockGenerateDraftAction.mockResolvedValueOnce({
      ok: true,
      data: { applicationId: 10 },
    });

    renderWithTheme(
      <OfferApplicationPanel
        offerId={42}
        llmConfigured={true}
        activeProviderLabel="Mistral"
        initialApplication={null}
      />,
    );

    expect(screen.getByText(/sans coordonnées/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Ton/i), {
      target: { value: "direct" },
    });
    fireEvent.change(screen.getByLabelText(/Consigne particulière/i), {
      target: { value: "Insister sur TypeScript" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Générer le brouillon/i }),
    );

    await waitFor(() => {
      expect(mockGenerateDraftAction).toHaveBeenCalledWith({
        offerId: 42,
        tone: "direct",
        customInstructions: "Insister sur TypeScript",
      });
    });
    expect(mockRouterRefresh).toHaveBeenCalled();
  });

  it("renders inline editor, saves changes, and copies draft with feedback", async () => {
    mockUpdateApplicationAction.mockResolvedValueOnce({
      ok: true,
      data: undefined,
    });

    renderWithTheme(
      <OfferApplicationPanel
        offerId={42}
        llmConfigured={true}
        activeProviderLabel="Mistral"
        initialApplication={BASE_APPLICATION}
      />,
    );

    const subjectInput = screen.getByLabelText(/Objet/i);
    const bodyInput = screen.getByLabelText(/Message/i);

    fireEvent.change(subjectInput, { target: { value: "Objet modifié" } });
    fireEvent.change(bodyInput, { target: { value: "Corps modifié" } });

    fireEvent.click(screen.getByRole("button", { name: /^Enregistrer$/i }));

    await waitFor(() => {
      expect(mockUpdateApplicationAction).toHaveBeenCalledWith({
        applicationId: 10,
        draftSubject: "Objet modifié",
        draftBody: "Corps modifié",
      });
    });
    expect(screen.getByText(/Brouillon enregistré/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Copier/i }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "Objet : Objet modifié\n\nCorps modifié",
      );
    });
    expect(screen.getByText(/Copié !/i)).toBeInTheDocument();
  });

  it("asks for confirmation before regenerating when draft was edited locally", async () => {
    mockGenerateDraftAction.mockResolvedValueOnce({
      ok: true,
      data: { applicationId: 10 },
    });

    renderWithTheme(
      <OfferApplicationPanel
        offerId={42}
        llmConfigured={true}
        activeProviderLabel="Mistral"
        initialApplication={BASE_APPLICATION}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Message/i), {
      target: { value: "Édition locale non sauvegardée" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Régénérer/i }));

    expect(mockGenerateDraftAction).not.toHaveBeenCalled();
    expect(
      screen.getByText(/modifié localement/i),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Confirmer la régénération/i }),
    );

    await waitFor(() => {
      expect(mockGenerateDraftAction).toHaveBeenCalledWith({
        offerId: 42,
        tone: "professional",
        customInstructions: "",
      });
    });
  });
});
