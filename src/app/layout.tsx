import { ThemeModeScript } from "flowbite-react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppShell } from "@/components/layout/app-shell";
import { FlowbiteThemeProvider } from "@/components/providers/flowbite-theme-provider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jobi",
  description:
    "Agrégateur d'offres d'emploi — instance locale pour suivre et candidater.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <ThemeModeScript />
      </head>
      <body className="flex min-h-full flex-col">
        <FlowbiteThemeProvider>
          <AppShell>{children}</AppShell>
        </FlowbiteThemeProvider>
      </body>
    </html>
  );
}
