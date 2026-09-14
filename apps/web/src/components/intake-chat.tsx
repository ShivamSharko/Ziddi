"use client";

import { useEffect, useState } from "react";

type Step = "idle" | "thinking" | "success" | "error";

interface FestivalTrigger {
  season: string;
  label: string;
  kinds: string[];
  suggestion: string;
}

export function IntakeChat() {
  const [text, setText] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [anonymous, setAnonymous] = useState(false);
  const [triggers, setTriggers] = useState<FestivalTrigger[]>([]);
  const [result, setResult] = useState<{ caseId?: string; error?: string } | null>(null);

  useEffect(() => {
    fetch("/api/festivals")
      .then((r) => r.json())
      .then((data) => setTriggers(data.triggers ?? []))
      .catch(() => setTriggers([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setStep("thinking");
    setResult(null);

    try {
      const res = await fetch("/api/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawCitizenText: text, anonymous }),
      });
      const data = await res.json();
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
          placeholder="e.g. 'Mera landlord Bengaluru mein 60000 deposit wapas nahi de raha, 2 mahine ho gaye. Rental agreement hai mere paas.' or 'Pothole near HSR layout 27th main hasn't been fixed for 3 weeks.'"
          className="w-full h-32 px-4 py-3 border border-[var(--border)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
          disabled={step === "thinking"}
        />
        <label className="flex items-center gap-2 text-xs text-gray-600 select-none">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="w-4 h-4 accent-[var(--primary)]"
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
            disabled={step === "thinking" || !text.trim()}
            className="px-5 py-2 bg-[var(--primary)] text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {step === "thinking" ? "Starting case..." : "Start My Case →"}
          </button>
        </div>
      </form>

      {result !== null && (
        <div
          className={`p-4 rounded-lg ${
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
                className="inline-block mt-2 text-sm text-[var(--primary)] hover:underline"
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
