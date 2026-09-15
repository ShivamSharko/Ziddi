import type { Metadata } from "next";
import { Archivo, Anton, Hind, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider, LanguageToggle } from "@/components/language-provider";
import { CreditLine, FooterText, NavLinks } from "@/components/site-chrome-text";
import { CrosshairMark, ShapeDefs, TechStamp } from "@/components/design-primitives";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-archivo",
});
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});
const hind = Hind({
  subsets: ["latin", "devanagari"],
  weight: ["400", "600"],
  variable: "--font-hind",
});

export const metadata: Metadata = {
  title: "Ziddi — The AI agent that never gives up",
  description:
    "Citizen-side follow-through engine for Indian grievances. Drafts, deadlines, escalation — until your case closes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${archivo.variable} ${anton.variable} ${plexMono.variable} ${hind.variable} font-body min-h-screen bg-[var(--ink)] text-[var(--text)]`}
      >
        <ShapeDefs />
        <LanguageProvider>
          <header className="sticky top-0 z-40 border-b border-[var(--hairline)] bg-[rgba(11,13,16,0.88)] backdrop-blur-sm">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
              <a href="/" className="flex items-center gap-2">
                <CrosshairMark />
                <span className="font-display text-lg font-black tracking-tight">Ziddi</span>
                <span className="font-hind text-sm font-semibold text-[var(--text-2)]">ज़िद्दी</span>
              </a>
              <nav className="flex items-center gap-5">
                <NavLinks />
                <LanguageToggle />
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <footer className="mt-16 border-t border-[var(--hairline)]">
            <div className="mx-auto max-w-6xl space-y-2 px-4 py-6">
              <CreditLine />
              <FooterText />
            </div>
          </footer>
          <TechStamp />
        </LanguageProvider>
      </body>
    </html>
  );
}
