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
    suggestion: "Barish season: pothole aur waterlogging complaints 3x spike hoti hain. Abhi file karo - SLA clock abhi shuru hota hai.",
  },
  {
    season: "Diwali",
    label: "Diwali & Festival Season (Oct-Nov)",
    startMonth: 10,
    startDay: 1,
    endMonth: 11,
    endDay: 15,
    kinds: ["LandlordDeposit", "ElectricityBill", "ConsumerRefund"],
    suggestion: "Diwali season: landlords deposit rok lete hain, bijli bills galat aate hain, online orders fail hote hain. Receipts save rakho.",
  },
  {
    season: "Wedding",
    label: "Wedding Season (Nov-Feb)",
    startMonth: 11,
    startDay: 16,
    endMonth: 2,
    endDay: 28,
    kinds: ["ConsumerRefund", "TelecomRefund"],
    suggestion: "Shaadi season: vendors advance lekar bhag jaate hain. Advance receipts ke saath case file karo.",
  },
  {
    season: "Summer",
    label: "Summer (Mar-May)",
    startMonth: 3,
    startDay: 1,
    endMonth: 5,
    endDay: 31,
    kinds: ["ElectricityBill", "CivicWater"],
    suggestion: "Garmi mein bijli aur paani disputes badhte hain. Bill screenshots vault mein daalo.",
  },
  {
    season: "Travel",
    label: "Travel Season (Dec-Jan)",
    startMonth: 12,
    startDay: 15,
    endMonth: 1,
    endDay: 10,
    kinds: ["ConsumerRefund"],
    suggestion: "Chhutti season: flight cancel aur hotel refund disputes. PNR aur booking IDs saboot hain.",
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

