import { NextResponse } from "next/server";
import { ZiddiOrchestrator } from "@ziddi/agent";
import { citizenToken } from "@/lib/aadhaar";
import { errorMessage, getRepo } from "@/lib/repo";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not set in .env.local" }, { status: 500 });
    }

    const body = await request.json();
    const rawCitizenText = body.rawCitizenText;
    if (typeof rawCitizenText !== "string" || rawCitizenText.length < 10) {
      return NextResponse.json(
        { error: "Please describe your grievance in at least 10 characters" },
        { status: 400 },
      );
    }

    const token = typeof body.aadhaar === "string" ? citizenToken(body.aadhaar) : null;
    if (token === null) {
      return NextResponse.json(
        {
          error:
            "Aadhaar verification required (12-digit, checksum-validated). The number is NEVER stored - only a one-way hash (UIDAI-compliant).",
        },
        { status: 400 },
      );
    }

    const orchestrator = new ZiddiOrchestrator(getRepo());
    const result = await orchestrator.startCase({
      rawCitizenText,
      apiKey,
      anonymous: body.anonymous === true,
      citizenToken: token,
    });
    if (result.isErr()) {
      const status = result.error.kind === "ValidationFailed" ? 400 : 500;
      return NextResponse.json({ error: errorMessage(result.error) }, { status });
    }
    return NextResponse.json({ caseId: result.value });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
