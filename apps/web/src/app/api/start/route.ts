import { NextResponse } from "next/server";
import { ZiddiOrchestrator } from "@ziddi/agent";
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

    const orchestrator = new ZiddiOrchestrator(getRepo());
    const result = await orchestrator.startCase({ rawCitizenText, apiKey });
    if (result.isErr()) {
      return NextResponse.json({ error: errorMessage(result.error) }, { status: 500 });
    }
    return NextResponse.json({ caseId: result.value });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
