/**
 * SLA rules-as-code using 2026 statutory deadlines.
 * PURE, deterministic, testable.
 * NEVER put this logic in an LLM.
 */
import { ok, err, Result } from "./result";
import type { DomainError } from "./result";
import { getDeadline } from "./legal-registry";

export type CaseKind =
  | "CivicPothole"
  | "CivicGarbage"
  | "CivicWater"
  | "LandlordDeposit"
  | "ConsumerRefund"
  | "RtiFiling"
  | "RtiAppeal"
  | "AadhaarUpdate"
  | "ElectricityBill"
  | "TelecomRefund";

export type Urgency = "Emergency" | "High" | "Standard" | "Low";

export interface SlaWindow {
  readonly firstResponseMs: bigint;
  readonly resolutionMs: bigint;
  readonly escalationIntervalMs: bigint;
}

const DAY_MS = 86_400_000n;
const HOUR_MS = 3_600_000n;

const DEFAULT_WINDOWS: Record<CaseKind, Record<Urgency, SlaWindow>> = {
  CivicPothole: {
    Emergency: { firstResponseMs: 24n * HOUR_MS, resolutionMs: 7n * DAY_MS, escalationIntervalMs: 2n * DAY_MS },
    High: { firstResponseMs: 48n * HOUR_MS, resolutionMs: 14n * DAY_MS, escalationIntervalMs: 3n * DAY_MS },
    Standard: { firstResponseMs: 72n * HOUR_MS, resolutionMs: 21n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
    Low: { firstResponseMs: 7n * DAY_MS, resolutionMs: 30n * DAY_MS, escalationIntervalMs: 14n * DAY_MS },
  },
  CivicGarbage: {
    Emergency: { firstResponseMs: 24n * HOUR_MS, resolutionMs: 3n * DAY_MS, escalationIntervalMs: 1n * DAY_MS },
    High: { firstResponseMs: 48n * HOUR_MS, resolutionMs: 7n * DAY_MS, escalationIntervalMs: 2n * DAY_MS },
    Standard: { firstResponseMs: 72n * HOUR_MS, resolutionMs: 21n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
    Low: { firstResponseMs: 7n * DAY_MS, resolutionMs: 30n * DAY_MS, escalationIntervalMs: 14n * DAY_MS },
  },
  CivicWater: {
    Emergency: { firstResponseMs: 24n * HOUR_MS, resolutionMs: 7n * DAY_MS, escalationIntervalMs: 2n * DAY_MS },
    High: { firstResponseMs: 48n * HOUR_MS, resolutionMs: 14n * DAY_MS, escalationIntervalMs: 3n * DAY_MS },
    Standard: { firstResponseMs: 72n * HOUR_MS, resolutionMs: 21n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
    Low: { firstResponseMs: 7n * DAY_MS, resolutionMs: 30n * DAY_MS, escalationIntervalMs: 14n * DAY_MS },
  },
  LandlordDeposit: {
    Emergency: { firstResponseMs: 7n * DAY_MS, resolutionMs: 15n * DAY_MS, escalationIntervalMs: 3n * DAY_MS },
    High: { firstResponseMs: 7n * DAY_MS, resolutionMs: 30n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
    Standard: { firstResponseMs: 15n * DAY_MS, resolutionMs: 30n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
    Low: { firstResponseMs: 30n * DAY_MS, resolutionMs: 60n * DAY_MS, escalationIntervalMs: 14n * DAY_MS },
  },
  ConsumerRefund: {
    Emergency: { firstResponseMs: 48n * HOUR_MS, resolutionMs: 7n * DAY_MS, escalationIntervalMs: 2n * DAY_MS },
    High: { firstResponseMs: 72n * HOUR_MS, resolutionMs: 14n * DAY_MS, escalationIntervalMs: 3n * DAY_MS },
    Standard: { firstResponseMs: 7n * DAY_MS, resolutionMs: 30n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
    Low: { firstResponseMs: 14n * DAY_MS, resolutionMs: 60n * DAY_MS, escalationIntervalMs: 14n * DAY_MS },
  },
  RtiFiling: {
    Emergency: { firstResponseMs: 24n * HOUR_MS, resolutionMs: 30n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
    High: { firstResponseMs: 48n * HOUR_MS, resolutionMs: 30n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
    Standard: { firstResponseMs: 7n * DAY_MS, resolutionMs: 30n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
    Low: { firstResponseMs: 14n * DAY_MS, resolutionMs: 30n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
  },
  RtiAppeal: {
    Emergency: { firstResponseMs: 48n * HOUR_MS, resolutionMs: 30n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
    High: { firstResponseMs: 72n * HOUR_MS, resolutionMs: 30n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
    Standard: { firstResponseMs: 7n * DAY_MS, resolutionMs: 30n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
    Low: { firstResponseMs: 14n * DAY_MS, resolutionMs: 60n * DAY_MS, escalationIntervalMs: 14n * DAY_MS },
  },
  AadhaarUpdate: {
    Emergency: { firstResponseMs: 48n * HOUR_MS, resolutionMs: 14n * DAY_MS, escalationIntervalMs: 3n * DAY_MS },
    High: { firstResponseMs: 72n * HOUR_MS, resolutionMs: 21n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
    Standard: { firstResponseMs: 7n * DAY_MS, resolutionMs: 30n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
    Low: { firstResponseMs: 14n * DAY_MS, resolutionMs: 60n * DAY_MS, escalationIntervalMs: 14n * DAY_MS },
  },
  ElectricityBill: {
    Emergency: { firstResponseMs: 24n * HOUR_MS, resolutionMs: 7n * DAY_MS, escalationIntervalMs: 2n * DAY_MS },
    High: { firstResponseMs: 48n * HOUR_MS, resolutionMs: 14n * DAY_MS, escalationIntervalMs: 3n * DAY_MS },
    Standard: { firstResponseMs: 72n * HOUR_MS, resolutionMs: 21n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
    Low: { firstResponseMs: 7n * DAY_MS, resolutionMs: 30n * DAY_MS, escalationIntervalMs: 14n * DAY_MS },
  },
  TelecomRefund: {
    Emergency: { firstResponseMs: 48n * HOUR_MS, resolutionMs: 7n * DAY_MS, escalationIntervalMs: 2n * DAY_MS },
    High: { firstResponseMs: 72n * HOUR_MS, resolutionMs: 14n * DAY_MS, escalationIntervalMs: 3n * DAY_MS },
    Standard: { firstResponseMs: 7n * DAY_MS, resolutionMs: 30n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
    Low: { firstResponseMs: 14n * DAY_MS, resolutionMs: 60n * DAY_MS, escalationIntervalMs: 14n * DAY_MS },
  },
};

export const Sla = {
  windowFor: (kind: CaseKind, urgency: Urgency): SlaWindow => {
    const normalizedUrgency: Urgency =
      urgency === "Emergency" || urgency === "High" || urgency === "Low" ? urgency : "Standard";
    const kindWindow: Record<Urgency, SlaWindow> | undefined =
      DEFAULT_WINDOWS[kind] ?? DEFAULT_WINDOWS.CivicPothole;
    const window: SlaWindow | undefined = kindWindow?.[normalizedUrgency];
    if (window === undefined) {
      throw new Error(`Unknown SLA window for ${kind}/${normalizedUrgency}`);
    }
    return window;
  },

  statutoryDeadlineFor: (kind: CaseKind, stage: string): Result<bigint, DomainError> => {
    const deadline = getDeadline(kind, stage);
    if (deadline === undefined) {
      return err({
        kind: "NotFound",
        entity: "StatutoryDeadline",
        id: `${kind}/${stage}`,
      });
    }
    return ok(BigInt(deadline.days) * DAY_MS);
  },

  isOverdue: (window: SlaWindow, startedAtMs: bigint, nowMs: bigint): boolean =>
    nowMs > startedAtMs + window.resolutionMs,

  remainingMs: (window: SlaWindow, startedAtMs: bigint, nowMs: bigint): bigint =>
    startedAtMs + window.resolutionMs - nowMs,

  defaultUrgency: (kind: CaseKind): Urgency => {
    if (kind === "CivicPothole" || kind === "CivicGarbage") return "Standard";
    if (kind === "RtiFiling" || kind === "RtiAppeal") return "Standard";
    if (kind === "LandlordDeposit" || kind === "ConsumerRefund") return "High";
    return "Standard";
  },
} as const;

export type { SlaWindow as Window };
