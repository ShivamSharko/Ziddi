/**
 * Seasonal/festival trigger engine (rules-as-code, pure, testable).
 * Indian grievance volume is seasonal: monsoon -> potholes,
 * Diwali season -> deposits and electricity bills, wedding season -> vendor advances.
 */
import type { CaseKind } from "./sla";

export interface FestivalTrigger {
  readonly season: string;
  readonly label: string;
  readonly kinds: ReadonlyArray<CaseKind>;
  readonly suggestion: string;
}

interface SeasonWindow {
  readonly season: string;
  readonly label: string;
  readonly startMonth: number;
  readonly startDay: number;
  readonly endMonth: number;
  readonly endDay: number;
  readonly kinds: ReadonlyArray<CaseKind>;
  readonly suggestion: string;
}

const SEASONS: ReadonlyArray<SeasonWindow> = [
  {
    season: "Monsoon",
    label: "Monsoon (Jun-Sep)",
    startMonth: 6,
    startDay: 1,
    endMonth: 9,
    endDay: 30,
    kinds: ["CivicPothole", "CivicWater", "CivicGarbage"],
    suggestion: "Barish season: pothole complaints 3x spike. Duplicate case mat kholo - existing case ko upvote karo, ya naya file karo.",
  },
  {
    season: "Diwali",
    label: "Diwali & Festival Season (Oct-Nov)",
    startMonth: 10,
    startDay: 1,
    endMonth: 11,
    endDay: 15,
    kinds: ["LandlordDeposit", "ElectricityBill", "ConsumerRefund"],
    suggestion: "Diwali season: deposit, bijli bill aur refund disputes badhte hain. Pehle check karo koi similar case hai kya - upvote karo, warna naya kholo.",
  },
  {
    season: "Wedding",
    label: "Wedding Season (Nov-Feb)",
    startMonth: 11,
    startDay: 16,
    endMonth: 2,
    endDay: 28,
    kinds: ["ConsumerRefund", "TelecomRefund"],
    suggestion: "Shaadi season: vendor advance disputes common hain. Community cases ko upvote karo taaki priority badhe.",
  },
  {
    season: "Summer",
    label: "Summer (Mar-May)",
    startMonth: 3,
    startDay: 1,
    endMonth: 5,
    endDay: 31,
    kinds: ["ElectricityBill", "CivicWater"],
    suggestion: "Garmi mein bijli/paani disputes: existing case ko support karo ya receipt ke saath naya kholo.",
  },
  {
    season: "Travel",
    label: "Travel Season (Dec-Jan)",
    startMonth: 12,
    startDay: 15,
    endMonth: 1,
    endDay: 10,
    kinds: ["ConsumerRefund"],
    suggestion: "Flight/hotel refund disputes: similar case ko upvote karo - zyada votes = zyada priority.",
  },
];

const inWindow = (window: SeasonWindow, month: number, day: number): boolean => {
  const start = window.startMonth * 100 + window.startDay;
  const end = window.endMonth * 100 + window.endDay;
  const current = month * 100 + day;
  if (start <= end) return current >= start && current <= end;
  return current >= start || current <= end;
};

export const activeTriggers = (nowMs: bigint): ReadonlyArray<FestivalTrigger> => {
  const date = new Date(Number(nowMs));
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return SEASONS.filter((s) => inWindow(s, month, day)).map((s) => ({
    season: s.season,
    label: s.label,
    kinds: s.kinds,
    suggestion: s.suggestion,
  }));
};

