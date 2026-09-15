"use client";

import { usePathname } from "next/navigation";
import { useLang } from "./language-provider";

export function NavLinks() {
  const { t } = useLang();
  const pathname = usePathname();
  const base =
    "nav-link font-mono-data text-xs uppercase tracking-[0.18em] text-[var(--text-2)] hover:text-[var(--text)] pb-0.5";
  return (
    <>
      <a href="/" className={`${base} ${pathname === "/" ? "nav-active" : ""}`}>
        {t("nav.intake")}
      </a>
      <a href="/cases" className={`${base} ${pathname === "/cases" ? "nav-active" : ""}`}>
        {t("nav.cases")}
      </a>
    </>
  );
}

export function CreditLine() {
  return (
    <p className="font-mono-data text-[10px] uppercase tracking-[0.14em] text-[var(--text-2)]">
      CONCEPT &amp; BUILD — ZIDDI TEAM · AI DRAFTING — GOOGLE GEMINI · FOR — FUND MY CRAZY 2026
    </p>
  );
}

export function FooterText() {
  const { t } = useLang();
  return <p className="font-mono-data text-[10px] text-[var(--text-2)]">{t("footer.disclaimer")}</p>;
}

export function HeroText() {
  const { t } = useLang();
  return (
    <>
      <h1 className="font-display text-4xl font-black leading-[0.95] tracking-tight text-white md:text-6xl">
        {t("hero.title")}
      </h1>
      <p className="mt-4 max-w-xl text-white/75">{t("hero.sub")}</p>
    </>
  );
}
