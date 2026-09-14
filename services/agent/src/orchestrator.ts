/**
 * The Ziddi Agent. Orchestrates AI calls and domain state transitions.
 * "Agent drafts, human approves."
 */
import { ulid } from "ulid";
import { Drafter, EvidenceChecklist, GeminiClient, IntakeExtract } from "@ziddi/gemini";
import { Money, domainError, err, ok } from "@ziddi/domain";
import type {
  CaseOpened,
  CaseState,
  CommunityUpvote,
  DomainError,
  DraftApproved,
  DraftPrepared,
  DraftRejected,
  EvidenceAttached,
  Result,
} from "@ziddi/domain";
import type { CaseRepository } from "./repository";

export interface StartCaseInput {
  rawCitizenText: string;
  apiKey: string;
  anonymous?: boolean;
  citizenToken: string;
  locality?: string;
  extraction?: IntakeExtract.IntakeExtract;
}

export interface EvidenceItemInput {
  description: string;
  mimeType: string;
  dataUrl?: string;
  fileName?: string;
}

export type DraftStage = "DemandNotice" | "FirstAppeal" | "SecondAppeal" | "RtiApplication";

export class ZiddiOrchestrator {
  constructor(private readonly repo: CaseRepository) {}

  async analyze(
    rawCitizenText: string,
    apiKey: string,
  ): Promise<Result<IntakeExtract.IntakeExtract, DomainError>> {
    const client = new GeminiClient(apiKey);
    return IntakeExtract.intakeExtract(client, rawCitizenText);
  }

  async findDuplicates(
    kind: string,
    city: string,
    locality?: string,
  ): Promise<ReadonlyArray<CaseState>> {
    const all = await this.repo.listCases();
    const norm = (s: string) => s.trim().toLowerCase();
    return all.filter((c) => {
      if (c.status === "Resolved" || c.status === "Withdrawn") return false;
      if (c.kind !== kind) return false;
      if (norm(c.city) !== norm(city)) return false;
      if (locality !== undefined && locality.length > 0) {
        return c.locality !== null && norm(c.locality) === norm(locality);
      }
      return c.locality === null;
    });
  }

  async startCase(input: StartCaseInput): Promise<Result<string, DomainError>> {
    let extracted = input.extraction;
    if (extracted === undefined) {
      const client = new GeminiClient(input.apiKey);
      const extractResult = await IntakeExtract.intakeExtract(client, input.rawCitizenText);
      if (extractResult.isErr()) {
        return err(extractResult.error);
      }
      extracted = extractResult.value;
    }

    if (!extracted.isGenuineGrievance) {
      return err(
        domainError.validation(
          extracted.rejectionReason ??
            "Yeh civic grievance nahi lagta. Ziddi sirf real community problems mein help karta hai.",
        ),
      );
    }

    if (extracted.confidence < 0.6) {
      return err(
        domainError.validation(
          "Samajh nahi aaya clearly. Thoda detail mein likho - kya hua, kahan hua, kab hua.",
        ),
      );
    }

    if (extracted.city === "Unknown" || extracted.state === "Unknown") {
      return err(
        domainError.validation(
          "Please mention your city and state (e.g. Bengaluru, Karnataka) taaki case sahi department ko jaaye.",
        ),
      );
    }

    let amountPaise: bigint | undefined;
    if (extracted.amountRupees !== undefined) {
      const moneyResult = Money.fromRupees(extracted.amountRupees);
      if (moneyResult.isErr()) {
        return err(moneyResult.error);
      }
      amountPaise = moneyResult.value;
    }

    const caseId = ulid();
    const event: CaseOpened = {
      id: ulid(),
      caseId,
      type: "CaseOpened",
      kind: extracted.kind,
      summary: extracted.summary,
      city: extracted.city,
      state: extracted.state,
      locality: input.locality,
      urgency: extracted.urgency,
      amountPaise,
      anonymous: input.anonymous,
      citizenToken: input.citizenToken,
      at: BigInt(Date.now()),
      actor: { type: "Agent", runId: ulid() },
    };

    await this.repo.saveEvent(caseId, event);
    return ok(caseId);
  }

  async getEvidenceChecklist(
    caseId: string,
    apiKey: string,
  ): Promise<Result<EvidenceChecklist.EvidenceChecklist, DomainError>> {
    const caseResult = await this.repo.getCase(caseId);
    if (caseResult.isErr()) {
      return err(caseResult.error);
    }
    const state = caseResult.value;

    const client = new GeminiClient(apiKey);
    return EvidenceChecklist.evidenceChecklist(client, state.summary, state.kind);
  }

  async attachEvidenceBatch(
    caseId: string,
    items: ReadonlyArray<EvidenceItemInput>,
  ): Promise<Result<true, DomainError>> {
    if (items.length === 0 || items.length > 6) {
      return err(domainError.validation("Provide between 1 and 6 evidence items"));
    }
    const caseResult = await this.repo.getCase(caseId);
    if (caseResult.isErr()) {
      return err(caseResult.error);
    }

    for (const item of items) {
      const event: EvidenceAttached = {
        id: ulid(),
        caseId,
        type: "EvidenceAttached",
        evidenceId: ulid(),
        mimeType: item.mimeType,
        description: item.description,
        hashSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        at: BigInt(Date.now()),
        actor: { type: "Citizen", id: "user_1" },
        ...(item.dataUrl !== undefined ? { dataUrl: item.dataUrl } : {}),
        ...(item.fileName !== undefined ? { fileName: item.fileName } : {}),
      };
      await this.repo.saveEvent(caseId, event);
    }
    return ok(true);
  }

  async upvoteCase(caseId: string, voterToken: string): Promise<Result<true, DomainError>> {
    const caseResult = await this.repo.getCase(caseId);
    if (caseResult.isErr()) {
      return err(caseResult.error);
    }
    const state = caseResult.value;
    if (state.voters.includes(voterToken)) {
      return err(
        domainError.invariant("duplicate-vote", "This citizen has already supported this case"),
      );
    }

    const event: CommunityUpvote = {
      id: ulid(),
      caseId,
      type: "CommunityUpvote",
      voterToken,
      at: BigInt(Date.now()),
      actor: { type: "Citizen", id: "verified-token" },
    };
    await this.repo.saveEvent(caseId, event);
    return ok(true);
  }

  async requestDraft(
    caseId: string,
    stage: DraftStage,
    apiKey: string,
  ): Promise<Result<string, DomainError>> {
    const caseResult = await this.repo.getCase(caseId);
    if (caseResult.isErr()) {
      return err(caseResult.error);
    }
    const state = caseResult.value;

    const client = new GeminiClient(apiKey);
    const draftResult = await Drafter.draftDocument(client, {
      stage,
      language: "en-IN-hinglish",
      caseSummary: state.summary,
      evidenceSummary: `${state.evidenceCount} pieces of evidence attached`,
      citizenName: state.anonymous ? "A verified citizen (anonymous)" : "Citizen",
      city: state.city,
      state: state.state,
      amountRupees: state.amountPaise > 0n ? Number(state.amountPaise) / 100 : undefined,
    });
    if (draftResult.isErr()) {
      return err(draftResult.error);
    }
    const draft = draftResult.value;

    const draftId = ulid();
    const event: DraftPrepared = {
      id: ulid(),
      caseId,
      type: "DraftPrepared",
      draftId,
      stage: draft.stage,
      language: draft.language,
      body: draft.body,
      confidence: draft.confidence,
      at: BigInt(Date.now()),
      actor: { type: "Agent", runId: ulid() },
    };

    await this.repo.saveEvent(caseId, event);
    return ok(draftId);
  }

  async approveDraft(caseId: string): Promise<Result<true, DomainError>> {
    const caseResult = await this.repo.getCase(caseId);
    if (caseResult.isErr()) {
      return err(caseResult.error);
    }
    const state = caseResult.value;
    if (state.currentDraftId === null) {
      return err(domainError.invariant("pending-draft", "No draft is awaiting approval"));
    }

    const event: DraftApproved = {
      id: ulid(),
      caseId,
      type: "DraftApproved",
      draftId: state.currentDraftId,
      at: BigInt(Date.now()),
      actor: { type: "Citizen", id: "user_1" },
    };

    await this.repo.saveEvent(caseId, event);
    return ok(true);
  }

  async rejectDraft(caseId: string, reason?: string): Promise<Result<true, DomainError>> {
    const caseResult = await this.repo.getCase(caseId);
    if (caseResult.isErr()) {
      return err(caseResult.error);
    }
    const state = caseResult.value;
    if (state.currentDraftId === null) {
      return err(domainError.invariant("pending-draft", "No draft is awaiting approval"));
    }

    const event: DraftRejected = {
      id: ulid(),
      caseId,
      type: "DraftRejected",
      draftId: state.currentDraftId,
      reason,
      at: BigInt(Date.now()),
      actor: { type: "Citizen", id: "user_1" },
    };

    await this.repo.saveEvent(caseId, event);
    return ok(true);
  }
}
