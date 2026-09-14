"use client";

import { useEffect, useState } from "react";
import { isValidAadhaar } from "@ziddi/domain";

type Step = "idle" | "thinking" | "success" | "error";

interface FestivalTrigger {
  season: string;
  label: string;
  kinds: string[];
  suggestion: string;
}

interface CaseListItem {
  id: string;
  kind: string;
  summary: string;
  city: string;
  votes: number;
}

export function IntakeChat() {
  const [text, setText] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [anonymous, setAnonymous] = useState(false);
  const [triggers, setTriggers] = useState<FestivalTrigger[]>([]);
  const [similar, setSimilar] = useState<CaseListItem[]>([]);
  const [result, setResult] = useState<{ caseId?: string; error?: string } | null>(null);

  useEffect(() => {
    fetch("/api/festivals")
      .then((r) => r.json())
      .then((data) => setTriggers(data.triggers ?? []))
      .catch(() => setTriggers([]));
  }, []);

  const aadhaarValid = isValidAadhaar(aadhaar);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !aadhaarValid) return;
    setStep("thinking");
    setResult(null);
    setSimilar([]);

    try {
      const res = await fetch("/api/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawCitizenText: text, anonymous, aadhaar }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start case");
      }
      setResult({ caseId: data.caseId });
      setStep("success");

      const detailRes = await fetch(`/api/cases/${data.caseId}`);
      const detailData = await detailRes.json();
      const created = detailData.case as CaseListItem;
      const listRes = await fetch("/api/cases");
      const listData = await listRes.json();
      const all: CaseListItem[] = listData.cases ?? [];
      setSimilar(
        all
          .filter((c) => c.id !== created.id && c.city === created.city && c.kind === created.kind)
          .slice(0, 3),
      );
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : "Unknown error" });
      setStep("error");
    }
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

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. 'Mera landlord Bengaluru mein 60000 deposit wapas nahi de raha, 2 mahine ho gaye. Rental agreement hai mere paas.'"
          className="w-full h-32 px-4 py-3 border border-[var(--border)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
          disabled={step === "thinking"}
        />

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600" htmlFor="aadhaar">
            Aadhaar verification (anti-fake) — number is NEVER stored, only a one-way hash
          </label>
          <input
            id="aadhaar"
            inputMode="numeric"
            value={aadhaar}
            onChange={(e) => setAadhaar(e.target.value.replace(/[^\d\s]/g, "").slice(0, 14))}
            placeholder="12-digit Aadhaar number"
            className={`w-full px-3 py-2 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 ${
              aadhaar.length === 0
                ? "border-[var(--border)] focus:ring-[var(--primary)]"
                : aadhaarValid
                  ? "border-green-400 focus:ring-green-400"
                  : "border-red-300 focus:ring-red-300"
            }`}
          />
          {aadhaar.length > 0 && (
            <p className={`text-xs ${aadhaarValid ? "text-green-600" : "text-red-500"}`}>
              {aadhaarValid
                ? "✅ Valid Aadhaar checksum (Verhoeff)"
                : "❌ Invalid: 12 digits required, checksum failing"}
            </p>
          )}
        </div>

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
            {step === "idle" && "🇮🇳 English, Hindi, or Hinglish — sab chalega"}
          </div>
          <button
            type="submit"
            disabled={step === "thinking" || !text.trim() || !aadhaarValid}
            className="px-5 py-2 bg-[var(--primary)] text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {step === "thinking" ? "Starting case..." : "Start My Case →"}
          </button>
        </div>
      </form>

      {result !== null && (
        <div
          className={`p-4 rounded-lg space-y-3 ${
            step === "error" ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"
          }`}
        >
          {result.caseId !== undefined && (
            <>
              <p className="text-sm font-medium text-green-900">✅ Case created!</p>
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

          {similar.length > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
              <p className="text-xs font-semibold text-blue-800">
                🤝 {similar.length} similar active case(s) in your city — support them instead of
                filing duplicates:
              </p>
              <ul className="space-y-1">
                {similar.map((c) => (
                  <li key={c.id} className="text-xs text-blue-700 flex justify-between gap-2">
                    <a href={`/cases/${c.id}`} className="hover:underline truncate">
                      {c.summary}
                    </a>
                    <span className="shrink-0">👍 {c.votes}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
