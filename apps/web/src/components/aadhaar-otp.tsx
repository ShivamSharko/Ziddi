"use client";

import { useState } from "react";
import { isValidAadhaar } from "@ziddi/domain";

interface AadhaarOtpProps {
  onVerified: (aadhaar: string) => void;
  verified: boolean;
}

export function AadhaarOtp({ onVerified, verified }: AadhaarOtpProps) {
  const [aadhaar, setAadhaar] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const aadhaarValid = isValidAadhaar(aadhaar);

  const sendOtp = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aadhaar }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to send OTP");
      }
      setOtpSent(true);
      setDevCode(typeof data.devCode === "string" ? data.devCode : null);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aadhaar, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "OTP verification failed");
      }
      onVerified(aadhaar);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  if (verified) {
    return (
      <div className="crop-frame p-4">
        <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--moss)]">
          ✓ Verified — crop-marks lock onto identity
        </p>
      </div>
    );
  }

  return (
    <div className="crop-frame dim p-4">
      <div className="flex gap-4">
        <div className="flex-1 space-y-3">
          <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--text-2)]">
            Verify to file
          </p>
          <div className="flex items-end gap-3">
            <input
              inputMode="numeric"
              value={aadhaar}
              onChange={(e) => setAadhaar(e.target.value.replace(/[^\d\s]/g, "").slice(0, 14))}
              placeholder="12-digit Aadhaar number"
              disabled={otpSent}
              className="field-underline flex-1"
            />
            {!otpSent && (
              <button
                type="button"
                onClick={() => void sendOtp()}
                disabled={busy || !aadhaarValid}
                className="shrink-0 rounded-full border border-[var(--signal)] px-4 py-2 text-xs font-semibold text-[var(--signal)] hover:bg-[var(--signal)] hover:text-white disabled:opacity-40"
              >
                Send OTP
              </button>
            )}
          </div>
          {aadhaar.length > 0 && !aadhaarValid && !otpSent && (
            <p className="text-xs text-[var(--ember)]">Invalid: 12 digits + Verhoeff checksum required</p>
          )}
          {otpSent && (
            <div className="space-y-2">
              {devCode !== null && (
                <p className="rounded-sm border border-[var(--hairline)] bg-[var(--ink-3)] p-2 font-mono-data text-[10px] text-[var(--text-2)]">
                  DEMO MODE — OTP: <span className="text-[var(--ember)]">{devCode}</span> · production:
                  SMS via licensed gateway
                </p>
              )}
              <div className="flex items-end gap-3">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit OTP"
                  className="field-underline w-40"
                />
                <button
                  type="button"
                  onClick={() => void verifyOtp()}
                  disabled={busy || code.length !== 6}
                  className="shrink-0 rounded-full bg-[var(--signal)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
                >
                  Verify
                </button>
              </div>
            </div>
          )}
          {msg !== null && <p className="text-xs text-[var(--ember)]">{msg}</p>}
          <p className="text-[11px] text-[var(--text-2)]">
            Aadhaar number is NEVER stored — only a one-way salted hash (UIDAI-compliant). OTP proves
            you own the number.
          </p>
        </div>
        <div
          aria-hidden
          className="hidden h-24 w-20 shrink-0 opacity-80 md:block"
          style={{
            backgroundImage: "url('/images/otp-verify.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            clipPath: "url(#petal4)",
          }}
        />
      </div>
    </div>
  );
}
