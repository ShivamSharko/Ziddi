import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider, LanguageToggle } from "@/components/language-provider";
import { NavLinks, FooterText } from "@/components/site-chrome-text";

export const metadata: Metadata = {
  title: "Ziddi — The AI agent that never gives up on your grievance",
  description: "India's citizen-side follow-through engine for potholes, deposits, RTIs, and consumer refunds. Built with Gemini.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <LanguageProvider>
          <header className="border-b border-[var(--border)] bg-white/80 backdrop-blur sticky top-0 z-50">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🦾</span>
                <span className="font-bold text-xl">Ziddi</span>
                <span className="text-xs text-gray-500 hidden sm:inline">ज़िद्दी · जिद्दी</span>
              </div>
              <nav className="flex items-center gap-4 text-sm">
                <NavLinks />
                <LanguageToggle />
              </nav>
            </div>
          </header>
          <main className="max-w-4xl mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="border-t border-[var(--border)] mt-16 py-6">
            <div className="max-w-4xl mx-auto px-4 text-xs text-gray-500 text-center">
              <FooterText />
            </div>
          </footer>
        </LanguageProvider>
      </body>
    </html>
  );
}
