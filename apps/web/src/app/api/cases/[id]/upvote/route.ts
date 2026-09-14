import { NextResponse } from "next/server";
import { ZiddiOrchestrator } from "@ziddi/agent";
import { citizenToken } from "@/lib/aadhaar";
import { errorMessage, getRepo } from "@/lib/repo";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await request.json();
  const token = typeof body.aadhaar === "string" ? citizenToken(body.aadhaar) : null;
  if (token === null) {
    return NextResponse.json(
      {
        error:
          "Valid 12-digit Aadhaar required to support a case (number is never stored - only a one-way hash)",
      },
      { status: 400 },
    );
  }

  const orchestrator = new ZiddiOrchestrator(getRepo());
  const result = await orchestrator.upvoteCase(id, token);
  if (result.isErr()) {
    return NextResponse.json({ error: errorMessage(result.error) }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}

