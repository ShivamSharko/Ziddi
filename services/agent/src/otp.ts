/**
 * OTP verification for Aadhaar-owned numbers.
 * Production: swap ConsoleOtpAdapter for a licensed SMS gateway adapter
 * (UIDAI-compliant partners only). The Aadhaar number itself is never stored.
 */
import { randomInt } from "node:crypto";

export interface OtpAdapter {
  sendOtp(tokenSuffix: string, code: string): Promise<void>;
}

export class ConsoleOtpAdapter implements OtpAdapter {
  async sendOtp(tokenSuffix: string, code: string): Promise<void> {
    console.log(`[ZIDDI OTP] citizen=${tokenSuffix} code=${code} (demo adapter)`);
  }
}

interface PendingOtp {
  readonly code: string;
  readonly expiresAt: number;
  attempts: number;
}

export class OtpService {
  private readonly pending = new Map<string, PendingOtp>();
  private readonly verified = new Map<string, number>();

  constructor(private readonly adapter: OtpAdapter) {}

  async issue(token: string): Promise<string> {
    const code = String(randomInt(100000, 1000000));
    this.pending.set(token, { code, expiresAt: Date.now() + 5 * 60_000, attempts: 0 });
    this.verified.delete(token);
    await this.adapter.sendOtp(token.slice(0, 8), code);
    return code;
  }

  verify(token: string, code: string): boolean {
    const entry = this.pending.get(token);
    if (entry === undefined) return false;
    if (Date.now() > entry.expiresAt) {
      this.pending.delete(token);
      return false;
    }
    if (entry.attempts >= 3) {
      this.pending.delete(token);
      return false;
    }
    if (entry.code !== code) {
      entry.attempts += 1;
      return false;
    }
    this.pending.delete(token);
    this.verified.set(token, Date.now() + 15 * 60_000);
    return true;
  }

  isVerified(token: string): boolean {
    const expiresAt = this.verified.get(token);
    if (expiresAt === undefined) return false;
    if (Date.now() > expiresAt) {
      this.verified.delete(token);
      return false;
    }
    return true;
  }
}
