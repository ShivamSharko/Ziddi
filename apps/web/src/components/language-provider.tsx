"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { LOCALES, translate, type Locale } from "@ziddi/ui";

interface LangContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const LangContext = createContext<LangContextValue>({
  locale: "hinglish",
  setLocale: () => undefined,
  t: (key) => key,
});

export const useLang = () => useContext(LangContext);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("hinglish");

  useEffect(() => {
    const stored = localStorage.getItem("ziddi-locale");
    if (stored === "en" || stored === "hi" || stored === "hinglish") {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("ziddi-locale", l);
  };

  return (
    <LangContext.Provider value={{ locale, setLocale, t: (key) => translate(locale, key) }}>
      {children}
    </LangContext.Provider>
  );
}

export function LanguageToggle() {
  const { locale, setLocale } = useLang();
  return (
    <div
      className="flex items-center gap-1 rounded-md border border-[var(--border)] p-1"
      role="group"
      aria-label="Language selection"
    >
      {LOCALES.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => setLocale(l.id)}
          aria-pressed={locale === l.id}
          className={`px-2 py-1 rounded text-xs ${
            locale === l.id
              ? "bg-[var(--primary)] text-white"
              : "text-gray-600 hover:bg-[var(--muted)]"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

