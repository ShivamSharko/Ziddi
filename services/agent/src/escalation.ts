/**
 * Auto-escalation engine. Checks for SLA breaches and drafts next-stage documents.
 * Designed to run as a cron job (e.g., every hour).
 */
import type { CaseRepository } from "./repository";
import type { ZiddiOrchestrator, DraftStage } from "./orchestrator";
import type { CaseState } from "@ziddi/domain";
import { Sla } from "@ziddi/domain";

export interface EscalationResult {
  readonly caseId: string;
  readonly kind: string;
  readonly escalated: boolean;
  readonly reason?: string;
}

const NEXT_STAGE: Record<string, DraftStage | undefined> = {
  Evidence: "DemandNotice",
  Drafting: "DemandNotice",
  Filed: "FirstAppeal",
  Tracking: "FirstAppeal",
  Escalating: "SecondAppeal",
};

export async function checkAndEscalate(
  repo: CaseRepository,
  orchestrator: ZiddiOrchestrator,
  apiKey: string,
): Promise<ReadonlyArray<EscalationResult>> {
  const caseIds = await repo.listCaseIds();
  const results: EscalationResult[] = [];
  const now = BigInt(Date.now());

  for (const caseId of caseIds) {
    const caseResult = await repo.getCase(caseId);
    if (caseResult.isErr()) {
      results.push({ caseId, kind: "unknown", escalated: false, reason: "load-error" });
      continue;
    }

    const state = caseResult.value;
    const isOverdue = Sla.isOverdue(
      Sla.windowFor(state.kind, state.urgency),
      state.openedAtMs,
      now,
    );

    if (!isOverdue) {
      results.push({ caseId, kind: state.kind, escalated: false, reason: "not-overdue" });
      continue;
    }

    const nextStage = NEXT_STAGE[state.status];
    if (nextStage === undefined) {
      results.push({
        caseId,
        kind: state.kind,
        escalated: false,
        reason: "no-next-stage",
      });
      continue;
    }

    if (state.currentDraftId !== null) {
      results.push({
        caseId,
        kind: state.kind,
        escalated: false,
        reason: "draft-pending-approval",
      });
      continue;
    }

    const draftResult = await orchestrator.requestDraft(caseId, nextStage, apiKey);
    if (draftResult.isErr()) {
      results.push({
        caseId,
        kind: state.kind,
        escalated: false,
        reason: `draft-failed: ${JSON.stringify(draftResult.error)}`,
      });
      continue;
    }

    results.push({ caseId, kind: state.kind, escalated: true });
  }

  return results;
}
