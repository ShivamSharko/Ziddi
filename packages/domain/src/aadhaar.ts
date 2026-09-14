/**
 * Aadhaar validation via the Verhoeff checksum (the real UIDAI check-digit algorithm).
 * PRIVACY: Ziddi NEVER stores the Aadhaar number. Callers hash it into a
 * one-way salted "citizen token" (see apps/web/src/lib/aadhaar.ts).
 * Storing raw Aadhaar by private entities is illegal under the Aadhaar Act 2016.
 */

const D_TABLE: ReadonlyArray<ReadonlyArray<number>> = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const P_TABLE: ReadonlyArray<ReadonlyArray<number>> = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

const INV_TABLE: ReadonlyArray<number> = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

export const normalizeAadhaar = (input: string): string => input.replace(/\s+/g, "");

export const aadhaarCheckDigit = (first11: string): string | null => {
  if (!/^[2-9][0-9]{10}$/.test(first11)) return null;
  let c = 0;
  const reversed = first11.split("").reverse().map(Number);
  for (let i = 0; i < reversed.length; i++) {
    const digit = reversed[i] ?? 0;
    const perm = P_TABLE[(i + 1) % 8]?.[digit] ?? 0;
    c = D_TABLE[c]?.[perm] ?? 0;
  }
  return String(INV_TABLE[c] ?? 0);
};

export const isValidAadhaar = (input: string): boolean => {
  const digits = normalizeAadhaar(input);
  if (!/^[2-9][0-9]{11}$/.test(digits)) return false;
  let c = 0;
  const reversed = digits.split("").reverse().map(Number);
  for (let i = 0; i < reversed.length; i++) {
    const digit = reversed[i];
    if (digit === undefined) return false;
    const perm = P_TABLE[i % 8]?.[digit];
    if (perm === undefined) return false;
    const next = D_TABLE[c]?.[perm];
    if (next === undefined) return false;
    c = next;
  }
  return c === 0;
};
