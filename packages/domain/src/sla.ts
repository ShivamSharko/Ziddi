/**
 * SLA rules-as-code. PURE, deterministic, testable.
 * Indian grievance norms: 30 days standard, 48 hours emergency, 7 days for refunds.
 * NEVER put this logic in an LLM.
 */
import { ok, err, Result } from "./result";
import type { DomainError } from "./result";

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

const WINDOWS: Record<CaseKind, Record<Urgency, SlaWindow>> = {
  CivicPothole: {
    Emergency: { firstResponseMs: 24n * HOUR_MS, resolutionMs: 7n * DAY_MS, escalationIntervalMs: 2n * DAY_MS },
    High: { firstResponseMs: 48n * HOUR_MS, resolutionMs: 14n * DAY_MS, escalationIntervalMs: 3n * DAY_MS },
    Standard: { firstResponseMs: 72n * HOUR_MS, resolutionMs: 30n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
    Low: { firstResponseMs: 7n * DAY_MS, resolutionMs: 60n * DAY_MS, escalationIntervalMs: 14n * DAY_MS },
  },
  CivicGarbage: {
    Emergency: { firstResponseMs: 24n * HOUR_MS, resolutionMs: 3n * DAY_MS, escalationIntervalMs: 1n * DAY_MS },
    High: { firstResponseMs: 48n * HOUR_MS, resolutionMs: 7n * DAY_MS, escalationIntervalMs: 2n * DAY_MS },
    Standard: { firstResponseMs: 72n * HOUR_MS, resolutionMs: 14n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
    Low: { firstResponseMs: 7n * DAY_MS, resolutionMs: 30n * DAY_MS, escalationIntervalMs: 14n * DAY_MS },
  },
  CivicWater: {
    Emergency: { firstResponseMs: 24n * HOUR_MS, resolutionMs: 7n * DAY_MS, escalationIntervalMs: 2n * DAY_MS },
    High: { firstResponseMs: 48n * HOUR_MS, resolutionMs: 14n * DAY_MS, escalationIntervalMs: 3n * DAY_MS },
    Standard: { firstResponseMs: 72n * HOUR_MS, resolutionMs: 30n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
    Low: { firstResponseMs: 7n * DAY_MS, resolutionMs: 60n * DAY_MS, escalationIntervalMs: 14n * DAY_MS },
  },
  LandlordDeposit: {
    Emergency: { firstResponseMs: 7n * DAY_MS, resolutionMs: 15n * DAY_MS, escalationIntervalMs: 3n * DAY_MS },
    High: { firstResponseMs: 7n * DAY_MS, resolutionMs: 30n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
    Standard: { firstResponseMs: 15n * DAY_MS, resolutionMs: 45n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
    Low: { firstResponseMs: 30n * DAY_MS, resolutionMs: 90n * DAY_MS, escalationIntervalMs: 14n * DAY_MS },
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
    High: { firstResponseMs: 72n * HOUR_MS, resolutionMs: 30n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
    Standard: { firstResponseMs: 7n * DAY_MS, resolutionMs: 45n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
    Low: { firstResponseMs: 14n * DAY_MS, resolutionMs: 90n * DAY_MS, escalationIntervalMs: 14n * DAY_MS },
  },
  ElectricityBill: {
    Emergency: { firstResponseMs: 24n * HOUR_MS, resolutionMs: 7n * DAY_MS, escalationIntervalMs: 2n * DAY_MS },
    High: { firstResponseMs: 48n * HOUR_MS, resolutionMs: 14n * DAY_MS, escalationIntervalMs: 3n * DAY_MS },
    Standard: { firstResponseMs: 72n * HOUR_MS, resolutionMs: 30n * DAY_MS, escalationIntervalMs: 7n * DAY_MS },
    Low: { firstResponseMs: 7n * DAY_MS, resolutionMs: 60n * DAY_MS, escalationIntervalMs: 14n * DAY_MS },
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
    const kindWindow = WINDOWS[kind];
    if (kindWindow === undefined) {
      throw new Error(`Unknown case kind: ${kind}`);
    }
    const window = kindWindow[urgency];
    if (window === undefined) {
      throw new Error(`Unknown urgency: ${urgency}`);
    }
    return window;
  },

  /** Returns true if the SLA deadline has passed. */
  isOverdue: (window: SlaWindow, startedAtMs: bigint, nowMs: bigint): boolean =>
    nowMs > startedAtMs + window.resolutionMs,

  /** Returns ms remaining (can be negative). */
  remainingMs: (window: SlaWindow, startedAtMs: bigint, nowMs: bigint): bigint =>
    startedAtMs + window.resolutionMs - nowMs,

  /** Default urgency inference from case kind. */
  defaultUrgency: (kind: CaseKind): Urgency => {
    if (kind === "CivicPothole" || kind === "CivicGarbage") return "Standard";
    if (kind === "RtiFiling" || kind === "RtiAppeal") return "Standard";
    if (kind === "LandlordDeposit" || kind === "ConsumerRefund") return "High";
    return "Standard";
  },
} as const;

export type { SlaWindow as Window };

