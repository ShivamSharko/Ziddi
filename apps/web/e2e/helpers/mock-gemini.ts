/**
 * Mock Gemini API responses for e2e tests.
 * Route interception happens in each test file.
 */

export const mockIntakeExtract = {
  kind: "LandlordDeposit",
  summary: "Landlord refusing to return security deposit",
  city: "Bengaluru",
  state: "Karnataka",
  urgency: "High",
  amountRupees: 60000,
  detectedLanguage: "en-IN-hinglish",
  confidence: 0.95,
  isGenuineGrievance: true,
  missingInfo: [],
};

export const mockEvidenceChecklist = {
  items: [
    { type: "Rental agreement", required: true },
    { type: "Payment proof", required: true },
    { type: "Communication records", required: false },
  ],
};

export const mockDraft = {
  stage: "DemandNotice",
  language: "en-IN-hinglish",
  recipientTitle: "Landlord",
  recipientAddress: "Bengaluru, Karnataka",
  subject: "Demand for Security Deposit Refund",
  body: "MOCK DRAFT: This is a mock legal demand notice for testing purposes. In production, this would contain proper legal citations and formatting.",
  legalSections: ["Model Tenancy Act 2021", "Contract Act 1872"],
  amountClaimedRupees: 60000,
  deadlineDays: 30,
  disclaimer: "This is a mock document for testing.",
  confidence: 0.92,
  formattedDocument: "MOCK FORMATTED DRAFT CONTENT",
};

