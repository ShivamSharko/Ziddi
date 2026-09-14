export type Locale = "en" | "hi" | "hinglish";

export const LOCALES: ReadonlyArray<{ id: Locale; label: string }> = [
  { id: "en", label: "EN" },
  { id: "hi", label: "हिं" },
  { id: "hinglish", label: "Hinglish" },
];

const dictionaries: Record<Locale, Record<string, string>> = {
  en: {
    "nav.intake": "Intake",
    "nav.cases": "My Cases",
    "hero.title": "Your grievance won't get solved until someone ziddi follows up.",
    "hero.sub": "Ziddi is your AI citizen-advocate: it drafts, tracks deadlines, and escalates until your case closes.",
    "intake.placeholder": "Describe your problem in English, Hindi, or Hinglish...",
    "intake.locality": "Area / locality (e.g. HSR Layout, Andheri West)",
    "intake.submit": "Start My Case →",
    "intake.thinking": "Starting case...",
    "intake.analyzing": "Gemini is analyzing...",
    "intake.idle": "English, Hindi, or Hinglish — all supported",
    "cases.empty": "No cases yet",
    "cases.emptyCta": "Start your first case →",
    "cases.loading": "Loading...",
    "footer.disclaimer": "Ziddi is informational assistance, not legal advice. Always review drafts before submitting.",
    "footer.built": "Built for Fund My Crazy 2026 · Powered by Google Gemini",
  },
  hi: {
    "nav.intake": "शिकायत",
    "nav.cases": "मेरे मामले",
    "hero.title": "आपकी शिकायत तब तक नहीं सुलझेगी जब तक कोई ज़िद्दी होकर पीछे न पड़े।",
    "hero.sub": "ज़िद्दी आपका AI नागरिक-वकील है: ड्राफ्ट बनाता है, डेडलाइन ट्रैक करता है, और मामला बंद होने तक एस्केलेट करता है।",
    "intake.placeholder": "अपनी समस्या अंग्रेज़ी, हिंदी या हिंग्लिश में लिखें...",
    "intake.locality": "क्षेत्र / मोहल्ला (जैसे HSR लेआउट, अंधेरी वेस्ट)",
    "intake.submit": "मेरा मामला शुरू करें →",
    "intake.thinking": "मामला शुरू हो रहा है...",
    "intake.analyzing": "Gemini विश्लेषण कर रहा है...",
    "intake.idle": "अंग्रेज़ी, हिंदी या हिंग्लिश — सब चलता है",
    "cases.empty": "अभी कोई मामला नहीं",
    "cases.emptyCta": "अपना पहला मामला शुरू करें →",
    "cases.loading": "लोड हो रहा है...",
    "footer.disclaimer": "ज़िद्दी सूचनात्मक सहायता है, कानूनी सलाह नहीं। भेजने से पहले ड्राफ्ट ज़रूर जाँचें।",
    "footer.built": "Fund My Crazy 2026 के लिए निर्मित · Google Gemini द्वारा संचालित",
  },
  hinglish: {
    "nav.intake": "Shikayat",
    "nav.cases": "Mere Cases",
    "hero.title": "Aapki shikayat tab tak solve nahi hogi jab tak koi ziddi ho kar peeche na pade.",
    "hero.sub": "Ziddi aapka AI citizen-advocate hai: drafts banata hai, deadlines track karta hai, aur case close hone tak escalate karta hai.",
    "intake.placeholder": "Apni problem English, Hindi ya Hinglish mein likho...",
    "intake.locality": "Area / locality (jaise HSR Layout, Andheri West)",
    "intake.submit": "Start My Case →",
    "intake.thinking": "Case start ho raha hai...",
    "intake.analyzing": "Gemini analyze kar raha hai...",
    "intake.idle": "English, Hindi ya Hinglish — sab chalega",
    "cases.empty": "Koi case nahi hai abhi",
    "cases.emptyCta": "Start your first case →",
    "cases.loading": "Loading...",
    "footer.disclaimer": "Ziddi informational assistance hai, legal advice nahi. Bhejne se pehle drafts review karo.",
    "footer.built": "Built for Fund My Crazy 2026 · Powered by Google Gemini",
  },
};

export const translate = (locale: Locale, key: string): string =>
  dictionaries[locale]?.[key] ?? dictionaries.en[key] ?? key;

