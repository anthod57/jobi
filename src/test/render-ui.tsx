import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import { FlowbiteThemeProvider } from "@/components/providers/flowbite-theme-provider";

function UiProviders({ children }: { children: ReactNode }) {
  return <FlowbiteThemeProvider>{children}</FlowbiteThemeProvider>;
}

export function renderWithTheme(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: UiProviders, ...options });
}
