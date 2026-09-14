/**
 * First Appeal template for RTI Act 2005 Section 19(1).
 */

export const firstAppealTemplate = (
  appellantName: string,
  appellantAddress: string,
  faaOffice: string,
  rtiApplicationDate: string,
  pioReply: string | null,
  groundsOfAppeal: string,
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
प्रथम अपीलीय प्राधिकारी (First Appellate Authority)
${faaOffice}

विषय: सूचना का अधिकार अधिनियम, 2005 की धारा 19(1) के अंतर्गत प्रथम अपील

महोदय/महोदया,

मैं, ${appellantName}, ${appellantAddress} का निवासी, दिनांक ${rtiApplicationDate} को दायर अपने आरटीआई आवेदन के संबंध में प्रथम अपील दायर करता हूं।

${pioReply !== null ? `PIO का जवाब: ${pioReply}` : "PIO ने 30 दिनों के भीतर कोई जवाब नहीं दिया।"}

अपील के आधार:
${groundsOfAppeal}

धारा 19(1) के अनुसार, प्रथम अपील 30 दिनों के भीतर दायर की जानी चाहिए। धारा 19(6) के अनुसार, प्रथम अपीलीय प्राधिकारी को 30 दिनों के भीतर (अधिकतम 45 दिन) निर्णय देना चाहिए।

अतः आपसे अनुरोध है कि मेरी अपील पर विचार करें और उचित आदेश पारित करें।

भवदीय,
${appellantName}
${appellantAddress}

---
अस्वीकरण: यह दस्तावेज़ सूचना सहायता है, कानूनी सलाह नहीं।
`;
  }

  return `
Date: ${date}

To,
The First Appellate Authority (FAA)
${faaOffice}

Subject: First Appeal under Section 19(1) of the Right to Information Act, 2005

Respected Sir/Madam,

I, ${appellantName}, resident of ${appellantAddress}, hereby file this First Appeal in connection with my RTI application dated ${rtiApplicationDate}.

${pioReply !== null ? `PIO's Reply: ${pioReply}` : "The PIO has not provided any reply within 30 days."}

Grounds of Appeal:
${groundsOfAppeal}

As per Section 19(1), the First Appeal must be filed within 30 days. As per Section 19(6), the First Appellate Authority must dispose of the appeal within 30 days (extendable to 45 days).

I therefore request you to consider my appeal and pass appropriate orders.

Yours faithfully,
${appellantName}
${appellantAddress}

---
Disclaimer: This document is informational assistance, not legal advice.
`;
};
