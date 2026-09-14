export const hi = {
  common: {
    save: "सहेजें",
    cancel: "रद्द करें",
    submit: "जमा करें",
    loading: "लोड हो रहा है...",
    error: "कुछ गलत हो गया",
    success: "सफलता",
  },
  intake: {
    title: "हमें बताएं क्या हुआ",
    placeholder: "अपनी शिकायत का विवरण दें...",
    submit: "मेरा केस शुरू करें",
  },
  evidence: {
    title: "अपना सबूत इकट्ठा करें",
    description: "हमें आपका केस बनाने के लिए सबूत चाहिए। फोटो लें, रसीदें सहेजें, चैट स्क्रीनशॉट लें।",
    upload: "सबूत अपलोड करें",
    required: "जरूरी",
    recommended: "अच्छा रहेगा",
  },
  status: {
    intake: "इंटक",
    evidence: "सबूत इकट्ठा कर रहे हैं",
    drafting: "आपका केस तैयार कर रहे हैं",
    awaitingApproval: "आपकी मंजूरी का इंतजार",
    filed: "फाइल किया गया",
    tracking: "ट्रैक कर रहे हैं",
    escalating: "एस्केलेट कर रहे हैं",
    resolved: "समाधान हो गया",
    withdrawn: "वापस ले लिया",
  },
  urgency: {
    Emergency: "आपातकालीन",
    High: "उच्च प्राथमिकता",
    Standard: "मानक",
    Low: "कम प्राथमिकता",
  },
} as const;

