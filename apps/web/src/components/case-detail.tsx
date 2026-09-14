"use client";

import { useCallback, useEffect, useState } from "react";
import { isValidAadhaar } from "@ziddi/domain";
import { AadhaarOtp } from "./aadhaar-otp";

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
  locality: string | null;
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
  votes: number;
  events: CaseEventDto[];
  evidence: EvidenceDto[];
  pendingDraft: PendingDraft | null;
}

interface PendingFile {
  name: string;
  dataUrl: string;
  desc: string;
}

const DAY_MS = 86_400_000;
const STAGES = ["DemandNotice", "FirstAppeal", "RtiApplication"] as const;
type Stage = (typeof STAGES)[number];

export function CaseDetailView({ caseId }: { caseId: string }) {
  const [detail, setDetail] = useState<CaseDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [textEvidenceDesc, setTextEvidenceDesc] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [upvoteDone, setUpvoteDone] = useState(false);
  const [upvoteMsg, setUpvoteMsg] = useState<string | null>(null);
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

  const onFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const remaining = 6 - pendingFiles.length;
    const toAdd = files.slice(0, Math.max(0, remaining));
    for (const file of toAdd) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setPendingFiles((prev) => [
            ...prev,
            {
              name: file.name,
              dataUrl: reader.result as string,
              desc: file.name.replace(/\.[^.]+$/, ""),
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addEvidence = () => {
    const items: Array<{
      description: string;
      mimeType: string;
      dataUrl?: string;
      fileName?: string;
    }> = [];

    for (const f of pendingFiles) {
      const mimeType =
        f.dataUrl.split(";")[0]?.replace("data:", "") ?? "application/octet-stream";
      items.push({
        description: f.desc.trim().length >= 3 ? f.desc.trim() : f.name,
        mimeType,
        dataUrl: f.dataUrl,
        fileName: f.name,
      });
    }

    if (items.length === 0 && textEvidenceDesc.trim().length >= 3) {
      items.push({ description: textEvidenceDesc.trim(), mimeType: "text/plain" });
    }

    if (items.length === 0) return;

    void post("evidence", { items });
    setTextEvidenceDesc("");
    setPendingFiles([]);
  };

  const postUpvote = async (aadhaar: string) => {
    setBusy(true);
    setUpvoteMsg(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aadhaar }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Upvote failed");
      }
      setUpvoteDone(true);
      await load();
    } catch (e) {
      setUpvoteMsg(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  if (detail === null) {
    return <div className="py-12 text-center text-gray-500">Loading case...</div>;
  }

  const daysLeft = Math.ceil(detail.slaRemainingMs / DAY_MS);
  const daysActive = Math.max(1, Math.floor((Date.now() - detail.openedAtMs) / DAY_MS));
  const approvals = detail.events.filter((e) => e.type === "DraftApproved").length;

  const shareText = `Ziddi case ${detail.id.slice(0, 8)}: ${detail.summary} | ${detail.city} | 👍 ${detail.votes} supports | SLA ${daysLeft}d left. Family se discuss karo: ${typeof window !== "undefined" ? window.location.href : ""}`;

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
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">👍 {detail.votes}</span>
          {detail.anonymous && (
            <span className="px-2 py-0.5 bg-gray-800 text-white rounded">🕶️ Anonymous</span>
          )}
        </div>
        <h1 className="text-2xl font-bold">{detail.summary}</h1>
        <p className="text-sm text-gray-500">
          {detail.locality !== null && detail.locality.length > 0
            ? `${detail.locality}, `
            : ""}
          {detail.city}, {detail.state}
          {detail.amountRupees > 0
            ? ` · ₹${detail.amountRupees.toLocaleString("en-IN")}`
            : ""}
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

      <section className="rounded-lg border border-[var(--border)] p-4 space-y-3">
        <div>
          <p className="text-sm font-semibold">👍 Community support: {detail.votes}</p>
          <p className="text-xs text-gray-600 mt-1">
            Zyada votes = zyada priority. Ek citizen, ek vote (Aadhaar-verified, number never
            stored).
          </p>
        </div>
        {upvoteDone ? (
          <p className="text-xs text-green-600">✅ Your support counted. Shukriya!</p>
        ) : (
          <AadhaarOtp verified={false} onVerified={(aadhaar) => void postUpvote(aadhaar)} />
        )}
        {upvoteMsg !== null && <p className="text-xs text-red-500">{upvoteMsg}</p>}
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
            Receipts, UPI screenshots, agreements, photos — har cheez count hoti hai. Multi-upload
            supported (max 6 per batch).
          </p>

          {detail.evidence.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {detail.evidence.map((ev) => (
                <div
                  key={ev.evidenceId}
                  className="rounded border border-[var(--border)] overflow-hidden bg-white"
                >
                  {ev.dataUrl !== undefined && ev.dataUrl.length > 0 ? (
                    <img
                      src={ev.dataUrl}
                      alt={ev.description}
                      className="h-16 w-full object-cover"
                    />
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

          {pendingFiles.length > 0 && (
            <div className="space-y-2 border border-dashed border-[var(--border)] rounded-md p-3">
              <p className="text-xs font-medium text-gray-600">
                Ready to upload ({pendingFiles.length}/6):
              </p>
              {pendingFiles.map((f, i) => (
                <div key={`${f.name}-${i}`} className="flex items-center gap-2">
                  <img
                    src={f.dataUrl}
                    alt={f.name}
                    className="h-10 w-10 rounded object-cover border border-[var(--border)]"
                  />
                  <input
                    value={f.desc}
                    onChange={(e) =>
                      setPendingFiles((prev) =>
                        prev.map((p, j) => (j === i ? { ...p, desc: e.target.value } : p)),
                      )
                    }
                    placeholder="Description (3+ chars)"
                    className="flex-1 px-2 py-1 border border-[var(--border)] rounded-md bg-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="text-red-500 text-xs px-2"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            value={textEvidenceDesc}
            onChange={(e) => setTextEvidenceDesc(e.target.value)}
            placeholder="Text-only evidence description (if not uploading files)"
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-white text-sm"
          />
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onFilesChange}
            disabled={pendingFiles.length >= 6}
            className="block w-full text-xs text-gray-500 file:mr-2 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-[var(--primary)]/10 file:text-[var(--primary)] file:text-xs file:font-medium"
          />
          <p className="text-[11px] text-gray-500">
            Select up to {6 - pendingFiles.length} more images. Describe each before uploading.
          </p>
          <button
            onClick={addEvidence}
            disabled={
              busy ||
              (pendingFiles.length === 0 && textEvidenceDesc.trim().length < 3)
            }
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-md text-sm disabled:opacity-50"
          >
            Add evidence (
            {pendingFiles.length > 0
              ? pendingFiles.length
              : textEvidenceDesc.trim().length >= 3
                ? 1
                : 0}
            )
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
