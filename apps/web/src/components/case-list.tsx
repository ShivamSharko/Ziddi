"use client";

import { useEffect, useState } from "react";
import { Sla, type CaseKind, type Urgency } from "@ziddi/domain";
import { useLang } from "./language-provider";

interface CaseSummary {
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
}

const fmtCountdown = (ms: bigint): string => {
  const total = ms < 0n ? 0n : ms / 1000n;
  const h = total / 3600n;
  const m = (total % 3600n) / 60n;
  const s = total % 60n;
  const pad = (n: bigint) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const urgencyChip = (u: string): string =>
  u === "Emergency"
    ? "chip-ember"
    : u === "High"
      ? "chip-rosewood"
      : u === "Standard"
        ? "chip-signal"
        : "bg-white/5 text-[var(--text-2)]";

export function CaseList() {
  const { t } = useLang();
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/cases")
      .then((r) => r.json())
      .then((d) => {
        setCases(d.cases ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return <p className="mosaic-reveal font-mono-data text-xs text-[var(--text-2)]">READING CASE FILES…</p>;
  }

  if (cases.length === 0) {
    return (
      <div className="crop-frame dim space-y-2 p-10 text-center">
        <p className="font-mono-data text-xs uppercase tracking-[0.2em] text-[var(--text-2)]">
          {t("cases.empty")}
        </p>
        <a href="/" className="text-sm text-[var(--signal)] underline">
          {t("cases.emptyCta")}
        </a>
      </div>
    );
  }

  const now = BigInt(Date.now());

  return (
    <ul className="divide-y divide-[var(--hairline)] border-y border-[var(--hairline)]">
      {cases.map((c) => {
        let chip = { overdue: false, label: "—" };
        try {
          const win = Sla.windowFor(c.kind as CaseKind, c.urgency as Urgency);
          const remaining = BigInt(c.openedAtMs) + win.resolutionMs - now;
          chip =
            remaining < 0n
              ? { overdue: true, label: "OVERDUE — escalate" }
              : { overdue: false, label: `${fmtCountdown(remaining)} left` };
        } catch {
          // unknown kind: no SLA chip
        }
        return (
          <li key={c.id}>
            <a
              href={`/cases/${c.id}`}
              className="lift grid grid-cols-[auto_1fr_auto] items-start gap-4 px-2 py-5 hover:bg-[var(--ink-2)]"
            >
              <div className="text-right">
                <span className="font-anton text-4xl leading-none">{c.votes}</span>
                <p className="font-mono-data text-[9px] uppercase tracking-[0.2em] text-[var(--text-2)]">
                  votes
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-display text-lg font-bold leading-snug">{c.summary}</p>
                <p className="text-xs text-[var(--text-2)]">
                  {c.locality !== undefined && c.locality !== null && c.locality.length > 0
                    ? `${c.locality}, `
                    : ""}
                  {c.city} · {c.state}
                  {c.amountRupees !== null ? ` · ₹${c.amountRupees.toLocaleString("en-IN")}` : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="chip-moss rounded-full px-2.5 py-0.5 text-[10px] font-semibold">
                    {c.kind}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${urgencyChip(c.urgency)}`}
                  >
                    {c.urgency}
                  </span>
                  <span className="chip-signal rounded-full px-2.5 py-0.5 text-[10px] font-semibold">
                    {c.status}
                  </span>
                  {c.anonymous && (
                    <span className="chip-rosewood rounded-full px-2.5 py-0.5 text-[10px] font-semibold">
                      anonymous
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`rounded-sm px-2 py-1 font-mono-data text-[10px] ${
                  chip.overdue ? "chip-ember" : "bg-white/5 text-[var(--text-2)]"
                }`}
              >
                {chip.label}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
