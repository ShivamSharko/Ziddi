"use client";

import { useCallback, useEffect, useState } from "react";
import { Camera, Share2 } from "lucide-react";
import { Sla, type CaseKind, type Urgency } from "@ziddi/domain";
import { AadhaarOtp } from "./aadhaar-otp";

interface ProgressInfo {
  percent: number;
  evidence: number;
  approvals: number;
  daysActive: number;
  percentile: number;
}

interface EvidenceItem {
  id: string;
  description: string;
  mimeType: string;
  fileName?: string;
  dataUrl?: string;
  atMs?: number;
}

interface TimelineItem {
  type: string;
  atMs: number;
  detail?: string;
}

interface DraftInfo {
  draftId: string;
  stage: string;
  body: string;
  formattedDocument?: string;
  confidence: number;
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
  votes: number;
  anonymous: boolean;
  amountRupees: number | null;
  evidenceCount: number;
  openedAtMs: number;
  progress?: ProgressInfo;
  evidence?: EvidenceItem[];
  timeline?: TimelineItem[];
  currentDraft?: DraftInfo | null;
  pendingDraft?: DraftInfo | null;
}

const fmtStamp = (ms: number): string => {
  const d = new Date(ms);
  const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} · ${time}`;
};

const fmtCountdown = (ms: bigint): string => {
  const total = ms < 0n ? 0n : ms / 1000n;
  const h = total / 3600n;
  const m = (total % 3600n) / 60n;
  const s = total % 60n;
  const pad = (n: bigint) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const humanize = (s: string): string => s.replace(/([a-z])([A-Z])/g, "$1 $2");

const normalizeDetail = (raw: Record<string, unknown>): CaseDetailData => ({
  id: String(raw.id ?? ""),
  kind: String(raw.kind ?? "Unknown"),
  summary: String(raw.summary ?? ""),
  city: String(raw.city ?? ""),
  state: String(raw.state ?? ""),
  locality: raw.locality === undefined || raw.locality === null ? null : String(raw.locality),
  urgency: String(raw.urgency ?? "Standard"),
  status: String(raw.status ?? "Intake"),
  votes: Number(raw.votes ?? 0),
  anonymous: raw.anonymous === true,
  amountRupees:
    raw.amountRupees === undefined || raw.amountRupees === null
      ? null
      : Number(raw.amountRupees),
  evidenceCount: Number(raw.evidenceCount ?? 0),
  openedAtMs: Number(raw.openedAtMs ?? Date.now()),
  progress:
    (raw.progress as ProgressInfo) ?? {
      percent: 0,
      evidence: 0,
      approvals: 0,
      daysActive: 0,
      percentile: 0,
    },
  evidence: Array.isArray(raw.evidence) ? (raw.evidence as EvidenceItem[]) : [],
  timeline: Array.isArray(raw.timeline) ? (raw.timeline as TimelineItem[]) : [],
  currentDraft:
    (raw.pendingDraft as DraftInfo | null) ?? (raw.currentDraft as DraftInfo | null) ?? null,
});

export function CaseDetail({ caseId }: { caseId: string }) {
  const [detail, setDetail] = useState<CaseDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [evidenceDesc, setEvidenceDesc] = useState("");
  const [pendingFiles, setPendingFiles] = useState<
    Array<{ name: string; dataUrl: string; desc: string }>
  >([]);
  const [stage, setStage] = useState("DemandNotice");
  const [upvoteDone, setUpvoteDone] = useState(false);
  const [upvoteMsg, setUpvoteMsg] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [liveDraft, setLiveDraft] = useState<DraftInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    summary: "",
    locality: "",
    city: "",
    state: "",
    urgency: "Standard",
    amountRupees: 0,
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}/full`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to load");
      }
      setDetail(normalizeDetail(data as Record<string, unknown>));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const post = async (suffix: string, body: unknown) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/${suffix}`, {
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

  const addEvidence = () => {
    const items: Array<{
      description: string;
      mimeType: string;
      dataUrl?: string;
      fileName?: string;
    }> = [];
    for (const f of pendingFiles) {
      const mimeType = f.dataUrl.split(";")[0]?.replace("data:", "") || "image/jpeg";
      items.push({
        description: f.desc.trim().length >= 3 ? f.desc.trim() : f.name,
        mimeType,
        dataUrl: f.dataUrl,
        fileName: f.name,
      });
    }
    if (items.length === 0 && evidenceDesc.trim().length >= 3) {
      items.push({ description: evidenceDesc.trim(), mimeType: "text/plain" });
    }
    if (items.length === 0) return;
    void post("evidence", { items });
    setEvidenceDesc("");
    setPendingFiles([]);
  };

  const onFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const remaining = 6 - pendingFiles.length;
    for (const file of files.slice(0, Math.max(0, remaining))) {
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

  const requestDraft = async () => {
    setBusy(true);
    setDraftError(null);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : `Draft failed (${res.status})`,
        );
      }
      setLiveDraft({
        draftId: data.draftId,
        stage: data.stage,
        body: data.body,
        formattedDocument: data.formattedDocument,
        confidence: data.confidence,
      });
      await load();
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: editForm.summary,
          locality: editForm.locality,
          city: editForm.city,
          state: editForm.state,
          urgency: editForm.urgency,
          amountRupees: editForm.amountRupees,
          reason: "Citizen edited case details",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Update failed");
      }
      setEditing(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  if (error !== null && detail === null) {
    return <p className="text-sm text-[var(--ember)]">{error}</p>;
  }
  if (detail === null) {
    return <p className="mosaic-reveal font-mono-data text-xs text-[var(--text-2)]">READING CASE FILE…</p>;
  }

  let sla = { overdue: false, label: "—" };
  try {
    const win = Sla.windowFor(detail.kind as CaseKind, detail.urgency as Urgency);
    const remaining = BigInt(detail.openedAtMs) + win.resolutionMs - BigInt(Date.now());
    sla =
      remaining < 0n
        ? { overdue: true, label: "OVERDUE — escalate" }
        : { overdue: false, label: `${fmtCountdown(remaining)} left` };
  } catch {
    // unknown kind
  }

  const progress = detail.progress ?? {
    percent: 0,
    evidence: detail.evidenceCount,
    approvals: 0,
    daysActive: 0,
    percentile: 0,
  };
  const evidence = detail.evidence ?? [];
  const timeline = detail.timeline ?? [];
  const draft = liveDraft ?? detail.currentDraft ?? detail.pendingDraft ?? null;
  const shareText = encodeURIComponent(
    `Ziddi case ${detail.id}: ${detail.summary} — support karo: ${
      typeof window !== "undefined" ? window.location.href : ""
    }`,
  );

  return (
    <div className="space-y-8">
      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-8 left-0 select-none font-anton text-[18vw] leading-none text-white/[0.04] md:text-[9rem]"
        >
          ON RECORD
        </span>
        <div className="relative space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="chip-ember rounded-full px-2.5 py-0.5 text-[10px] font-semibold">
              {detail.urgency} urgency
            </span>
            <span className="chip-moss rounded-full px-2.5 py-0.5 text-[10px] font-semibold">
              {detail.kind}
            </span>
            <span className="chip-signal rounded-full px-2.5 py-0.5 text-[10px] font-semibold">
              {detail.status}
            </span>
            {detail.anonymous && (
              <span className="chip-rosewood rounded-full px-2.5 py-0.5 text-[10px] font-semibold">
                anonymous
              </span>
            )}
            {evidence.length > 0 && (
              <span className="chip-moss rounded-full px-2.5 py-0.5 text-[10px] font-semibold">
                verified evidence
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl font-black leading-tight md:text-4xl">{detail.summary}</h1>
          <p className="text-sm text-[var(--text-2)]">
            {detail.locality !== undefined && detail.locality !== null && detail.locality.length > 0
              ? `${detail.locality}, `
              : ""}
            {detail.city}, {detail.state}
            {detail.amountRupees !== undefined && detail.amountRupees !== null
              ? ` · ₹${detail.amountRupees.toLocaleString("en-IN")}`
              : ""}
          </p>
          <p className="font-mono-data text-[10px] text-[var(--text-2)]">
            CASE #{detail.id} · OPENED {fmtStamp(detail.openedAtMs)}
          </p>
          <button
            type="button"
            onClick={() => {
              if (!editing) {
                setEditForm({
                  summary: detail.summary,
                  locality: detail.locality ?? "",
                  city: detail.city,
                  state: detail.state,
                  urgency: detail.urgency,
                  amountRupees: detail.amountRupees ?? 0,
                });
              }
              setEditing(!editing);
            }}
            className="font-mono-data text-[10px] uppercase tracking-[0.18em] text-[var(--signal)] underline"
          >
            {editing ? "Cancel edit" : "Edit case"}
          </button>
          {editing && (
            <div className="crop-frame dim space-y-3 p-4">
              <input
                className="field-underline"
                value={editForm.summary}
                onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                placeholder="Summary"
              />
              <div className="flex gap-4">
                <input
                  className="field-underline flex-1"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  placeholder="City"
                />
                <input
                  className="field-underline flex-1"
                  value={editForm.state}
                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                  placeholder="State"
                />
              </div>
              <div className="flex gap-4">
                <input
                  className="field-underline flex-1"
                  value={editForm.locality}
                  onChange={(e) => setEditForm({ ...editForm, locality: e.target.value })}
                  placeholder="Locality"
                />
                <input
                  className="field-underline w-32"
                  type="number"
                  value={editForm.amountRupees}
                  onChange={(e) =>
                    setEditForm({ ...editForm, amountRupees: Number(e.target.value) })
                  }
                  placeholder="₹ amount"
                />
              </div>
              <select
                value={editForm.urgency}
                onChange={(e) => setEditForm({ ...editForm, urgency: e.target.value })}
                className="w-full border border-[var(--hairline)] bg-[var(--ink-3)] px-2 py-2 text-xs text-[var(--text)]"
              >
                <option value="Emergency">Emergency</option>
                <option value="High">High</option>
                <option value="Standard">Standard</option>
                <option value="Low">Low</option>
              </select>
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveEdit()}
                className="rounded-full bg-[var(--signal)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                Save changes (logged to timeline)
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[320px_1fr]">
        <aside className="space-y-4 md:sticky md:top-20 md:self-start">
          <section className="crop-frame dim space-y-4 p-5">
            <p className="font-display text-sm font-bold">Fight Meter</p>
            <div className="flex items-center gap-4">
              <div className="relative h-32 w-32 shrink-0" style={{ clipPath: "url(#petal4)" }}>
                <div
                  className="absolute inset-0"
                  style={{ background: `conic-gradient(var(--signal) ${progress.percent}%, var(--ink-3) 0)` }}
                />
                <div
                  className="absolute inset-3 flex items-center justify-center"
                  style={{ clipPath: "url(#petal4)", background: "var(--ink-2)" }}
                >
                  <span className="font-anton text-3xl">{progress.percent}%</span>
                </div>
              </div>
              <p className="text-xs text-[var(--text-2)]">
                More persistent than {progress.percentile}% of fighters in {detail.city}
              </p>
            </div>
            <div className="flex gap-4 font-mono-data text-[10px] text-[var(--text-2)]">
              <span>
                <span className="font-anton text-base text-[var(--text)]">{progress.evidence}</span> evidence
              </span>
              <span>
                <span className="font-anton text-base text-[var(--text)]">{progress.approvals}</span> approvals
              </span>
              <span>
                <span className="font-anton text-base text-[var(--text)]">{progress.daysActive}</span> days
              </span>
            </div>
            <div className="flex justify-end">
              <a
                href={`https://wa.me/?text=${shareText}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Share with family on WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ink-3)] text-[var(--text)] hover:bg-[var(--signal)]"
              >
                <Share2 size={14} />
              </a>
            </div>
          </section>

          <section className="crop-frame dim space-y-3 p-5">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex h-10 w-10 shrink-0 items-center justify-center bg-[var(--rosewood)] font-display text-xl font-black text-[#2a1a1c]"
                style={{ clipPath: "url(#blob1)" }}
              >
                +
              </span>
              <div>
                <p className="font-display text-sm font-bold">
                  <span className="font-anton text-xl">{detail.votes}</span> backing this case
                </p>
                <p className="text-[11px] text-[var(--text-2)]">OTP-verified, one vote per person</p>
              </div>
            </div>
            {upvoteDone ? (
              <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--moss)]">
                ✓ Your support counted
              </p>
            ) : (
              <AadhaarOtp verified={false} onVerified={(aadhaar) => void postUpvote(aadhaar)} />
            )}
            {upvoteMsg !== null && <p className="text-xs text-[var(--ember)]">{upvoteMsg}</p>}
          </section>

          <section className={`crop-frame space-y-3 p-5 ${sla.overdue ? "ember" : "dim"}`}>
            <p className="font-display text-sm font-bold">Statutory SLA</p>
            <p className={`font-mono-data text-xs ${sla.overdue ? "text-[var(--ember)]" : "text-[var(--text-2)]"}`}>
              {sla.label}
            </p>
            {sla.overdue && (
              <p className="text-xs text-[var(--text-2)]">
                Statutory deadline breach recorded. Escalation ladder ready.
              </p>
            )}
            <label className="block space-y-1">
              <span className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--text-2)]">
                Escalate to
              </span>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full border border-[var(--hairline)] bg-[var(--ink-3)] px-2 py-2 text-xs text-[var(--text)]"
              >
                <option value="DemandNotice">Demand Notice</option>
                <option value="FirstAppeal">First Appeal</option>
                <option value="SecondAppeal">Second Appeal</option>
                <option value="RtiApplication">RTI Application</option>
              </select>
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() => void requestDraft()}
              className="w-full rounded-full bg-[var(--signal)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
              {busy ? "Drafting…" : `Draft ${stage}`}
            </button>
          </section>
        </aside>

        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="font-display text-lg font-bold">Evidence Vault</h2>
            {evidence.length === 0 ? (
              <div className="crop-frame dim flex items-center gap-4 p-4">
                <div
                  aria-hidden
                  className="h-20 w-20 shrink-0 opacity-70"
                  style={{
                    backgroundImage: "url('/images/evidence-mosaic.png')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    clipPath: "url(#petal4)",
                  }}
                />
                <p className="text-sm text-[var(--text-2)]">
                  No evidence on record — receipts, screenshots, UPI refs yahan add karo.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {evidence.map((ev, i) => (
                  <figure key={ev.id} className="space-y-1">
                    {i % 2 === 0 ? (
                      <div
                        className="flex h-24 items-center justify-center bg-[var(--ink-3)]"
                        style={{
                          clipPath: "url(#petal4)",
                          ...(ev.dataUrl !== undefined
                            ? { backgroundImage: `url(${ev.dataUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                            : {}),
                        }}
                      >
                        {ev.dataUrl === undefined && <Camera size={18} className="text-[var(--text-2)]" />}
                      </div>
                    ) : (
                      <div
                        className="crop-frame dim flex h-24 items-center justify-center"
                        style={
                          ev.dataUrl !== undefined
                            ? { backgroundImage: `url(${ev.dataUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                            : undefined
                        }
                      >
                        {ev.dataUrl === undefined && <Camera size={18} className="text-[var(--text-2)]" />}
                      </div>
                    )}
                    <figcaption className="font-mono-data text-[9px] uppercase tracking-[0.18em] text-[var(--text-2)]">
                      EVID-{String(i + 1).padStart(2, "0")} · {ev.description.slice(0, 24)}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
            {pendingFiles.length > 0 && (
              <div className="crop-frame dim space-y-2 p-3">
                <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[var(--text-2)]">
                  Staged for upload ({pendingFiles.length}/6)
                </p>
                {pendingFiles.map((f, i) => (
                  <div key={`${f.name}-${i}`} className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="h-10 w-10 shrink-0"
                      style={{
                        backgroundImage: `url(${f.dataUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        clipPath: "url(#petal4)",
                      }}
                    />
                    <input
                      value={f.desc}
                      onChange={(e) =>
                        setPendingFiles((prev) =>
                          prev.map((p, j) => (j === i ? { ...p, desc: e.target.value } : p)),
                        )
                      }
                      placeholder="Description (3+ chars)"
                      className="field-underline flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="font-mono-data text-xs text-[var(--ember)]"
                      aria-label={`Remove ${f.name}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onFilesChange}
              disabled={pendingFiles.length >= 6}
              className="block w-full text-xs text-[var(--text-2)] file:mr-2 file:rounded-full file:border-0 file:bg-[var(--ink-3)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--signal)]"
            />
            <div className="flex items-end gap-3">
              <input
                value={evidenceDesc}
                onChange={(e) => setEvidenceDesc(e.target.value)}
                placeholder="Text-only evidence description (optional if uploading images)"
                className="field-underline flex-1"
              />
              <button
                type="button"
                onClick={addEvidence}
                disabled={busy}
                className="shrink-0 rounded-full border border-[var(--signal)] px-4 py-2 text-xs font-semibold text-[var(--signal)] hover:bg-[var(--signal)] hover:text-white disabled:opacity-40"
              >
                Add evidence
              </button>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-lg font-bold">Timeline</h2>
            <ol className="space-y-4 border-l border-[var(--hairline)] pl-5">
              {timeline.map((item, i) => (
                <li key={i} className="relative space-y-0.5">
                  <span aria-hidden className="absolute -left-[26px] top-1 font-mono-data text-xs text-[var(--signal)]">
                    +
                  </span>
                  <p className="text-sm">
                    {humanize(item.type)}
                    {item.detail !== undefined ? ` — ${item.detail}` : ""}
                  </p>
                  <p className="font-mono-data text-[10px] text-[var(--text-2)]">{fmtStamp(item.atMs)}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-lg font-bold">Formal Draft</h2>
            {draftError !== null && (
              <p className="text-xs text-[var(--ember)]">Draft failed: {draftError}</p>
            )}
            {draft === null ? (
              <p className="text-sm text-[var(--text-2)]">
                No draft yet — pick an escalation rung and hit Draft.
              </p>
            ) : (
              <article className="paper-card paper-in space-y-4 p-6">
                <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[#5a5f66]">
                  Formal draft — {draft.stage}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {draft.formattedDocument ?? draft.body}
                </p>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <p className="text-[#5a5f66]">
                    <span className="font-anton text-4xl text-[#14161a]">
                      {Math.round(draft.confidence * 100)}
                    </span>
                    <span className="font-mono-data text-xs">/ 100 confidence</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void post("approve", {})}
                      className="rounded-full bg-[#14161a] px-5 py-2 text-xs font-semibold text-[var(--paper)] disabled:opacity-40"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void post("reject", { reason: "Citizen requested changes" })}
                      className="rounded-full border border-[#14161a] px-5 py-2 text-xs font-semibold text-[#14161a] disabled:opacity-40"
                    >
                      Request changes
                    </button>
                  </div>
                </div>
              </article>
            )}
          </section>

          {error !== null && <p className="text-sm text-[var(--ember)]">{error}</p>}
        </div>
      </div>
    </div>
  );
}
