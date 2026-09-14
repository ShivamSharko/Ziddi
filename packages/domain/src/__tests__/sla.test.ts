import { describe, it, expect } from "vitest";
import { Sla } from "../sla";

describe("Sla", () => {
  const DAY_MS = 86_400_000n;

  it("returns 30-day standard window for CivicPothole", () => {
    const window = Sla.windowFor("CivicPothole", "Standard");
    expect(window.resolutionMs).toBe(30n * DAY_MS);
  });

  it("returns 15-day high window for LandlordDeposit", () => {
    const window = Sla.windowFor("LandlordDeposit", "High");
    expect(window.resolutionMs).toBe(30n * DAY_MS);
  });

  it("detects overdue correctly", () => {
    const window = Sla.windowFor("ConsumerRefund", "Standard");
    const startedAt = 1_726_000_000_000n;
    const now = startedAt + 31n * DAY_MS;
    expect(Sla.isOverdue(window, startedAt, now)).toBe(true);
  });

  it("returns negative remaining when overdue", () => {
    const window = Sla.windowFor("ConsumerRefund", "Standard");
    const startedAt = 1_726_000_000_000n;
    const now = startedAt + 31n * DAY_MS;
    expect(Sla.remainingMs(window, startedAt, now)).toBeLessThan(0n);
  });

  it("infers default urgency High for deposit cases", () => {
    expect(Sla.defaultUrgency("LandlordDeposit")).toBe("High");
    expect(Sla.defaultUrgency("ConsumerRefund")).toBe("High");
  });
});

