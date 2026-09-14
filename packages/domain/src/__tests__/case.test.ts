import { describe, it, expect } from "vitest";
import * as Case from "../case.js";
import type { CaseOpened, EvidenceAttached, DraftPrepared } from "../events.js";

describe("Case fold + rehydrate", () => {
  const opened: CaseOpened = {
    id: "01J9K1ABCDEFGH1234567890AB",
    caseId: "01J9K1ABCDEFGH1234567890ZZ",
    type: "CaseOpened",
    kind: "LandlordDeposit",
    summary: "Landlord not returning 60000 deposit after move-out in Bengaluru",
    city: "Bengaluru",
    state: "Karnataka",
    urgency: "High",
    amountPaise: 6000000n,
    at: 1_726_000_000_000n,
    actor: { type: "Citizen", id: "c1" },
  };

  const evidence: EvidenceAttached = {
    id: "01J9K1ABCDEFGH1234567890BC",
    caseId: opened.caseId,
    type: "EvidenceAttached",
    evidenceId: "01J9K1EVID001",
    mimeType: "image/jpeg",
    description: "Rental agreement page 1",
    hashSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    at: 1_726_000_060_000n,
    actor: { type: "Citizen", id: "c1" },
  };

  it("transitions Intake -> Evidence on open", () => {
    const state = Case.rehydrate([opened]).unwrapOr(Case.initialState());
    expect(state.status).toBe("Evidence");
    expect(state.kind).toBe("LandlordDeposit");
  });

  it("transitions Evidence -> Drafting after evidence attached", () => {
    const state = Case.rehydrate([opened, evidence]).unwrapOr(Case.initialState());
    expect(state.status).toBe("Drafting");
    expect(state.evidenceCount).toBe(1);
  });

  it("rejects empty event stream", () => {
    const result = Case.rehydrate([]);
    expect(result.isErr()).toBe(true);
  });
});

