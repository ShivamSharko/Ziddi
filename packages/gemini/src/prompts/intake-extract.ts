/**
 * Intake extraction: takes raw citizen voice/text and produces a structured case.
 * Hinglish-aware. Eval-gated (see evals/).
 */
import { z } from "zod";
import type { GeminiClient } from "../client";
import type { DomainError } from "@ziddi/domain";
import type { Result } from "@ziddi/domain";

export const intakeExtractSchema = z.object({
  kind: z.enum([
    "CivicPothole", "CivicGarbage", "CivicWater",
    "LandlordDeposit", "ConsumerRefund",
    "RtiFiling", "RtiAppeal",
    "AadhaarUpdate", "ElectricityBill", "TelecomRefund",
  ]),
  summary: z.string().min(10).max(500),
  city: z.string().min(2),
  state: z.string().min(2),
  urgency: z.enum(["Emergency", "High", "Standard", "Low"]),
  amountRupees: z.number().nonnegative().optional(),
  detectedLanguage: z.enum(["en", "hi", "en-IN-hinglish"]),
  confidence: z.number().min(0).max(1),
  missingInfo: z.array(z.string()).max(5),
});

export type IntakeExtract = z.infer<typeof intakeExtractSchema>;

export const SYSTEM_INSTRUCTION = `You are Ziddi's intake agent. Extract a structured grievance from a citizen's voice or text.
The citizen speaks in natural Hinglish. Do not correct their language — just extract facts.

Case kinds:
- CivicPothole / CivicGarbage / CivicWater: local civic issues
- LandlordDeposit: security deposit not returned
- ConsumerRefund: product/service refund pending
- RtiFiling / RtiAppeal: Right to Information requests
- AadhaarUpdate: Aadhaar correction requests
- ElectricityBill / TelecomRefund: utility disputes

Urgency:
- Emergency: threat to life/safety, water contamination, no electricity in summer
- High: money > 10000 INR pending, housing at risk, legal deadlines
- Standard: typical delays, smaller amounts
- Low: minor inconvenience

Output ONLY valid JSON matching the schema. If info is missing, list in missingInfo array.`;

export const intakeExtract = async (
  client: GeminiClient,
  rawInput: string,
): Promise<Result<IntakeExtract, DomainError>> =>
  client.generateStructured(rawInput, intakeExtractSchema, {
    model: "gemini-3.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
    temperature: 0.2,
  });

