import { NextResponse } from "next/server";
import { VoiceClient } from "@ziddi/gemini";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not set" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const audioBlob = formData.get("audio") as Blob;
    
    if (!audioBlob) {
      return NextResponse.json(
        { error: "No audio provided" },
        { status: 400 },
      );
    }

    const base64Audio = await blobToBase64(audioBlob);
    const client = new VoiceClient(apiKey);
    
    const result = await client.processAudio(base64Audio);
    
    if (result.isErr()) {
      return NextResponse.json(
        { error: JSON.stringify(result.error) },
        { status: 500 },
      );
    }

    return NextResponse.json(result.value);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}
