/**
 * @vitest-environment jsdom
 */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithTheme } from "@/test/render-ui";

import { Input } from "./input";

describe("Input", () => {
  it("renders a text field with label association", () => {
    renderWithTheme(<Input id="email" placeholder="Email" />);
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
  });
});
