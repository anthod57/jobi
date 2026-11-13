/**
 * @vitest-environment jsdom
 */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithTheme } from "@/test/render-ui";

import { Button } from "./button";

describe("Button", () => {
  it("renders children", () => {
    renderWithTheme(<Button color="primary">Enregistrer</Button>);
    expect(
      screen.getByRole("button", { name: "Enregistrer" }),
    ).toBeInTheDocument();
  });

  it("disables and shows spinner when processing", () => {
    renderWithTheme(
      <Button color="primary" isProcessing>
        Envoi
      </Button>,
    );
    const button = screen.getByRole("button", { name: /Envoi/i });
    expect(button).toBeDisabled();
    expect(button.querySelector("svg")).toBeTruthy();
  });
});
