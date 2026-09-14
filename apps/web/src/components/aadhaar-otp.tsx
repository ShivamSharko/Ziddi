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
      <p className="text-xs text-green-600">
        ✅ Aadhaar + OTP verified (number never stored - hash only)
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          inputMode="numeric"
          value={aadhaar}
          onChange={(e) => setAadhaar(e.target.value.replace(/[^\d\s]/g, "").slice(0, 14))}
          placeholder="12-digit Aadhaar number"
          disabled={otpSent}
          className={`flex-1 px-3 py-2 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 ${
            aadhaar.length === 0
              ? "border-[var(--border)] focus:ring-[var(--primary)]"
              : aadhaarValid
                ? "border-green-400 focus:ring-green-400"
                : "border-red-300 focus:ring-red-300"
          }`}
        />
        {!otpSent && (
          <button
            type="button"
            onClick={() => void sendOtp()}
            disabled={busy || !aadhaarValid}
            className="px-3 py-2 bg-[var(--primary)] text-white rounded-md text-xs disabled:opacity-50 shrink-0"
          >
            Send OTP
          </button>
        )}
      </div>
      {aadhaar.length > 0 && !aadhaarValid && !otpSent && (
        <p className="text-xs text-red-500">❌ Invalid: 12 digits + Verhoeff checksum required</p>
      )}
      {otpSent && (
        <div className="space-y-2">
          {devCode !== null && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              🧪 Demo mode: your OTP is <strong>{devCode}</strong>. Production: SMS to
              Aadhaar-linked mobile via licensed gateway.
            </p>
          )}
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit OTP"
              className="flex-1 px-3 py-2 border border-[var(--border)] rounded-md bg-white text-sm"
            />
            <button
              type="button"
              onClick={() => void verifyOtp()}
              disabled={busy || code.length !== 6}
              className="px-3 py-2 bg-green-600 text-white rounded-md text-xs disabled:opacity-50 shrink-0"
            >
              Verify
            </button>
          </div>
        </div>
      )}
      {msg !== null && <p className="text-xs text-red-500">{msg}</p>}
      <p className="text-[11px] text-gray-500">
        Aadhaar number is NEVER stored — only a one-way salted hash (UIDAI-compliant). OTP proves
        you own the number.
      </p>
    </div>
  );
}
