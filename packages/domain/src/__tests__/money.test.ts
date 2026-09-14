import { describe, it, expect } from "vitest";
import { Money } from "../money.js";

describe("Money", () => {
  it("converts rupees to paise correctly", () => {
    const result = Money.fromRupees(1500.50);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBe(150050n);
      expect(Money.toRupees(result.value)).toBeCloseTo(1500.50);
    }
  });

  it("rejects negative rupees", () => {
    const result = Money.fromRupees(-100);
    expect(result.isErr()).toBe(true);
  });

  it("rejects NaN", () => {
    const result = Money.fromRupees(Number.NaN);
    expect(result.isErr()).toBe(true);
  });

  it("formats INR correctly for India", () => {
    const result = Money.fromRupees(60000);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(Money.formatINR(result.value)).toContain("60,000");
    }
  });

  it("adds paise correctly", () => {
    const a = Money.fromRupees(100).unwrapOr(Money.zero());
    const b = Money.fromRupees(50).unwrapOr(Money.zero());
    expect(Money.add(a, b)).toBe(15000n);
  });
});

