import { en } from "./en";
import { hi } from "./hi";
import { hinglish } from "./hinglish";

export type Language = "en" | "hi" | "hinglish";

export const translations = {
  en,
  hi,
  hinglish,
} as const;

export const t = (lang: Language, key: string): string => {
  const keys = key.split(".");
  let value: any = translations[lang];
  for (const k of keys) {
    if (value === undefined || typeof value !== "object") {
      return key;
    }
    value = value[k];
  }
  return typeof value === "string" ? value : key;
};

