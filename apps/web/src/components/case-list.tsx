"use client";

import { useEffect, useState } from "react";

interface CaseSummary {
  id: string;
  kind: string;
  summary: string;
  city: string;
  urgency: string;
  status: string;
  amountRupees: number;
  slaOverdue: boolean;
  slaRemainingMs: number;
}

const DAY_MS = 86_400_000;

export function CaseList() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cases")
      .then((r) => r.json())
      .then((data) => setCases(data.cases ?? []))
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  if (cases.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-lg">
        <p className="text-gray-500 mb-4">Koi case nahi hai abhi</p>
        <a href="/" className="text-[var(--primary)] hover:underline">
          Start your first case →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cases.map((c) => (
        <a
          key={c.id}
          href={`/cases/${c.id}`}
          className="block border border-[var(--border)] rounded-lg p-4 hover:border-[var(--primary)] transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-500">{c.id.slice(0, 10)}...</span>
                <span className="text-xs px-2 py-0.5 bg-[var(--muted)] rounded">{c.urgency}</span>
                {c.amountRupees > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-[var(--muted)] rounded">₹{c.amountRupees.toLocaleString("en-IN")}</span>
                )}
              </div>
              <p className="font-medium mt-1">{c.summary}</p>
              <p className="text-sm text-gray-500 mt-1">
                {c.kind} · {c.city}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs px-2 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded block">
                {c.status}
              </span>
              <span className={`text-xs mt-1 block ${c.slaOverdue ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                {c.slaOverdue ? "⏰ OVERDUE" : `${Math.ceil(c.slaRemainingMs / DAY_MS)}d left`}
              </span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
