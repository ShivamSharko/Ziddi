/**
 * RTI Act 2005 formal application template with correct 2026 citations.
 */

export const rtiApplicationTemplate = (
  applicantName: string,
  applicantAddress: string,
  pioOffice: string,
  informationRequested: string,
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
लोक सूचना अधिकारी (PIO)
${pioOffice}

विषय: सूचना का अधिकार अधिनियम, 2005 की धारा 6(1) के अंतर्गत सूचना के लिए आवेदन

महोदय/महोदया,

मैं, ${applicantName}, ${applicantAddress} का निवासी, सूचना का अधिकार अधिनियम, 2005 की धारा 6(1) के अंतर्गत निम्नलिखित सूचना प्राप्त करना चाहता हूं:

${informationRequested}

आवेदन शुल्क: ₹10 (Indian Postal Order / Demand Draft / Court Fee Stamp संलग्न)

धारा 7(1) के अनुसार, आपसे अनुरोध है कि 30 दिनों के भीतर सूचना प्रदान करें।

भवदीय,
${applicantName}
${applicantAddress}

---
अस्वीकरण: यह दस्तावेज़ सूचना सहायता है, कानूनी सलाह नहीं।
`;
  }

  return `
Date: ${date}

To,
The Public Information Officer (PIO)
${pioOffice}

Subject: Application for Information under Section 6(1) of the Right to Information Act, 2005

Respected Sir/Madam,

I, ${applicantName}, resident of ${applicantAddress}, hereby request the following information under Section 6(1) of the Right to Information Act, 2005:

${informationRequested}

Application Fee: ₹10 (Indian Postal Order / Demand Draft / Court Fee Stamp enclosed)

As per Section 7(1) of the RTI Act, you are requested to provide the information within 30 days from the date of receipt of this application.

Yours faithfully,
${applicantName}
${applicantAddress}

---
Disclaimer: This document is informational assistance, not legal advice.
`;
};
