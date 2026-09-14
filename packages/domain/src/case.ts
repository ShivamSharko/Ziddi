/**
 * The Case aggregate. Event-sourced. Immutable state computed by folding events.
 * Pure — no side effects, no DB, no AI.
 */
import { ok, err, Result } from "./result.js";
import type { DomainError } from "./result.js";
import { Sla } from "./sla.js";
import type { CaseKind, Urgency } from "./sla.js";
import { Money, type Paise } from "./money.js";
import type { DomainEvent } from "./events.js";

export type CaseStatus =
  | "Intake"
  | "Evidence"
  | "Drafting"
  | "AwaitingApproval"
  | "Filed"
  | "Tracking"
  | "Escalating"
  | "Resolved"
  | "Withdrawn";

export interface CaseState {
  readonly id: string;
  readonly kind: CaseKind;
  readonly summary: string;
  readonly city: string;
  readonly state: string;
  readonly urgency: Urgency;
  readonly status: CaseStatus;
  readonly amountPaise: Paise;
  readonly openedAtMs: bigint;
  readonly evidenceCount: number;
  readonly currentDraftId: string | null;
  readonly filedReference: string | null;
  readonly events: ReadonlyArray<DomainEvent>;
}

export const initialState = (): CaseState => ({
  id: "",
  kind: "CivicPothole",
  summary: "",
  city: "",
  state: "",
  urgency: "Standard",
  status: "Intake",
  amountPaise: Money.zero(),
  openedAtMs: 0n,
  evidenceCount: 0,
  currentDraftId: null,
  filedReference: null,
  events: [],
});

export const fold = (state: CaseState, event: DomainEvent): CaseState => {
  switch (event.type) {
    case "CaseOpened":
      return {
        ...state,
        id: event.caseId,
        kind: event.kind,
        summary: event.summary,
        city: event.city,
        state: event.state,
        urgency: event.urgency,
        amountPaise: event.amountPaise ?? Money.zero(),
        openedAtMs: event.at,
        status: "Evidence",
        events: [...state.events, event],
      };
    case "EvidenceAttached":
      return {
        ...state,
        evidenceCount: state.evidenceCount + 1,
        status: state.status === "Evidence" && state.evidenceCount >= 0 ? "Drafting" : state.status,
        events: [...state.events, event],
      };
    case "DraftPrepared":
      return {
        ...state,
        currentDraftId: event.draftId,
        status: "AwaitingApproval",
        events: [...state.events, event],
      };
    case "DraftApproved":
      return {
        ...state,
        currentDraftId: null,
        status: "Filed",
        events: [...state.events, event],
      };
    case "DraftRejected":
      return {
        ...state,
        currentDraftId: null,
        status: "Drafting",
        events: [...state.events, event],
      };
    case "FiledExternally":
      return {
        ...state,
        filedReference: event.referenceId,
        status: "Tracking",
        events: [...state.events, event],
      };
    case "SlaEscalated":
      return {
        ...state,
        status: "Escalating",
        events: [...state.events, event],
      };
    case "CaseClosed":
      return {
        ...state,
        status: event.outcome === "Resolved" ? "Resolved" : "Withdrawn",
        amountPaise: event.amountRecoveredPaise !== undefined ? event.amountRecoveredPaise : state.amountPaise,
        events: [...state.events, event],
      };
  }
};

export const rehydrate = (events: ReadonlyArray<DomainEvent>): Result<CaseState, DomainError> => {
  if (events.length === 0) {
    return err({ kind: "InvariantBroken", invariant: "non-empty-event-stream", message: "Cannot rehydrate from empty stream" });
  }
  const state = events.reduce(fold, initialState());
  return ok(state);
};

export const isSlaOverdue = (state: CaseState, nowMs: bigint): boolean => {
  const window = Sla.windowFor(state.kind, state.urgency);
  return Sla.isOverdue(window, state.openedAtMs, nowMs);
};

export const remainingMs = (state: CaseState, nowMs: bigint): bigint => {
  const window = Sla.windowFor(state.kind, state.urgency);
  return Sla.remainingMs(window, state.openedAtMs, nowMs);
};

