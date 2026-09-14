import { describe, it, expect } from "vitest";
import { rehydrate, stageProgress, persistencePercentile, initialState } from "../case";
import type { CaseOpened, EvidenceAttached } from "../events";

const opened: CaseOpened = {
  id: "1",
  caseId: "c1",
  type: "CaseOpened",
  kind: "LandlordDeposit",
  summary: "test deposit case summary",
  city: "Bengaluru",
  state: "Karnataka",
  urgency: "High",
  anonymous: true,
  at: 1_726_000_000_000n,
  actor: { type: "Citizen", id: "c1" },
};

const evidence: EvidenceAttached = {
  id: "2",
  caseId: "c1",
  type: "EvidenceAttached",
  evidenceId: "e1",
  mimeType: "image/jpeg",
  description: "agreement",
  hashSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  dataUrl: "data:image/jpeg;base64,AAA",
  at: 1_726_000_060_000n,
  actor: { type: "Citizen", id: "c1" },
};

describe("progress + percentile + anonymous", () => {
  it("stage progress maps Drafting to 40", () => {
    const state = rehydrate([opened, evidence]).unwrapOr(initialState());
    expect(stageProgress(state)).toBe(40);
  });

  it("percentile grows with evidence", () => {
    const before = rehydrate([opened]).unwrapOr(initialState());
    const after = rehydrate([opened, evidence]).unwrapOr(initialState());
    const now = 1_726_000_100_000n;
    expect(persistencePercentile(after, now)).toBeGreaterThan(persistencePercentile(before, now));
  });

  it("anonymous flag survives fold", () => {
    const state = rehydrate([opened]).unwrapOr(initialState());
    expect(state.anonymous).toBe(true);
  });

  it("evidence ref keeps dataUrl", () => {
    const state = rehydrate([opened, evidence]).unwrapOr(initialState());
    expect(state.evidence).toHaveLength(1);
    expect(state.evidence[0]?.dataUrl).toBe("data:image/jpeg;base64,AAA");
  });
});

