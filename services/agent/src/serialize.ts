/**
 * JSON-safe DTOs. The domain uses bigint for money and time (strict by design),
 * but HTTP/JSON cannot serialize bigint. Every API response MUST go through
 * these mappers - this is the single place bigint leaves the system.
 */
import type { CaseState, DomainEvent } from "@ziddi/domain";
import { isSlaOverdue, remainingMs } from "@ziddi/domain";

export interface PendingDraftDto {
  readonly draftId: string;
  readonly stage: string;
  readonly language: string;
  readonly body: string;
  readonly confidence: number;
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
  readonly amountRupees: number;
  readonly openedAtMs: number;
  readonly evidenceCount: number;
  readonly slaOverdue: boolean;
  readonly slaRemainingMs: number;
}

export interface CaseDetailDto extends CaseSummaryDto {
  readonly events: ReadonlyArray<CaseEventDto>;
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
  }
};

export const toCaseSummary = (state: CaseState, nowMs: bigint): CaseSummaryDto => ({
  id: state.id,
  kind: state.kind,
  summary: state.summary,
  city: state.city,
  state: state.state,
  urgency: state.urgency,
  status: state.status,
  amountRupees: Number(state.amountPaise) / 100,
  openedAtMs: Number(state.openedAtMs),
  evidenceCount: state.evidenceCount,
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
  return { ...toCaseSummary(state, nowMs), events, pendingDraft };
};

