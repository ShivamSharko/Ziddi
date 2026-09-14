import { NextResponse } from "next/server";
import { ZiddiOrchestrator, CaseRepository, InMemoryEventStore } from "@ziddi/agent";
import type { DomainError } from "@ziddi/domain";

function errorMessage(error: DomainError): string {
  switch (error.kind) {
    case "ValidationFailed":
      return error.message;
    case "InvalidTransition":
      return `Cannot transition: ${error.reason}`;
    case "InvariantBroken":
      return error.message;
    case "NotFound":
      return `${error.entity} not found`;
  }
}

// @ts-expect-error globalThis access
globalThis.__ziddiStore ??= new InMemoryEventStore();
// @ts-expect-error globalThis access
globalThis.__ziddiRepo ??= new CaseRepository(globalThis.__ziddiStore);

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
