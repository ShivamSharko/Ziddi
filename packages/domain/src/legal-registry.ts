/**
 * 2026 Government of India statutory deadlines and legal rules.
 * Pure, deterministic, testable. Never in LLM.
 * Sources: RTI Act 2005, CPA 2019, CPGRAMS rules (Aug 2024), Karnataka Rent Act, Sakala Act.
 */

export interface StatutoryDeadline {
  readonly stage: string;
  readonly days: number;
  readonly legalCitation: string;
  readonly description: string;
}

export interface LegalRule {
  readonly caseKind: string;
  readonly jurisdiction: string;
  readonly deadlines: ReadonlyArray<StatutoryDeadline>;
  readonly relevantActs: ReadonlyArray<string>;
}

export const LEGAL_REGISTRY: ReadonlyArray<LegalRule> = [
  {
    caseKind: "CivicPothole",
    jurisdiction: "Central",
    relevantActs: ["CPGRAMS (Centralized Public Grievance Redress and Monitoring System)"],
    deadlines: [
      {
        stage: "DemandNotice",
        days: 21,
        legalCitation: "CPGRAMS Rules 2024 (revised Aug 24, 2024)",
        description: "Grievance redressal within 21 days; interim reply with reasons if delayed",
      },
      {
        stage: "FirstAppeal",
        days: 30,
        legalCitation: "CPGRAMS Appeal Rules",
        description: "Appeal to nodal officer within 30 days of no response",
      },
    ],
  },
  {
    caseKind: "CivicGarbage",
    jurisdiction: "Central",
    relevantActs: ["CPGRAMS"],
    deadlines: [
      {
        stage: "DemandNotice",
        days: 21,
        legalCitation: "CPGRAMS Rules 2024",
        description: "Grievance redressal within 21 days",
      },
      {
        stage: "FirstAppeal",
        days: 30,
        legalCitation: "CPGRAMS Appeal Rules",
        description: "Appeal within 30 days",
      },
    ],
  },
  {
    caseKind: "CivicWater",
    jurisdiction: "Central",
    relevantActs: ["CPGRAMS"],
    deadlines: [
      {
        stage: "DemandNotice",
        days: 21,
        legalCitation: "CPGRAMS Rules 2024",
        description: "Grievance redressal within 21 days",
      },
      {
        stage: "FirstAppeal",
        days: 30,
        legalCitation: "CPGRAMS Appeal Rules",
        description: "Appeal within 30 days",
      },
    ],
  },
  {
    caseKind: "LandlordDeposit",
    jurisdiction: "Karnataka",
    relevantActs: [
      "Karnataka Rent and Tenancy Act, 2019",
      "Model Tenancy Act, 2021 (Central)",
    ],
    deadlines: [
      {
        stage: "DemandNotice",
        days: 30,
        legalCitation: "Model Tenancy Act, 2021, Section on deposit refund",
        description:
          "Landlord must refund security deposit within 30 days of tenant vacating; deductions must be communicated with receipts",
      },
      {
        stage: "FirstAppeal",
        days: 60,
        legalCitation: "Karnataka Rent Act, 2019",
        description: "Approach Rent Authority if deposit not refunded within 30 days",
      },
      {
        stage: "SecondAppeal",
        days: 90,
        legalCitation: "Karnataka Rent Act, 2019",
        description: "Appeal to Rent Tribunal",
      },
    ],
  },
  {
    caseKind: "ConsumerRefund",
    jurisdiction: "Central",
    relevantActs: ["Consumer Protection Act, 2019 (No. 35 of 2019)"],
    deadlines: [
      {
        stage: "DemandNotice",
        days: 15,
        legalCitation: "CPA 2019, Section 35",
        description: "Send legal notice demanding refund within 15 days",
      },
      {
        stage: "ConsumerComplaint",
        days: 730,
        legalCitation: "CPA 2019, Section 69",
        description:
          "File consumer complaint within 2 years from cause of action; admissibility decided within 21 days of filing",
      },
      {
        stage: "FirstAppeal",
        days: 45,
        legalCitation: "CPA 2019, Section 41",
        description: "Appeal to State Commission within 45 days of District Commission order",
      },
    ],
  },
  {
    caseKind: "RtiFiling",
    jurisdiction: "Central",
    relevantActs: ["Right to Information Act, 2005 (No. 22 of 2005)"],
    deadlines: [
      {
        stage: "RtiApplication",
        days: 30,
        legalCitation: "RTI Act 2005, Section 7(1)",
        description: "PIO must reply within 30 days of receiving RTI application",
      },
      {
        stage: "FirstAppeal",
        days: 30,
        legalCitation: "RTI Act 2005, Section 19(1)",
        description:
          "First appeal to First Appellate Authority within 30 days of PIO reply (or 60 days if no reply)",
      },
      {
        stage: "SecondAppeal",
        days: 90,
        legalCitation: "RTI Act 2005, Section 19(3)",
        description: "Second appeal to Information Commission within 90 days of FAA decision",
      },
    ],
  },
  {
    caseKind: "RtiAppeal",
    jurisdiction: "Central",
    relevantActs: ["RTI Act, 2005"],
    deadlines: [
      {
        stage: "FirstAppeal",
        days: 30,
        legalCitation: "RTI Act 2005, Section 19(1)",
        description: "First appeal within 30 days of PIO decision",
      },
      {
        stage: "SecondAppeal",
        days: 90,
        legalCitation: "RTI Act 2005, Section 19(3)",
        description: "Second appeal within 90 days of FAA order",
      },
    ],
  },
  {
    caseKind: "AadhaarUpdate",
    jurisdiction: "Central",
    relevantActs: ["Aadhaar Act, 2016", "CPGRAMS"],
    deadlines: [
      {
        stage: "DemandNotice",
        days: 21,
        legalCitation: "CPGRAMS Rules 2024",
        description: "UIDAI grievance redressal within 21 days",
      },
      {
        stage: "FirstAppeal",
        days: 30,
        legalCitation: "Aadhaar Act, 2016, Grievance Redressal Rules",
        description: "Appeal to UIDAI Regional Office within 30 days",
      },
    ],
  },
  {
    caseKind: "ElectricityBill",
    jurisdiction: "Karnataka",
    relevantActs: ["Karnataka Sakala Act, 2011", "Electricity Act, 2003"],
    deadlines: [
      {
        stage: "DemandNotice",
        days: 21,
        legalCitation: "Sakala Act, 2011",
        description: "ESCOM must respond within 21 days under Sakala",
      },
      {
        stage: "FirstAppeal",
        days: 30,
        legalCitation: "Sakala Act, 2011",
        description: "Appeal to designated officer within 30 days",
      },
    ],
  },
  {
    caseKind: "TelecomRefund",
    jurisdiction: "Central",
    relevantActs: ["Telecom Regulatory Authority of India Act, 1997", "CPA 2019"],
    deadlines: [
      {
        stage: "DemandNotice",
        days: 15,
        legalCitation: "TRAI Consumer Protection Regulations",
        description: "Demand refund from telecom operator within 15 days",
      },
      {
        stage: "ConsumerComplaint",
        days: 730,
        legalCitation: "CPA 2019, Section 69",
        description: "Consumer complaint within 2 years",
      },
    ],
  },
];

export const getLegalRule = (caseKind: string): LegalRule | undefined =>
  LEGAL_REGISTRY.find((rule) => rule.caseKind === caseKind);

export const getDeadline = (caseKind: string, stage: string): StatutoryDeadline | undefined => {
  const rule = getLegalRule(caseKind);
  if (rule === undefined) return undefined;
  return rule.deadlines.find((d) => d.stage === stage);
};
