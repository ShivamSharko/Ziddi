import { describe, it, expect } from "vitest";
import { aadhaarCheckDigit, isValidAadhaar } from "../aadhaar";

describe("aadhaar verhoeff", () => {
  it("round-trips check digit", () => {
    const prefix = "23456789012";
    const check = aadhaarCheckDigit(prefix);
    expect(check).not.toBeNull();
    if (check !== null) {
      expect(isValidAadhaar(`${prefix}${check}`)).toBe(true);
    }
  });

  it("rejects wrong check digit", () => {
    const prefix = "23456789012";
    const check = aadhaarCheckDigit(prefix) ?? "0";
    const wrong = check === "1" ? "2" : "1";
    expect(isValidAadhaar(`${prefix}${wrong}`)).toBe(false);
  });

  it("rejects numbers starting with 0 or 1", () => {
    expect(isValidAadhaar("023456789012")).toBe(false);
    expect(isValidAadhaar("123456789012")).toBe(false);
  });

  it("rejects wrong lengths", () => {
    expect(isValidAadhaar("2345678901")).toBe(false);
    expect(isValidAadhaar("2345678901234")).toBe(false);
  });

  it("accepts space-separated input", () => {
    const prefix = "98765432109";
    const check = aadhaarCheckDigit(prefix);
    expect(check).not.toBeNull();
    if (check !== null) {
      const grouped = `${prefix.slice(0, 4)} ${prefix.slice(4, 8)} ${prefix.slice(8)}${check}`;
      expect(isValidAadhaar(grouped)).toBe(true);
    }
  });
});
