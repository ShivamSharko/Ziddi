import { NextResponse } from "next/server";
import { ZiddiOrchestrator } from "@ziddi/agent";
import { checkAndEscalate } from "@ziddi/agent";
import { getRepo } from "@/lib/repo";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not set in .env.local" },
        { status: 500 },
      );
    }

    const orchestrator = new ZiddiOrchestrator(getRepo());
    const results = await checkAndEscalate(getRepo(), orchestrator, apiKey);

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

