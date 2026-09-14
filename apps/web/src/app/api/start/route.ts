import { NextResponse } from "next/server";
import { ZiddiOrchestrator, CaseRepository, InMemoryEventStore } from "@ziddi/agent";

// NOTE: In-memory store resets on server restart. Fine for hackathon demo.
// Production would swap for SQLite/Postgres via repository interface.
const globalStore = new InMemoryEventStore();
const globalRepo = new CaseRepository(globalStore);

// @ts-expect-error attaching to globalThis for persistence across hot-reloads
globalThis.__ziddiStore ??= globalStore;
// @ts-expect-error
globalThis.__ziddiRepo ??= globalRepo;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not set in .env.local" },
        { status: 500 },
      );
    }

    const body = await request.json();
    const rawCitizenText = body.rawCitizenText;
    if (typeof rawCitizenText !== "string" || rawCitizenText.length < 10) {
      return NextResponse.json(
        { error: "Please describe your grievance in at least 10 characters" },
        { status: 400 },
      );
    }

    // @ts-expect-error globalThis access
    const repo: CaseRepository = globalThis.__ziddiRepo;
    const orchestrator = new ZiddiOrchestrator(repo);

    const result = await orchestrator.startCase({ rawCitizenText, apiKey });
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
    return NextResponse.json({ caseId: result.value });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

