import { NextResponse } from "next/server";
import { ZiddiOrchestrator } from "@ziddi/agent";
import { citizenToken } from "@/lib/aadhaar";
import { getOtpService } from "@/lib/otp";
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
            "Aadhaar verification required (12-digit, checksum-validated). The number is NEVER stored - only a one-way hash.",
        },
        { status: 400 },
      );
    }
    if (!getOtpService().isVerified(token)) {
      return NextResponse.json(
        { error: "Complete Aadhaar OTP verification first" },
        { status: 401 },
      );
    }

    const forceNew = body.forceNew === true;
    const locality =
      typeof body.locality === "string" && body.locality.trim().length > 0
        ? body.locality.trim()
        : undefined;

    const orchestrator = new ZiddiOrchestrator(getRepo());

    const analysis = await orchestrator.analyze(rawCitizenText, apiKey);
    if (analysis.isErr()) {
      return NextResponse.json({ error: errorMessage(analysis.error) }, { status: 500 });
    }
    const extracted = analysis.value;

    if (!forceNew) {
      const duplicates = await orchestrator.findDuplicates(extracted.kind, extracted.city, locality);
      if (duplicates.length > 0) {
        return NextResponse.json(
          {
            duplicates: duplicates.map((d) => ({
              id: d.id,
              summary: d.summary,
              votes: d.votes,
              locality: d.locality,
              city: d.city,
            })),
          },
          { status: 409 },
        );
      }
    }

    const result = await orchestrator.startCase({
      rawCitizenText,
      apiKey,
      anonymous: body.anonymous === true,
      citizenToken: token,
      locality,
      extraction: extracted,
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
