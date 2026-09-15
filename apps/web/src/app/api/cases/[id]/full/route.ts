import { NextResponse } from "next/server";
import { getRepo } from "@/lib/repo";

type Ev = { type: string; at?: unknown; [k: string]: unknown };

const toMs = (at: unknown): number => {
  const n = typeof at === "bigint" ? Number(at) : Number(at ?? 0);
  return n > 1e12 ? n : n * 1000;
};

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const repo = getRepo();
    const events = (await repo.loadEvents(id)) as unknown as Ev[];
    if (events.length === 0) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    let base: Record<string, unknown> | null = null;
    const evidence: Array<Record<string, unknown>> = [];
    const timeline: Array<Record<string, unknown>> = [];
    const drafts: Array<Record<string, unknown>> = [];
    const resolved = new Set<string>();
    const updates: Array<Record<string, unknown>> = [];
    let votes = 0;

    for (const e of events) {
      const atMs = toMs(e.at);
      const pick = (...keys: string[]): string | null => {
        for (const k of keys) {
          const v = e[k];
          if (typeof v === "string" && v.length > 0) return v;
        }
        return null;
      };
      let detail: string | null = null;
      if (e.type === "CaseUpdated") detail = pick("reason") ?? "Citizen edited case details";
      else if (e.type === "EvidenceAttached") detail = pick("description");
      else if (e.type === "DraftPrepared") detail = `Draft prepared: ${String(e.stage ?? "")}`;
      else if (e.type === "DraftApproved") detail = "Citizen approved the draft";
      else if (e.type === "DraftRejected") detail = pick("reason") ?? "Citizen requested changes";
      else if (e.type === "CaseClosed") detail = pick("outcome", "reason") ?? "Case closed";
      else if (e.type === "SlaEscalated") detail = `Escalated to: ${pick("nextStage") ?? "next rung"}`;
      else if (e.type === "CommunityUpvote") detail = "Community support added (OTP-verified)";
      else if (e.type === "FiledExternally") detail = pick("portal", "reference") ?? "Filed on external portal";
      timeline.push({ type: e.type, atMs, detail });

      if (e.type === "CaseOpened") {
        const paise =
          typeof e.amountPaise === "bigint"
            ? Number(e.amountPaise)
            : typeof e.amountPaise === "number"
              ? e.amountPaise
              : null;
        base = {
          id: e.caseId,
          kind: e.kind,
          summary: e.summary,
          city: e.city,
          state: e.state,
          locality: e.locality ?? null,
          urgency: e.urgency,
          status: "Intake",
          anonymous: e.anonymous === true,
          amountRupees: paise === null ? null : paise / 100,
          openedAtMs: atMs,
        };
      } else if (e.type === "CaseUpdated") {
        updates.push((e.fields as Record<string, unknown>) ?? {});
      } else if (e.type === "EvidenceAttached") {
        evidence.push({
          id: e.evidenceId,
          description: e.description,
          mimeType: e.mimeType,
          fileName: e.fileName ?? null,
          dataUrl: typeof e.dataUrl === "string" ? e.dataUrl : null,
          atMs,
        });
        if (base !== null && base.status === "Intake") base.status = "Evidence";
      } else if (e.type === "DraftPrepared") {
        drafts.push({
          draftId: e.draftId,
          stage: e.stage,
          body: e.body,
          formattedDocument: e.formattedDocument ?? null,
          confidence: e.confidence,
        });
        if (base !== null && (base.status === "Intake" || base.status === "Evidence"))
          base.status = "Drafting";
      } else if (e.type === "DraftApproved") {
        resolved.add(String(e.draftId));
        if (base !== null) base.status = "Filed";
      } else if (e.type === "DraftRejected") {
        resolved.add(String(e.draftId));
      } else if (
        e.type === "CommunityUpvote" ||
        e.type === "UpvoteReceived" ||
        e.type === "CaseUpvoted"
      ) {
        votes += 1;
      }
    }

    if (base === null) {
      return NextResponse.json({ error: "Case has no opening event" }, { status: 500 });
    }
    for (const u of updates) {
      for (const [k, v] of Object.entries(u)) {
        if (v !== undefined) base[k] = v;
      }
    }

    const approvals = events.filter((e) => e.type === "DraftApproved").length;
    const pending = [...drafts].reverse().find((d) => !resolved.has(String(d.draftId))) ?? null;
    const openedAtMs = Number(base.openedAtMs);
    const daysActive = Math.max(1, Math.floor((Date.now() - openedAtMs) / 86_400_000));
    const percent = Math.min(100, evidence.length * 20 + approvals * 30 + (pending === null ? 0 : 10));
    const percentile = Math.min(99, 40 + evidence.length * 7 + approvals * 12 + votes * 3);

    return NextResponse.json({
      ...base,
      votes,
      evidenceCount: evidence.length,
      evidence,
      timeline,
      pendingDraft: pending,
      progress: { percent, evidence: evidence.length, approvals, daysActive, percentile },
    });
  } catch (err) {
    console.error("[case-full]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

