import { NextResponse } from "next/server";
import { getRepo } from "@/lib/repo";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const repo = getRepo();
    const events = await repo.loadEvents(id);

    const approvedOrRejected = new Set<string>();
    for (const e of events) {
      if (e.type === "DraftApproved" || e.type === "DraftRejected") {
        approvedOrRejected.add((e as { draftId: string }).draftId);
      }
    }

    let pending: {
      draftId: string;
      stage: string;
      body: string;
      confidence: number;
    } | null = null;
    for (const e of events) {
      if (e.type === "DraftPrepared") {
        const d = e as { draftId: string; stage: string; body: string; confidence: number };
        if (!approvedOrRejected.has(d.draftId)) {
          pending = { draftId: d.draftId, stage: d.stage, body: d.body, confidence: d.confidence };
        }
      }
    }

    return NextResponse.json({ draft: pending });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

