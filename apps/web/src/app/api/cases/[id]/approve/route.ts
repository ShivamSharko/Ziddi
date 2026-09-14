import { NextResponse } from "next/server";
import { ZiddiOrchestrator } from "@ziddi/agent";
import { errorMessage, getRepo } from "@/lib/repo";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await request.json();
  const approved = body.approved === true;
  const reason = typeof body.reason === "string" ? body.reason : undefined;

  const orchestrator = new ZiddiOrchestrator(getRepo());
  const result = approved
    ? await orchestrator.approveDraft(id)
    : await orchestrator.rejectDraft(id, reason);
  if (result.isErr()) {
    return NextResponse.json({ error: errorMessage(result.error) }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

