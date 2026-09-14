/**
 * Evidence checklist generator: tells citizen what proof to collect.
 * Indians keep receipts — we turn that habit into a structured vault.
 */
import { z } from "zod";
import type { GeminiClient } from "../client";
import type { DomainError, Result } from "@ziddi/domain";

export const evidenceChecklistSchema = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      why: z.string(),
      howToCapture: z.string(),
      priority: z.enum(["Must", "Should", "NiceToHave"]),
    }),
  ).min(1).max(8),
  tone: z.string(),
});

export type EvidenceChecklist = z.infer<typeof evidenceChecklistSchema>;

export const SYSTEM_INSTRUCTION = `You are Ziddi's evidence advisor. Generate a tight checklist of what proof the citizen should collect.
Keep tone warm but firm — the citizen may be frustrated or anxious.
Be specific to Indian contexts: UPI screenshots, rental agreements, WhatsApp chat exports, municipal receipts, photographs with date stamps.
Max 8 items. Mark priority Must/Should/NiceToHave.
Output ONLY JSON.`;

export const evidenceChecklist = async (
  client: GeminiClient,
  caseSummary: string,
  caseKind: string,
): Promise<Result<EvidenceChecklist, DomainError>> =>
  client.generateStructured(
    `Case kind: ${caseKind}\nSummary: ${caseSummary}\n\nGenerate evidence checklist.`,
    evidenceChecklistSchema,
    {
      model: "gemini-3.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.3,
    },
  );

