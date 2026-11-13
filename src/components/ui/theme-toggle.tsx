"use client";

import { DarkThemeToggle } from "flowbite-react";
import type { ComponentProps } from "react";

export type ThemeToggleProps = ComponentProps<typeof DarkThemeToggle>;

export function ThemeToggle({ className, ...props }: ThemeToggleProps) {
  return (
    <DarkThemeToggle
      aria-label="Basculer le thème clair/sombre"
      className={className}
      {...props}
    />
  );
}
