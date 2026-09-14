"use client";

import { useLang } from "./language-provider";

export function NavLinks() {
  const { t } = useLang();
  return (
    <>
      <a href="/" className="hover:underline">
        {t("nav.intake")}
      </a>
      <a href="/cases" className="hover:underline">
        {t("nav.cases")}
      </a>
    </>
  );
}

export function FooterText() {
  const { t } = useLang();
  return (
    <>
      <p>{t("footer.disclaimer")}</p>
      <p>{t("footer.built")}</p>
    </>
  );
}

export function HeroText() {
  const { t } = useLang();
  return (
    <>
      <h1 className="text-3xl md:text-4xl font-bold">{t("hero.title")}</h1>
      <p className="mt-3 text-gray-600">{t("hero.sub")}</p>
    </>
  );
}

