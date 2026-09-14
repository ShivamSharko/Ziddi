import { NextResponse } from "next/server";
import { CaseRepository, InMemoryEventStore } from "@ziddi/agent";

// @ts-expect-error
const getRepo = (): CaseRepository => {
  // @ts-expect-error
  if (!globalThis.__ziddiRepo) {
    // @ts-expect-error
    globalThis.__ziddiStore = new InMemoryEventStore();
    // @ts-expect-error
    globalThis.__ziddiRepo = new CaseRepository(globalThis.__ziddiStore);
  }
  // @ts-expect-error
  return globalThis.__ziddiRepo;
};

export async function GET() {
  try {
    const repo = getRepo();
    const cases = await repo.listCases();
    return NextResponse.json({ cases });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

