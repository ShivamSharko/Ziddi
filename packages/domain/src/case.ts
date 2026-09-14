/**
 * The Case aggregate. Event-sourced. Immutable state computed by folding events.
 * Pure — no side effects, no DB, no AI.
 */
import { ok, err, Result } from "./result";
import type { DomainError } from "./result";
import { Sla } from "./sla";
import type { CaseKind, Urgency } from "./sla";
import { Money, type Paise } from "./money";
import type { DomainEvent } from "./events";

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

export interface EvidenceRef {
  readonly evidenceId: string;
  readonly description: string;
  readonly mimeType: string;
  readonly dataUrl?: string;
}

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
  readonly anonymous: boolean;
  readonly evidence: ReadonlyArray<EvidenceRef>;
  readonly votes: number;
  readonly voters: ReadonlyArray<string>;
  readonly citizenToken: string | null;
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
  anonymous: false,
  evidence: [],
  votes: 0,
  voters: [],
  citizenToken: null,
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
        anonymous: event.anonymous ?? false,
        citizenToken: event.citizenToken ?? null,
        amountPaise: (event.amountPaise !== undefined ? event.amountPaise : Money.zero()) as Paise,
        openedAtMs: event.at,
        status: "Evidence",
        events: [...state.events, event],
      };
    case "EvidenceAttached":
      return {
        ...state,
        evidenceCount: state.evidenceCount + 1,
        evidence: [
          ...state.evidence,
          {
            evidenceId: event.evidenceId,
            description: event.description,
            mimeType: event.mimeType,
            ...(event.dataUrl !== undefined ? { dataUrl: event.dataUrl } : {}),
          },
        ],
        status: state.status === "Evidence" ? "Drafting" : state.status,
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
    case "CommunityUpvote":
      if (state.voters.includes(event.voterToken)) {
        return state;
      }
      return {
        ...state,
        votes: state.votes + 1,
        voters: [...state.voters, event.voterToken],
        events: [...state.events, event],
      };
    case "CaseClosed":
      return {
        ...state,
        status: event.outcome === "Resolved" ? "Resolved" : "Withdrawn",
        amountPaise: (event.amountRecoveredPaise !== undefined ? event.amountRecoveredPaise : state.amountPaise) as Paise,
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


export const STAGE_PROGRESS: Record<CaseStatus, number> = {
  Intake: 5,
  Evidence: 20,
  Drafting: 40,
  AwaitingApproval: 60,
  Filed: 75,
  Tracking: 85,
  Escalating: 90,
  Resolved: 100,
  Withdrawn: 100,
};

export const stageProgress = (state: CaseState): number => STAGE_PROGRESS[state.status];

export const persistencePercentile = (state: CaseState, nowMs: bigint): number => {
  const daysActive = Number(nowMs - state.openedAtMs) / 86_400_000;
  const approvals = state.events.filter((e) => e.type === "DraftApproved").length;
  const score =
    35 +
    state.evidence.length * 12 +
    approvals * 18 +
    Math.min(Math.max(daysActive, 0), 30) * 0.8;
  return Math.max(5, Math.min(99, Math.round(score)));
};
