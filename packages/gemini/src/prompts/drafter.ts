/**
 * Legal drafter: produces formal government-format documents with 2026 statutory citations.
 * Uses gemini-3.8-flash for quality.
 * NEVER auto-files — always human approval.
 */
import { z } from "zod";
import type { GeminiClient } from "../client.js";
import type { DomainError, Result } from "@ziddi/domain";
import { getDeadline, ok } from "@ziddi/domain";
import { demandNoticeTemplate } from "./templates/demand-notice.js";
import { rtiApplicationTemplate } from "./templates/rti-application.js";
import { firstAppealTemplate } from "./templates/first-appeal.js";

export const draftStageSchema = z.enum([
  "DemandNotice",
  "FirstAppeal",
  "SecondAppeal",
  "RtiApplication",
  "ConsumerComplaint",
  "SocialPack",
]);

export const draftSchema = z.object({
  stage: draftStageSchema,
  language: z.enum(["en", "hi", "en-IN-hinglish"]),
  recipientTitle: z.string(),
  recipientAddress: z.string(),
  subject: z.string(),
  body: z.string().min(100),
  legalSections: z.array(z.string()).max(10),
  amountClaimedRupees: z.number().nonnegative().optional(),
  deadlineDays: z.number().int().min(3).max(30),
  disclaimer: z.string(),
  confidence: z.number().min(0).max(1),
  formattedDocument: z.string(),
});

export type Draft = z.infer<typeof draftSchema>;

export const SYSTEM_INSTRUCTION = `You are Ziddi's drafting assistant. Produce formal grievance documents for Indian citizens using 2026 statutory citations.

CRITICAL RULES:
1. Use the provided formal template exactly. Fill in all fields.
2. Cite real 2026 Indian laws:
   - RTI Act 2005: Section 6(1), 7(1), 19(1), 19(3), 19(6)
   - Consumer Protection Act 2019: Section 35, 41, 69 (2-year limitation)
   - CPGRAMS Rules 2024: 21-day redressal timeline
   - Model Tenancy Act 2021: 30-day deposit refund
   - Karnataka Rent Act 2019: deposit cap 2-3 months
3. Use statutory deadline days from the deadlineDays field.
4. Include correct legal sections in legalSections array.
5. Tone: formal, firm, respectful.
6. Support Hindi or Hinglish with proper formal structure.
7. Never guarantee outcomes.
8. Reference relevant forums: CPGRAMS, e-Daakhil, Rent Authority, Information Commission.

Output ONLY valid JSON matching the schema.`;

export const draftDocument = async (
  client: GeminiClient,
  context: {
    stage: "DemandNotice" | "FirstAppeal" | "SecondAppeal" | "RtiApplication" | "ConsumerComplaint" | "SocialPack";
    language: "en" | "hi" | "en-IN-hinglish";
    caseSummary: string;
    evidenceSummary: string;
    citizenName: string;
    city: string;
    state: string;
    amountRupees?: number;
  },
): Promise<Result<Draft, DomainError>> => {
  const prompt = `Draft a ${context.stage} in ${context.language}.

Citizen: ${context.citizenName}
Location: ${context.city}, ${context.state}
${context.amountRupees !== undefined ? `Amount: INR ${context.amountRupees}` : ""}

Case summary: ${context.caseSummary}
Evidence available: ${context.evidenceSummary}

Produce a formal document ready to send, using the template structure.`;

  const result = await client.generateStructured(prompt, draftSchema, {
    model: "gemini-3.8-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
    temperature: 0.3,
  });

  if (result.isErr()) {
    return result;
  }

  const draft = result.value;

  let formattedDocument = draft.body;
  if (draft.stage === "DemandNotice") {
    formattedDocument = demandNoticeTemplate(
      context.citizenName,
      draft.recipientTitle,
      draft.recipientAddress,
      draft.subject,
      draft.body,
      draft.legalSections,
      draft.amountClaimedRupees,
      draft.deadlineDays,
      draft.language,
    );
  } else if (draft.stage === "RtiApplication") {
    formattedDocument = rtiApplicationTemplate(
      context.citizenName,
      `${context.city}, ${context.state}`,
      draft.recipientAddress,
      draft.body,
      draft.language,
    );
  } else if (draft.stage === "FirstAppeal") {
    formattedDocument = firstAppealTemplate(
      context.citizenName,
      `${context.city}, ${context.state}`,
      draft.recipientAddress,
      "RTI application date",
      null,
      draft.body,
      draft.language,
    );
  }

  return ok({
    ...draft,
    formattedDocument,
  });
};
