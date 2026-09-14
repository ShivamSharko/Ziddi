import { describe, it, expect } from "vitest";
import { getDeadline, getLegalRule } from "../legal-registry";

describe("legal-registry", () => {
  it("returns 30-day deadline for LandlordDeposit DemandNotice", () => {
    const deadline = getDeadline("LandlordDeposit", "DemandNotice");
    expect(deadline).toBeDefined();
    expect(deadline?.days).toBe(30);
    expect(deadline?.legalCitation).toContain("Model Tenancy Act");
  });

  it("returns 21-day CPGRAMS deadline for CivicPothole", () => {
    const deadline = getDeadline("CivicPothole", "DemandNotice");
    expect(deadline).toBeDefined();
    expect(deadline?.days).toBe(21);
    expect(deadline?.legalCitation).toContain("CPGRAMS");
  });

  it("returns 30-day RTI first appeal deadline", () => {
    const deadline = getDeadline("RtiFiling", "FirstAppeal");
    expect(deadline).toBeDefined();
    expect(deadline?.days).toBe(30);
    expect(deadline?.legalCitation).toContain("Section 19(1)");
  });

  it("returns 90-day RTI second appeal deadline", () => {
    const deadline = getDeadline("RtiFiling", "SecondAppeal");
    expect(deadline).toBeDefined();
    expect(deadline?.days).toBe(90);
  });

  it("returns 730-day (2-year) CPA limitation for ConsumerRefund", () => {
    const deadline = getDeadline("ConsumerRefund", "ConsumerComplaint");
    expect(deadline).toBeDefined();
    expect(deadline?.days).toBe(730);
    expect(deadline?.legalCitation).toContain("Section 69");
  });

  it("returns undefined for unknown stage", () => {
    const deadline = getDeadline("LandlordDeposit", "UnknownStage");
    expect(deadline).toBeUndefined();
  });

  it("returns undefined for unknown case kind", () => {
    const rule = getLegalRule("UnknownKind");
    expect(rule).toBeUndefined();
  });
});
