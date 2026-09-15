import { NextResponse } from "next/server";
import { ulid } from "ulid";
import { getRepo } from "@/lib/repo";
import { caseUpdatedEventSchema } from "@ziddi/domain";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await request.json()) as Record<string, unknown>;
  const fields: Record<string, unknown> = {};
  if (typeof body.summary === "string") {
    const s = body.summary.trim();
    if (s.length === 0) {
      return NextResponse.json({ error: "Summary cannot be empty" }, { status: 400 });
    }
    if (s.length < 10) {
      return NextResponse.json(
        { error: "Summary must be at least 10 characters so the case stays citable" },
        { status: 400 },
      );
    }
    fields.summary = s;
  }
  if (typeof body.locality === "string")
    fields.locality = body.locality.trim().length > 0 ? body.locality.trim() : null;
  if (typeof body.city === "string" && body.city.trim().length > 0) fields.city = body.city.trim();
  if (typeof body.state === "string" && body.state.trim().length > 0)
    fields.state = body.state.trim();
  if (typeof body.urgency === "string" && body.urgency.length > 0) fields.urgency = body.urgency;
  if (body.amountRupees === null) {
    fields.amountRupees = null;
  } else if (typeof body.amountRupees === "number" && body.amountRupees >= 0) {
    fields.amountRupees = body.amountRupees;
  }

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    const payload = {
      id: ulid(),
      caseId: id,
      type: "CaseUpdated",
      fields,
      reason: typeof body.reason === "string" ? body.reason : "Citizen edited case details",
      at: BigInt(Date.now()),
      actor: { type: "Citizen", id: "user_1" },
    };
    const parsed = caseUpdatedEventSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: `Invalid update payload: ${parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join(", ")}`,
        },
        { status: 400 },
      );
    }
    const repo = getRepo();
    await repo.saveEvent(id, parsed.data);
    return NextResponse.json({ ok: true, fields });
  } catch (err) {
    console.error("[case-update]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

