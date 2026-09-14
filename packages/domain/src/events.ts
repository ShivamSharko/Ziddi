/**
 * Event-sourced domain. Every state transition is an immutable event.
 * Append-only log — this is what makes Ziddi auditable and safe.
 */
import { z } from "zod";

const timestampSchema = z.bigint();
const caseIdSchema = z.string().ulid();

const baseSchema = z.object({
  id: z.string().ulid(),
  caseId: caseIdSchema,
  at: timestampSchema,
  actor: z.discriminatedUnion("type", [
    z.object({ type: z.literal("Citizen"), id: z.string() }),
    z.object({ type: z.literal("Agent"), runId: z.string() }),
    z.object({ type: z.literal("System") }),
  ]),
});

export const caseOpenedSchema = baseSchema.extend({
  type: z.literal("CaseOpened"),
  kind: z.enum([
    "CivicPothole", "CivicGarbage", "CivicWater",
    "LandlordDeposit", "ConsumerRefund",
    "RtiFiling", "RtiAppeal",
    "AadhaarUpdate", "ElectricityBill", "TelecomRefund",
  ]),
  summary: z.string().min(10).max(500),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(50),
  urgency: z.enum(["Emergency", "High", "Standard", "Low"]),
  amountPaise: z.bigint().optional(),
});

export const evidenceAttachedSchema = baseSchema.extend({
  type: z.literal("EvidenceAttached"),
  evidenceId: z.string().ulid(),
  mimeType: z.string(),
  description: z.string(),
  hashSha256: z.string().length(64),
});

export const draftPreparedSchema = baseSchema.extend({
  type: z.literal("DraftPrepared"),
  draftId: z.string().ulid(),
  stage: z.enum(["DemandNotice", "FirstAppeal", "SecondAppeal", "RtiApplication", "ConsumerComplaint", "SocialPack"]),
  language: z.enum(["en", "hi", "en-IN-hinglish"]),
  body: z.string(),
  confidence: z.number().min(0).max(1),
});

export const draftApprovedSchema = baseSchema.extend({
  type: z.literal("DraftApproved"),
  draftId: z.string().ulid(),
});

export const draftRejectedSchema = baseSchema.extend({
  type: z.literal("DraftRejected"),
  draftId: z.string().ulid(),
  reason: z.string().optional(),
});

export const filedExternallySchema = baseSchema.extend({
  type: z.literal("FiledExternally"),
  portal: z.string(),
  referenceId: z.string(),
  filedAt: timestampSchema,
});

export const slaEscalatedSchema = baseSchema.extend({
  type: z.literal("SlaEscalated"),
  reason: z.enum(["FirstResponseOverdue", "ResolutionOverdue", "AutoFollowUp"]),
  nextStage: z.string(),
});

export const caseClosedSchema = baseSchema.extend({
  type: z.literal("CaseClosed"),
  outcome: z.enum(["Resolved", "Withdrawn", "Stale"]),
  amountRecoveredPaise: z.bigint().optional(),
});

export const domainEventSchema = z.discriminatedUnion("type", [
  caseOpenedSchema,
  evidenceAttachedSchema,
  draftPreparedSchema,
  draftApprovedSchema,
  draftRejectedSchema,
  filedExternallySchema,
  slaEscalatedSchema,
  caseClosedSchema,
]);

export type DomainEvent = z.infer<typeof domainEventSchema>;
export type CaseOpened = z.infer<typeof caseOpenedSchema>;
export type EvidenceAttached = z.infer<typeof evidenceAttachedSchema>;
export type DraftPrepared = z.infer<typeof draftPreparedSchema>;
export type DraftApproved = z.infer<typeof draftApprovedSchema>;
export type DraftRejected = z.infer<typeof draftRejectedSchema>;
export type FiledExternally = z.infer<typeof filedExternallySchema>;
export type SlaEscalated = z.infer<typeof slaEscalatedSchema>;
export type CaseClosed = z.infer<typeof caseClosedSchema>;

