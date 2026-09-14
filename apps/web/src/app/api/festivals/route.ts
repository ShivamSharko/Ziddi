import { NextResponse } from "next/server";
import { activeTriggers } from "@ziddi/domain";

export async function GET() {
  return NextResponse.json({ triggers: activeTriggers(BigInt(Date.now())) });
}

