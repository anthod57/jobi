import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <FlowbiteThemeProvider>{children}</FlowbiteThemeProvider>
      </body>
    </html>
  );
}
