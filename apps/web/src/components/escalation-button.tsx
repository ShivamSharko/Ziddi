"use client";

import { useState } from "react";

interface EscalationResult {
  caseId: string;
  kind: string;
  escalated: boolean;
  reason?: string;
}

export function EscalationButton() {
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<EscalationResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runEscalation = async () => {
    setBusy(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch("/api/escalate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Escalation failed");
      }
      setResults(data.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  const escalatedCount = results.filter((r) => r.escalated).length;

  return (
    <div className="crop-frame space-y-3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-sm font-bold">Auto-Escalation Engine</p>
          <p className="mt-1 text-xs text-[var(--text-2)]">
            Checks every open case against its statutory SLA and drafts the next rung automatically.
          </p>
        </div>
        <button
          onClick={() => void runEscalation()}
          disabled={busy}
          className="shrink-0 rounded-full bg-[var(--signal)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          {busy ? "Checking..." : "Run Check"}
        </button>
      </div>

      {error !== null && <p className="text-xs text-[var(--ember)]">{error}</p>}

      {results.length > 0 && (
        <div className="space-y-1">
          <p className="font-mono-data text-[10px] text-[var(--text-2)]">
            {escalatedCount} escalated · {results.length - escalatedCount} skipped
          </p>
          <ul className="max-h-32 space-y-1 overflow-auto font-mono-data text-[10px] text-[var(--text-2)]">
            {results.map((r, i) => (
              <li key={`${r.caseId}-${i}`}>
                {r.escalated ? (
                  <span className="text-[var(--moss)]">
                    ✓ {r.caseId.slice(0, 8)}… ({r.kind}) escalated
                  </span>
                ) : (
                  <span>
                    – {r.caseId.slice(0, 8)}… ({r.kind}) {r.reason}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
