/**
 * Legal-adjacent drafter: produces demand notices, RTI applications, appeal letters.
 * Uses gemini-3.1-pro for quality (this is high-stakes output).
 * NEVER auto-files — always human approval.
 */
import { z } from "zod";
import type { GeminiClient } from "../client";
import type { DomainError, Result } from "@ziddi/domain";

export const draftStageSchema = z.enum([
  "DemandNotice", "FirstAppeal", "SecondAppeal",
  "RtiApplication", "ConsumerComplaint", "SocialPack",
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
});

export type Draft = z.infer<typeof draftSchema>;

export const SYSTEM_INSTRUCTION = `You are Ziddi's drafting assistant. Produce formal grievance documents for Indian citizens.

CRITICAL RULES:
1. NEVER claim you are a lawyer. Always include disclaimer that this is "informational assistance, not legal advice."
2. Cite real Indian laws where applicable (RTI Act 2005, Consumer Protection Act 2019, state Rent Control Acts, etc.)
3. Use appropriate tone: firm for demand notices, respectful for RTI, factual for consumer complaints.
4. Support Hindi or Hinglish output with proper formal structure.
5. Include clear deadlines (typically 15 days for demand notices, 30 for RTI).
6. Never guarantee outcomes.
7. Reference relevant forums: CPGRAMS, e-Daakhil (consumer courts), state rent tribunals.

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

Produce a formal document ready to send.`;

  return client.generateStructured(prompt, draftSchema, {
    model: "gemini-3.8-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
    temperature: 0.3,
  });
};

