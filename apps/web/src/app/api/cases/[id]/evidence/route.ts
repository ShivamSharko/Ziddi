import { NextResponse } from "next/server";
import { ZiddiOrchestrator } from "@ziddi/agent";
import { errorMessage, getRepo } from "@/lib/repo";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await request.json();
  const description = body.description;
  const mimeType = typeof body.mimeType === "string" ? body.mimeType : "image/jpeg";
  if (typeof description !== "string" || description.trim().length < 3) {
    return NextResponse.json({ error: "Evidence description too short" }, { status: 400 });
  }

  const orchestrator = new ZiddiOrchestrator(getRepo());
  const result = await orchestrator.attachEvidence(id, description.trim(), mimeType);
  if (result.isErr()) {
    return NextResponse.json({ error: errorMessage(result.error) }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

