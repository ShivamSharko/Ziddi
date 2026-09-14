/**
 * The Ziddi Agent. Orchestrates AI calls and domain state transitions.
 * "Agent drafts, human approves."
 */
import { ulid } from "ulid";
import { GeminiClient, IntakeExtract, EvidenceChecklist, Drafter } from "@ziddi/gemini";
import { Money, Sla, type DomainError, type Result } from "@ziddi/domain";
import type { CaseOpened, EvidenceAttached, DraftPrepared, DraftApproved } from "@ziddi/domain";
import type { CaseRepository } from "./repository.js";

export interface StartCaseInput {
  rawCitizenText: string;
  apiKey: string;
}

export class ZiddiOrchestrator {
  constructor(private readonly repo: CaseRepository) {}

  async startCase(input: StartCaseInput): Promise<Result<string, DomainError>> {
    const client = new GeminiClient(input.apiKey);
    const extractResult = await IntakeExtract.intakeExtract(client, input.rawCitizenText);

    if (extractResult.isErr()) return extractResult;
    const extracted = extractResult.value;

    const caseId = ulid();
    const eventId = ulid();
    const nowMs = BigInt(Date.now());

    const amountPaiseResult = extracted.amountRupees !== undefined 
      ? Money.fromRupees(extracted.amountRupees) 
      : undefined;

    if (amountPaiseResult && amountPaiseResult.isErr()) {
      return amountPaiseResult;
    }

    const event: CaseOpened = {
      id: eventId,
      caseId,
      type: "CaseOpened",
      kind: extracted.kind,
      summary: extracted.summary,
      city: extracted.city,
      state: extracted.state,
      urgency: extracted.urgency,
      amountPaise: amountPaiseResult?.value,
      at: nowMs,
      actor: { type: "Agent", runId: ulid() },
    };

    await this.repo.saveEvent(caseId, event);
    return { isOk: () => true, isErr: () => false, value: caseId, error: undefined } as any; // Simplified Result return for orchestrator
  }

  async getEvidenceChecklist(caseId: string, apiKey: string): Promise<Result<EvidenceChecklist.EvidenceChecklist, DomainError>> {
    const caseResult = await this.repo.getCase(caseId);
    if (caseResult.isErr()) return caseResult;
    const state = caseResult.value;

    const client = new GeminiClient(apiKey);
    return EvidenceChecklist.evidenceChecklist(client, state.summary, state.kind);
  }

  async attachEvidence(caseId: string, description: string, mimeType: string): Promise<Result<void, DomainError>> {
    const caseResult = await this.repo.getCase(caseId);
    if (caseResult.isErr()) return caseResult;

    const event: EvidenceAttached = {
      id: ulid(),
      caseId,
      type: "EvidenceAttached",
      evidenceId: ulid(),
      mimeType,
      description,
      hashSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", // Placeholder hash
      at: BigInt(Date.now()),
      actor: { type: "Citizen", id: "user_1" },
    };

    await this.repo.saveEvent(caseId, event);
    return { isOk: () => true, isErr: () => false, value: undefined, error: undefined } as any;
  }

  async requestDraft(caseId: string, stage: "DemandNotice" | "FirstAppeal" | "RtiApplication", apiKey: string): Promise<Result<string, DomainError>> {
    const caseResult = await this.repo.getCase(caseId);
    if (caseResult.isErr()) return caseResult;
    const state = caseResult.value;

    const client = new GeminiClient(apiKey);
    const draftResult = await Drafter.draftDocument(client, {
      stage,
      language: "en-IN-hinglish",
      caseSummary: state.summary,
      evidenceSummary: `${state.evidenceCount} pieces of evidence attached`,
      citizenName: "Citizen",
      city: state.city,
      state: state.state,
      amountRupees: state.amountPaise > 0n ? Number(state.amountPaise) / 100 : undefined,
    });

    if (draftResult.isErr()) return draftResult;
    const draft = draftResult.value;

    const draftId = ulid();
    const event: DraftPrepared = {
      id: ulid(),
      caseId,
      type: "DraftPrepared",
      draftId,
      stage,
      language: draft.language,
      body: draft.body,
      confidence: draft.confidence,
      at: BigInt(Date.now()),
      actor: { type: "Agent", runId: ulid() },
    };

    await this.repo.saveEvent(caseId, event);
    return { isOk: () => true, isErr: () => false, value: draftId, error: undefined } as any;
  }
}

