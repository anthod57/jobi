/**
 * @vitest-environment jsdom
 */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithTheme } from "@/test/render-ui";

import { Alert } from "./alert";

describe("Alert", () => {
  it.each(["info", "success", "warning", "failure"] as const)(
    "renders %s variant",
    (variant) => {
      renderWithTheme(<Alert variant={variant}>Message {variant}</Alert>);
      expect(screen.getByText(`Message ${variant}`)).toBeInTheDocument();
    },
  );
});
