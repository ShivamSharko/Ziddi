import { NextResponse } from "next/server";
import { toCaseDetail } from "@ziddi/agent";
import { getRepo } from "@/lib/repo";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const result = await getRepo().getCase(id);
  if (result.isErr()) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }
  return NextResponse.json({ case: toCaseDetail(result.value, BigInt(Date.now())) });
}

