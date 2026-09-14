/**
 * Formal government-format demand notice template.
 * Includes correct 2026 statutory citations and formal structure.
 */

export const demandNoticeTemplate = (
  citizenName: string,
  recipientTitle: string,
  recipientAddress: string,
  subject: string,
  body: string,
  legalSections: string[],
  amountClaimedRupees: number | undefined,
  deadlineDays: number,
  language: "en" | "hi" | "en-IN-hinglish",
): string => {
  const date = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (language === "hi") {
    return `
तारीख: ${date}

सेवा में,
${recipientTitle}
${recipientAddress}

विषय: ${subject}

महोदय/महोदया,

${body}

${legalSections.length > 0 ? `लागू कानूनी प्रावधान: ${legalSections.join(", ")}` : ""}

${amountClaimedRupees !== undefined ? `दावा की गई राशि: ₹${amountClaimedRupees.toLocaleString("en-IN")}` : ""}

अतः आपसे अनुरोध है कि इस नोटिस की प्राप्ति के ${deadlineDays} दिनों के भीतर उचित कार्यवाही करें। ऐसा न करने पर मुझे उचित कानूनी कार्रवाई करने के लिए बाध्य होना पड़ेगा।

भवदीय,
${citizenName}

---
अस्वीकरण: यह दस्तावेज़ सूचना सहायता है, कानूनी सलाह नहीं। भेजने से पहले किसी वकील से परामर्श करें।
`;
  }

  return `
Date: ${date}

To,
${recipientTitle}
${recipientAddress}

Subject: ${subject}

Respected Sir/Madam,

${body}

${legalSections.length > 0 ? `Relevant Legal Provisions: ${legalSections.join(", ")}` : ""}

${amountClaimedRupees !== undefined ? `Amount Claimed: ₹${amountClaimedRupees.toLocaleString("en-IN")}` : ""}

You are hereby requested to take appropriate action within ${deadlineDays} days from the receipt of this notice. Failure to do so will compel me to initiate appropriate legal proceedings.

Yours faithfully,
${citizenName}

---
Disclaimer: This document is informational assistance, not legal advice. Consult a lawyer before sending.
`;
};
