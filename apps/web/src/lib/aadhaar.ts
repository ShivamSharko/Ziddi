import { createHash } from "node:crypto";
import { isValidAadhaar, normalizeAadhaar } from "@ziddi/domain";

/**
 * UIDAI-compliant: the Aadhaar number is NEVER stored.
 * We keep only a one-way salted SHA-256 "citizen token" for
 * one-person-one-case accountability and duplicate-vote prevention.
 */
export const citizenToken = (aadhaar: string): string | null => {
  const digits = normalizeAadhaar(aadhaar);
  if (!isValidAadhaar(digits)) return null;
  return createHash("sha256").update(`ziddi-citizen:${digits}`).digest("hex");
};

