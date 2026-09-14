import { describe, it, expect } from "vitest";
import { activeTriggers } from "../festivals";

const ms = (iso: string): bigint => BigInt(Date.parse(iso));

describe("activeTriggers", () => {
  it("returns monsoon triggers in July", () => {
    const triggers = activeTriggers(ms("2026-07-15T00:00:00Z"));
    expect(triggers.some((t) => t.season === "Monsoon")).toBe(true);
  });

  it("returns Diwali triggers in October", () => {
    const triggers = activeTriggers(ms("2026-10-20T00:00:00Z"));
    expect(triggers.some((t) => t.season === "Diwali")).toBe(true);
  });

  it("wraps year for travel season in early January", () => {
    const triggers = activeTriggers(ms("2027-01-05T00:00:00Z"));
    expect(triggers.some((t) => t.season === "Travel")).toBe(true);
  });

  it("returns wedding trigger in early December (wedding season peaks Dec)", () => {
    const triggers = activeTriggers(ms("2026-12-05T00:00:00Z"));
    expect(triggers.some((t) => t.season === "Wedding")).toBe(true);
  });
});

