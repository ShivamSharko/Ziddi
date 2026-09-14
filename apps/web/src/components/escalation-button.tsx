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
    <div className="rounded-lg border border-[var(--border)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">⏰ Auto-Escalation Engine</p>
          <p className="text-xs text-gray-600 mt-1">
            Check all cases for SLA breaches and auto-draft next escalation documents
          </p>
        </div>
        <button
          onClick={() => void runEscalation()}
          disabled={busy}
          className="px-4 py-2 bg-[var(--primary)] text-white rounded-md text-sm disabled:opacity-50 shrink-0"
        >
          {busy ? "Checking..." : "Run Escalation Check"}
        </button>
      </div>

      {error !== null && (
        <div className="rounded-md bg-red-50 border border-red-200 p-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium">
            {escalatedCount} escalated, {results.length - escalatedCount} skipped
          </p>
          <ul className="text-xs text-gray-600 space-y-1 max-h-32 overflow-auto">
            {results.map((r, i) => (
              <li key={`${r.caseId}-${i}`}>
                {r.escalated ? (
                  <span className="text-green-600">
                    ✅ {r.caseId.slice(0, 8)}... ({r.kind}) - escalated
                  </span>
                ) : (
                  <span className="text-gray-500">
                    ⏭️ {r.caseId.slice(0, 8)}... ({r.kind}) - {r.reason}
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

