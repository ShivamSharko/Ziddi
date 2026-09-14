/**
 * INR amounts stored as paise (BigInt) to avoid floating-point errors.
 * Indians deal with exact rupee amounts in refunds, deposits, penalties.
 */
import { ok, err, Result } from "./result";
import type { DomainError } from "./result";

export type Paise = bigint & { readonly __brand: "Paise" };

export const Money = {
  fromRupees: (rupees: number): Result<Paise, DomainError> => {
    if (!Number.isFinite(rupees)) {
      return err({ kind: "ValidationFailed", message: "Rupees must be a finite number", field: "rupees" });
    }
    if (rupees < 0) {
      return err({ kind: "ValidationFailed", message: "Rupees cannot be negative", field: "rupees" });
    }
    const paise = BigInt(Math.round(rupees * 100)) as Paise;
    return ok(paise);
  },

  toRupees: (paise: Paise): number => Number(paise) / 100,

  formatINR: (paise: Paise, locale = "en-IN"): string =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(paise) / 100),

  add: (a: Paise, b: Paise): Paise => (a + b) as Paise,
  sub: (a: Paise, b: Paise): Paise => (a - b) as Paise,
  zero: (): Paise => BigInt(0) as Paise,
} as const;

