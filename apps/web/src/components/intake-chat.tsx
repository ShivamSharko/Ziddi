"use client";

import { useState, useEffect } from "react";
import { AadhaarOtp } from "./aadhaar-otp";
import { VoiceIntake } from "./voice-intake";

type Step = "idle" | "thinking" | "success" | "error";

interface FestivalTrigger {
  label: string;
  kinds: string[];
  suggestion: string;
}

interface DuplicateCase {
  id: string;
  summary: string;
  votes: number;
  locality: string | null;
  city: string;
}

export function IntakeChat() {
  const [text, setText] = useState("");
  const [locality, setLocality] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [anonymous, setAnonymous] = useState(false);
  const [triggers, setTriggers] = useState<FestivalTrigger[]>([]);
  const [verifiedAadhaar, setVerifiedAadhaar] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateCase[] | null>(null);
  const [result, setResult] = useState<{ caseId?: string; error?: string } | null>(null);
  const [voiceExtraction, setVoiceExtraction] = useState<{
    transcript: string;
    kind: string;
    summary: string;
    city: string;
    state: string;
    urgency: string;
    amountRupees?: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/festivals")
      .then((r) => r.json())
      .then((data) => setTriggers(data.triggers ?? []))
      .catch(() => setTriggers([]));
  }, []);

  const submit = async (forceNew: boolean) => {
    if (verifiedAadhaar === null) {
      setResult({ error: "Pehle Aadhaar + OTP verification complete karo" });
      setStep("error");
      return;
    }
    setStep("thinking");
    setResult(null);
    setDuplicates(null);

    try {
      const res = await fetch("/api/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawCitizenText: text,
          anonymous,
          aadhaar: verifiedAadhaar,
          locality,
          forceNew,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setDuplicates(data.duplicates ?? []);
        setStep("idle");
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || "Failed to start case");
      }
      setResult({ caseId: data.caseId });
      setStep("success");
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : "Unknown error" });
      setStep("error");
    }
  };

  const supportCase = async (id: string) => {
    if (verifiedAadhaar === null) return;
    setStep("thinking");
    setResult(null);
    try {
      const res = await fetch(`/api/cases/${id}/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aadhaar: verifiedAadhaar }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Upvote failed");
      }
      setResult({ caseId: id });
      setStep("success");
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : "Unknown error" });
      setStep("error");
    }
  };

  const handleVoiceExtraction = (data: {
    transcript: string;
    kind: string;
    summary: string;
    city: string;
    state: string;
    urgency: string;
    amountRupees?: number;
  }) => {
    setVoiceExtraction(data);
    setText(data.summary);
  };

  const activeTrigger = triggers[0];

  return (
    <div className="border border-[var(--border)] rounded-xl p-6 space-y-4 bg-[var(--muted)]/30">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-sm font-bold">
          Z
        </div>
        <div>
          <div className="font-semibold text-sm">Ziddi Bot</div>
          <div className="text-xs text-gray-500">Batao kya hua — I&apos;ll take it from here</div>
        </div>
      </div>

      {activeTrigger !== undefined && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 space-y-1">
          <p className="text-xs font-semibold text-amber-800">
            🎪 {activeTrigger.label} — seasonal spike active
          </p>
          <p className="text-xs text-amber-700">{activeTrigger.suggestion}</p>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(false);
        }}
        className="space-y-3"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. 'Mera landlord Bengaluru mein 60000 deposit wapas nahi de raha, 2 mahine ho gaye. Rental agreement hai mere paas.'"
          className="w-full h-32 px-4 py-3 border border-[var(--border)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
          disabled={step === "thinking"}
        />
        <input
          value={locality}
          onChange={(e) => setLocality(e.target.value)}
          placeholder="Area / locality (e.g. HSR Layout, Andheri West)"
          className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-white text-sm"
        />

        <AadhaarOtp verified={verifiedAadhaar !== null} onVerified={(a) => setVerifiedAadhaar(a)} />

        <VoiceIntake onExtraction={handleVoiceExtraction} />

        {voiceExtraction !== null && (
          <div className="rounded-md bg-green-50 border border-green-200 p-3 space-y-2">
            <p className="text-xs font-medium text-green-800">✅ Voice extracted:</p>
            <p className="text-xs text-green-700">
              <strong>Kind:</strong> {voiceExtraction.kind}
            </p>
            <p className="text-xs text-green-700">
              <strong>City:</strong> {voiceExtraction.city}, {voiceExtraction.state}
            </p>
            <p className="text-xs text-green-700">
              <strong>Urgency:</strong> {voiceExtraction.urgency}
            </p>
            {voiceExtraction.amountRupees !== undefined && (
              <p className="text-xs text-green-700">
                <strong>Amount:</strong> ₹{voiceExtraction.amountRupees}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setVoiceExtraction(null);
                setText("");
              }}
              className="text-xs text-green-700 underline"
            >
              Clear and type manually
            </button>
          </div>
        )}

        <label className="flex items-center gap-2 text-xs text-gray-600 select-none">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="w-4 h-4 rounded accent-[var(--primary)]"
          />
          🕶️ Anonymous mode — naam shared documents mein hide rahega (retaliation-safe)
        </label>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {step === "thinking" && "⏳ Gemini is analyzing..."}
            {step === "idle" && "🇮 English, Hindi, or Hinglish — sab chalega"}
          </div>
          <button
            type="submit"
            disabled={step === "thinking" || !text.trim() || verifiedAadhaar === null}
            className="px-5 py-2 bg-[var(--primary)] text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {step === "thinking" ? "Starting case..." : "Start My Case →"}
          </button>
        </div>
      </form>

      {duplicates !== null && duplicates.length > 0 && (
        <div className="rounded-lg border border-blue-300 bg-blue-50 p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-900">
            🤝 Same case, same location already exists — community power ikattha karo:
          </p>
          <ul className="space-y-2">
            {duplicates.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-2 text-xs text-blue-800"
              >
                <span className="truncate">
                  {d.summary}
                  {d.locality !== null ? ` · ${d.locality}` : ""} · 👍 {d.votes}
                </span>
                <button
                  type="button"
                  onClick={() => void supportCase(d.id)}
                  className="px-3 py-1 bg-green-600 text-white rounded shrink-0"
                >
                  Support
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => void submit(true)}
            className="text-xs text-blue-700 underline"
          >
            Naya case file karna hai anyway? Click here
          </button>
        </div>
      )}

      {result !== null && (
        <div
          className={`p-4 rounded-lg ${
            step === "error" ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"
          }`}
        >
          {result.caseId !== undefined && (
            <>
              <p className="text-sm font-medium text-green-900">✅ Case created / supported!</p>
              <p className="text-xs text-green-700 mt-1">
                Case ID: <code className="bg-white px-1 py-0.5 rounded">{result.caseId}</code>
              </p>
              <a
                href={`/cases/${result.caseId}`}
                className="inline-block mt-1 text-sm text-[var(--primary)] hover:underline"
              >
                View case →
              </a>
            </>
          )}
          {result.error !== undefined && <p className="text-sm text-red-700">❌ {result.error}</p>}
        </div>
      )}
    </div>
  );
}
