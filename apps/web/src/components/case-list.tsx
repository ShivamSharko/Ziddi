"use client";

import { useEffect, useState } from "react";

interface CaseSummary {
  id: string;
  kind: string;
  summary: string;
  city: string;
  status: string;
  urgency: string;
}

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
          href={`/cases?id=${c.id}`}
          className="block border border-[var(--border)] rounded-lg p-4 hover:border-[var(--primary)] transition-colors"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-500">{c.id.slice(0, 10)}...</span>
                <span className="text-xs px-2 py-0.5 bg-[var(--muted)] rounded">{c.urgency}</span>
              </div>
              <p className="font-medium mt-1">{c.summary}</p>
              <p className="text-sm text-gray-500 mt-1">
                {c.kind} · {c.city}
              </p>
            </div>
            <span className="text-xs px-2 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded">
              {c.status}
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}

