/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let mockPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

import { AppShell } from "@/components/layout/app-shell";
import { renderWithTheme } from "@/test/render-ui";

describe("AppShell", () => {
  beforeEach(() => {
    mockPathname = "/";
  });

  afterEach(() => {
    cleanup();
  });

  it("renders main navigation links and marks active route with aria-current='page'", () => {
    mockPathname = "/profil";
    renderWithTheme(
      <AppShell>
        <div>Contenu test</div>
      </AppShell>,
    );

    expect(screen.getByText("Contenu test")).toBeInTheDocument();

    const nav = screen.getByRole("navigation", { name: "Navigation principale" });
    const homeLink = within(nav).getByRole("link", { name: /Tableau de bord/i });
    const offersLink = within(nav).getByRole("link", { name: /Offres/i });
    const appsLink = within(nav).getByRole("link", { name: /Candidatures/i });
    const profileLink = within(nav).getByRole("link", { name: /Mon profil/i });

    expect(homeLink).toHaveAttribute("href", "/");
    expect(offersLink).toHaveAttribute("href", "/offres");
    expect(appsLink).toHaveAttribute("href", "/candidatures");
    expect(profileLink).toHaveAttribute("href", "/profil");

    expect(profileLink).toHaveAttribute("aria-current", "page");
    expect(homeLink).not.toHaveAttribute("aria-current", "page");
  });

  it("renders header controls (theme toggle, mobile menu button) and footer", () => {
    renderWithTheme(
      <AppShell>
        <div>Page</div>
      </AppShell>,
    );

    const menuButton = screen.getByRole("button", { name: /ouvrir le menu/i });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
