/**
 * JSON-safe DTOs. The domain uses bigint for money and time (strict by design),
 * but HTTP/JSON cannot serialize bigint. Every API response MUST go through
 * these mappers - this is the single place bigint leaves the system.
 */
import type { CaseState, DomainEvent } from "@ziddi/domain";
import { isSlaOverdue, remainingMs, stageProgress, persistencePercentile } from "@ziddi/domain";

export interface PendingDraftDto {
  readonly draftId: string;
  readonly stage: string;
  readonly language: string;
  readonly body: string;
  readonly confidence: number;
}

export interface EvidenceDto {
  readonly evidenceId: string;
  readonly description: string;
  readonly mimeType: string;
  readonly dataUrl?: string;
}

export interface CaseEventDto {
  readonly type: string;
  readonly at: number;
  readonly actor: string;
  readonly detail: string;
}

export interface CaseSummaryDto {
  readonly id: string;
  readonly kind: string;
  readonly summary: string;
  readonly city: string;
  readonly state: string;
  readonly urgency: string;
  readonly status: string;
  readonly amountRupees: number | null;
  readonly openedAtMs: number;
  readonly evidenceCount: number;
  readonly anonymous: boolean;
  readonly progress: number;
  readonly percentile: number;
  readonly votes: number;
  readonly locality: string | null;
  readonly slaOverdue: boolean;
  readonly slaRemainingMs: number;
}

export interface CaseDetailDto extends CaseSummaryDto {
  readonly events: ReadonlyArray<CaseEventDto>;
  readonly evidence: ReadonlyArray<EvidenceDto>;
  readonly pendingDraft: PendingDraftDto | null;
}

export const toEventDto = (event: DomainEvent): CaseEventDto => {
  const base = { at: Number(event.at), actor: event.actor.type };
  switch (event.type) {
    case "CaseOpened":
      return { ...base, type: event.type, detail: event.summary };
    case "EvidenceAttached":
      return { ...base, type: event.type, detail: event.description };
    case "DraftPrepared":
      return { ...base, type: event.type, detail: `${event.stage} draft prepared (${event.language})` };
    case "DraftApproved":
      return { ...base, type: event.type, detail: "Citizen approved the draft" };
    case "DraftRejected":
      return { ...base, type: event.type, detail: event.reason ?? "Citizen requested changes" };
    case "FiledExternally":
      return { ...base, type: event.type, detail: `Filed on ${event.portal} (ref: ${event.referenceId})` };
    case "SlaEscalated":
      return { ...base, type: event.type, detail: `${event.reason} -> ${event.nextStage}` };
    case "CaseClosed":
      return { ...base, type: event.type, detail: event.outcome };
    case "CommunityUpvote":
      return { ...base, type: event.type, detail: "Community support added (Aadhaar-verified)" };
  }
};

export const toCaseSummary = (state: CaseState, nowMs: bigint): CaseSummaryDto => ({
  id: state.id,
  kind: state.kind,
  summary: state.summary,
  city: state.city,
  state: state.state,
  urgency: state.urgency ?? "Unknown",
  status: state.status ?? "Unknown",
  amountRupees: state.amountPaise !== undefined && state.amountPaise > 0n ? Number(state.amountPaise) / 100 : null,
  openedAtMs: state.openedAtMs !== undefined ? Number(state.openedAtMs) : 0,
  evidenceCount: state.evidenceCount ?? 0,
  anonymous: state.anonymous ?? false,
  progress: stageProgress(state),
  percentile: persistencePercentile(state, nowMs),
  votes: state.votes ?? 0,
  locality: state.locality ?? null,
  slaOverdue: isSlaOverdue(state, nowMs),
  slaRemainingMs: Number(remainingMs(state, nowMs)),
});

export const toCaseDetail = (state: CaseState, nowMs: bigint): CaseDetailDto => {
  const events = state.events.map(toEventDto);
  let pendingDraft: PendingDraftDto | null = null;
  if (state.currentDraftId !== null) {
    for (let i = state.events.length - 1; i >= 0; i--) {
      const e = state.events[i];
      if (e !== undefined && e.type === "DraftPrepared" && e.draftId === state.currentDraftId) {
        pendingDraft = {
          draftId: e.draftId,
          stage: e.stage,
          language: e.language,
          body: e.body,
          confidence: e.confidence,
        };
        break;
      }
    }
  }
  return { ...toCaseSummary(state, nowMs), events, evidence: state.evidence, pendingDraft };
};

