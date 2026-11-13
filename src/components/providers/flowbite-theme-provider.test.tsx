/**
 * @vitest-environment jsdom
 */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithTheme } from "@/test/render-ui";

import { Button } from "@/components/ui/button";

describe("FlowbiteThemeProvider", () => {
  it("applies semantic primary button styles from theme", () => {
    renderWithTheme(<Button color="primary">Thème</Button>);
    const button = screen.getByRole("button", { name: "Thème" });
    expect(button.className).toMatch(/blue|primary/i);
  });
});
