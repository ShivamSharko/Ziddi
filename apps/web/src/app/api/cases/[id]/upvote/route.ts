import { NextResponse } from "next/server";
import { ZiddiOrchestrator } from "@ziddi/agent";
import { citizenToken } from "@/lib/aadhaar";
import { getOtpService } from "@/lib/otp";
import { errorMessage, getRepo } from "@/lib/repo";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await request.json();
  const token = typeof body.aadhaar === "string" ? citizenToken(body.aadhaar) : null;
  if (token === null) {
    return NextResponse.json({ error: "Valid 12-digit Aadhaar required" }, { status: 400 });
  }
  if (!getOtpService().isVerified(token)) {
    return NextResponse.json(
      { error: "Complete Aadhaar OTP verification before supporting a case" },
      { status: 401 },
    );
  }

  const orchestrator = new ZiddiOrchestrator(getRepo());
  const result = await orchestrator.upvoteCase(id, token);
  if (result.isErr()) {
    return NextResponse.json({ error: errorMessage(result.error) }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
