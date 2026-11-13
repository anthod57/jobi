/**
 * @vitest-environment jsdom
 */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithTheme } from "@/test/render-ui";

import { Card } from "./card";

describe("Card", () => {
  it("renders optional title and children", () => {
    renderWithTheme(
      <Card title="Profil">
        <p>Contenu</p>
      </Card>,
    );
    expect(screen.getByRole("heading", { name: "Profil" })).toBeInTheDocument();
    expect(screen.getByText("Contenu")).toBeInTheDocument();
  });
});
