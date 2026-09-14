import { NextResponse } from "next/server";
import { toCaseSummary } from "@ziddi/agent";
import { getRepo } from "@/lib/repo";

export async function GET() {
  try {
    const repo = getRepo();
    const cases = await repo.listCases();
    const nowMs = BigInt(Date.now());
    return NextResponse.json({ cases: cases.map((c) => toCaseSummary(c, nowMs)) });
  } catch (err) {
    console.error("[/api/cases]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
