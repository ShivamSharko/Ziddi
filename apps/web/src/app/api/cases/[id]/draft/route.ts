import { NextResponse } from "next/server";
import { ZiddiOrchestrator, type DraftStage } from "@ziddi/agent";
import { errorMessage, getRepo } from "@/lib/repo";

const ALLOWED_STAGES: ReadonlyArray<string> = [
  "DemandNotice",
  "FirstAppeal",
  "SecondAppeal",
  "RtiApplication",
  "ConsumerComplaint",
  "SocialPack",
];

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  const body = await request.json();
  const stage: unknown = body.stage;
  if (typeof stage !== "string" || !ALLOWED_STAGES.includes(stage)) {
    return NextResponse.json({ error: "Invalid draft stage" }, { status: 400 });
  }

  try {
    const orchestrator = new ZiddiOrchestrator(getRepo());
    const result = await orchestrator.requestDraft(id, stage as DraftStage, apiKey);
    if (result.isErr()) {
      return NextResponse.json({ error: errorMessage(result.error) }, { status: 500 });
    }
    console.log("[draft] prepared", result.value.draftId);
    return NextResponse.json({
      ok: true,
      draftId: result.value.draftId,
      stage: result.value.stage,
      body: result.value.body,
      formattedDocument: result.value.formattedDocument,
      confidence: result.value.confidence,
    });
  } catch (err) {
    console.error("Draft generation failed:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

