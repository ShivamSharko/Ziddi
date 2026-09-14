"use client";

import { useCallback, useEffect, useState } from "react";

interface PendingDraft {
  draftId: string;
  stage: string;
  language: string;
  body: string;
  confidence: number;
}

interface CaseEventDto {
  type: string;
  at: number;
  actor: string;
  detail: string;
}

interface EvidenceDto {
  evidenceId: string;
  description: string;
  mimeType: string;
  dataUrl?: string;
}

interface CaseDetailData {
  id: string;
  kind: string;
  summary: string;
  city: string;
  state: string;
  urgency: string;
  status: string;
  amountRupees: number;
  openedAtMs: number;
  evidenceCount: number;
  slaOverdue: boolean;
  slaRemainingMs: number;
  anonymous: boolean;
  progress: number;
  percentile: number;
  events: CaseEventDto[];
  evidence: EvidenceDto[];
  pendingDraft: PendingDraft | null;
}

const DAY_MS = 86_400_000;
const STAGES = ["DemandNotice", "FirstAppeal", "RtiApplication"] as const;
type Stage = (typeof STAGES)[number];

export function CaseDetailView({ caseId }: { caseId: string }) {
  const [detail, setDetail] = useState<CaseDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [evidenceDesc, setEvidenceDesc] = useState("");
  const [pendingFile, setPendingFile] = useState<{ name: string; dataUrl: string } | null>(null);
  const [stage, setStage] = useState<Stage>("DemandNotice");

  const load = useCallback(async () => {
    const res = await fetch(`/api/cases/${caseId}`);
    const data = await res.json();
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to load case");
      return;
    }
    setDetail(data.case as CaseDetailData);
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const post = async (path: string, body: unknown) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Request failed");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file === undefined) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPendingFile({ name: file.name, dataUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const addEvidence = () => {
    if (evidenceDesc.trim().length === 0) return;
    const mimeType =
      pendingFile !== null
        ? (pendingFile.dataUrl.split(";")[0]?.replace("data:", "") ?? "image/jpeg")
        : "text/plain";
    void post("evidence", {
      description: evidenceDesc.trim(),
      mimeType,
      ...(pendingFile !== null
        ? { dataUrl: pendingFile.dataUrl, fileName: pendingFile.name }
        : {}),
    });
    setEvidenceDesc("");
    setPendingFile(null);
  };

  if (detail === null) {
    return <div className="py-12 text-center text-gray-500">Loading case...</div>;
  }

  const daysLeft = Math.ceil(detail.slaRemainingMs / DAY_MS);
  const daysActive = Math.max(1, Math.floor((Date.now() - detail.openedAtMs) / DAY_MS));
  const approvals = detail.events.filter((e) => e.type === "DraftApproved").length;

  const shareText = `Ziddi case ${detail.id.slice(0, 8)}: ${detail.summary} | ${detail.city} | SLA ${daysLeft}d left. Family se discuss karo: ${window.location.href}`;

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono text-gray-500">{detail.id}</span>
          <span className="px-2 py-0.5 bg-[var(--muted)] rounded">{detail.kind}</span>
          <span className="px-2 py-0.5 bg-[var(--muted)] rounded">{detail.urgency}</span>
          <span className="px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded">
            {detail.status}
          </span>
          {detail.anonymous && (
            <span className="px-2 py-0.5 bg-gray-800 text-white rounded">🕶️ Anonymous</span>
          )}
        </div>
        <h1 className="text-2xl font-bold">{detail.summary}</h1>
        <p className="text-sm text-gray-500">
          {detail.city}, {detail.state}
          {detail.amountRupees > 0 ? ` · ₹${detail.amountRupees.toLocaleString("en-IN")}` : ""}
        </p>
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Case progress</span>
            <span>{detail.progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--muted)]">
            <div
              className="h-2 rounded-full bg-[var(--primary)] transition-all"
              style={{ width: `${detail.progress}%` }}
            />
          </div>
        </div>
      </header>

      <section className="rounded-lg border border-[var(--border)] p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold">🔥 Fight Meter</p>
            <p className="text-xs text-gray-600 mt-1">
              You&apos;re more persistent than <strong>{detail.percentile}%</strong> of fighters in{" "}
              {detail.city}.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              📸 {detail.evidenceCount} evidence · 📝 {approvals} approved · 📅 {daysActive} days
              fighting
            </p>
          </div>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:opacity-90 shrink-0"
          >
            👨👩👧 Share with family
          </a>
        </div>
      </section>

      <section
        className={`rounded-lg border p-4 ${
          detail.slaOverdue ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">
              {detail.slaOverdue ? "⏰ SLA breached — time to escalate" : "⏳ Within legal SLA window"}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {detail.slaOverdue
                ? `Overdue by ${Math.abs(daysLeft)} days. Ziddi recommends the next escalation rung.`
                : `${daysLeft} days left before escalation is due.`}
            </p>
          </div>
          <button
            onClick={() => void post("draft", { stage })}
            disabled={busy}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-md text-sm disabled:opacity-50 shrink-0"
          >
            {busy ? "Gemini writing..." : `Draft ${stage}`}
          </button>
        </div>
        <label className="block mt-3 text-xs text-gray-600">
          Escalation rung:{" "}
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as Stage)}
            className="ml-1 border border-[var(--border)] rounded px-2 py-1 bg-white text-sm"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </section>

      {error !== null && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-[var(--border)] p-4 space-y-3">
          <h2 className="font-semibold">📸 Evidence Vault ({detail.evidenceCount})</h2>
          <p className="text-xs text-gray-500">
            Receipts, UPI screenshots, agreements, photos — har cheez count hoti hai.
          </p>

          {detail.evidence.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {detail.evidence.map((ev) => (
                <div
                  key={ev.evidenceId}
                  className="rounded border border-[var(--border)] overflow-hidden bg-white"
                >
                  {ev.dataUrl !== undefined ? (
                    <img src={ev.dataUrl} alt={ev.description} className="h-16 w-full object-cover" />
                  ) : (
                    <div className="h-16 flex items-center justify-center bg-[var(--muted)] text-xl">
                      📄
                    </div>
                  )}
                  <p className="text-[10px] p-1 truncate" title={ev.description}>
                    {ev.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          <input
            value={evidenceDesc}
            onChange={(e) => setEvidenceDesc(e.target.value)}
            placeholder="e.g. Rental agreement page 1 / UPI screenshot of deposit"
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-white text-sm"
          />
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="block w-full text-xs text-gray-500 file:mr-2 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-[var(--primary)]/10 file:text-[var(--primary)] file:text-xs file:font-medium"
          />
          {pendingFile !== null && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <img
                src={pendingFile.dataUrl}
                alt="preview"
                className="h-10 w-10 rounded object-cover border border-[var(--border)]"
              />
              <span className="truncate">{pendingFile.name}</span>
            </div>
          )}
          <button
            onClick={addEvidence}
            disabled={busy || evidenceDesc.trim().length === 0}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-md text-sm disabled:opacity-50"
          >
            Add evidence
          </button>
        </section>

        <section className="rounded-lg border border-[var(--border)] p-4 space-y-2">
          <h2 className="font-semibold">🕰️ Case Timeline</h2>
          <ul className="space-y-2 text-sm">
            {detail.events.map((e, i) => (
              <li key={`${e.at}-${i}`} className="flex gap-2">
                <span className="text-gray-400 shrink-0">
                  {new Date(e.at).toLocaleDateString("en-IN")}
                </span>
                <span>
                  <strong>{e.type}</strong> · {e.detail}{" "}
                  <span className="text-gray-400">({e.actor})</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {detail.pendingDraft !== null && (
        <section className="rounded-lg border border-[var(--border)] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">📝 Draft: {detail.pendingDraft.stage}</h2>
            <span className="text-xs text-gray-500">
              confidence {(detail.pendingDraft.confidence * 100).toFixed(0)}% ·{" "}
              {detail.pendingDraft.language}
            </span>
          </div>
          <pre className="whitespace-pre-wrap rounded-md bg-[var(--muted)] p-4 text-sm max-h-96 overflow-auto">
            {detail.pendingDraft.body}
          </pre>
          <p className="text-xs text-gray-500">
            Informational assistance, not legal advice. Review before sending. Ziddi never
            auto-files.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => void post("approve", { approved: true })}
              disabled={busy}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm disabled:opacity-50"
            >
              ✅ Approve draft
            </button>
            <button
              onClick={() => void post("approve", { approved: false, reason: "Needs changes" })}
              disabled={busy}
              className="px-4 py-2 border border-[var(--border)] rounded-md text-sm disabled:opacity-50"
            >
              ✏️ Request changes
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
