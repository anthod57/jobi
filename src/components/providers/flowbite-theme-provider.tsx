"use client";

import { ThemeProvider } from "flowbite-react";
import type { ReactNode } from "react";

import { flowbiteTheme } from "@/lib/flowbite-theme";

export function FlowbiteThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={flowbiteTheme}>{children}</ThemeProvider>;
}
