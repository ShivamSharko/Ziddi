import { NextResponse } from "next/server";
import { ulid } from "ulid";
import { getRepo } from "@/lib/repo";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await request.json()) as Record<string, unknown>;
  const fields: Record<string, unknown> = {};
  if (typeof body.summary === "string" && body.summary.trim().length >= 10)
    fields.summary = body.summary.trim();
  if (typeof body.locality === "string")
    fields.locality = body.locality.trim().length > 0 ? body.locality.trim() : null;
  if (typeof body.city === "string" && body.city.trim().length > 0) fields.city = body.city.trim();
  if (typeof body.state === "string" && body.state.trim().length > 0)
    fields.state = body.state.trim();
  if (typeof body.urgency === "string" && body.urgency.length > 0) fields.urgency = body.urgency;
  if (typeof body.amountRupees === "number" && body.amountRupees >= 0)
    fields.amountRupees = body.amountRupees;

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    const repo = getRepo();
    await repo.saveEvent(id, {
      id: ulid(),
      caseId: id,
      type: "CaseUpdated",
      fields,
      reason: typeof body.reason === "string" ? body.reason : "Citizen edited case details",
      at: BigInt(Date.now()),
      actor: { type: "Citizen", id: "user_1" },
    } as never);
    return NextResponse.json({ ok: true, fields });
  } catch (err) {
    console.error("[case-update]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

