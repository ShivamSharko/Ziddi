import { NextResponse } from "next/server";
import { ZiddiOrchestrator, type EvidenceItemInput } from "@ziddi/agent";
import { errorMessage, getRepo } from "@/lib/repo";

const MAX_DATA_URL = 4_000_000;

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const repo = getRepo();
  const exists = await repo.getCase(id);
  if (exists.isErr()) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const body = await request.json();

  const rawItems: unknown = body.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 6) {
    return NextResponse.json(
      { error: "Provide between 1 and 6 evidence items" },
      { status: 400 },
    );
  }

  const items: EvidenceItemInput[] = [];
  for (const raw of rawItems) {
    const item = raw as Record<string, unknown>;
    const description = item.description;
    if (typeof description !== "string" || description.trim().length < 3) {
      return NextResponse.json(
        { error: "Every evidence item needs a description (3+ chars)" },
        { status: 400 },
      );
    }
    const dataUrl = typeof item.dataUrl === "string" ? item.dataUrl : undefined;
    if (dataUrl !== undefined) {
      if (!dataUrl.startsWith("data:")) {
        return NextResponse.json({ error: "Invalid file data" }, { status: 400 });
      }
      if (dataUrl.length > MAX_DATA_URL) {
        return NextResponse.json(
          { error: "A file is too large for demo storage (max ~3MB each)" },
          { status: 413 },
        );
      }
    }
    items.push({
      description: description.trim(),
      mimeType: typeof item.mimeType === "string" ? item.mimeType : "image/jpeg",
      ...(dataUrl !== undefined ? { dataUrl } : {}),
      ...(typeof item.fileName === "string" ? { fileName: item.fileName } : {}),
    });
  }

  const orchestrator = new ZiddiOrchestrator(getRepo());
  const result = await orchestrator.attachEvidenceBatch(id, items);
  if (result.isErr()) {
    return NextResponse.json({ error: errorMessage(result.error) }, { status: 500 });
  }
  return NextResponse.json({ ok: true, added: items.length });
}

