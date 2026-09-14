import { GoogleGenAI, type Session } from "@google/genai";
import { ZiddiOrchestrator } from "@ziddi/agent";
import { getRepo } from "@/lib/repo";

const LIVE_MODELS = ["gemini-3-flash-live", "gemini-2.5-flash-native-audio-dialog"];

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY not set" }), { status: 500 });
  }

  const ai = new GoogleGenAI({ apiKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (obj: unknown) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
        } catch {
          // controller already closed
        }
      };

      let transcript = "";
      let session: Session | null = null;
      let finished = false;

      const finish = async () => {
        if (finished) return;
        finished = true;
        try {
          await session?.close();
        } catch {
          // ignore close errors
        }
        if (transcript.trim().length >= 10) {
          const orchestrator = new ZiddiOrchestrator(getRepo());
          const analysis = await orchestrator.analyze(transcript, apiKey);
          if (analysis.isErr()) {
            enqueue({ type: "final", transcript, extracted: null });
          } else {
            enqueue({ type: "final", transcript, extracted: analysis.value });
          }
        } else {
          enqueue({ type: "final", transcript, extracted: null });
        }
        try {
          controller.close();
        } catch {
          // ignore
        }
      };

      let connected = false;
      for (const model of LIVE_MODELS) {
        try {
          session = await ai.live.connect({
            model,
            config: {
              responseModalities: ["TEXT" as any],
              inputAudioTranscription: {},
              systemInstruction:
                "You are Ziddi's voice intake listener for Indian civic grievances. Listen silently. Transcription is captured automatically; reply only with a brief Hinglish acknowledgement when the citizen pauses.",
            },
            callbacks: {
              onmessage: (msg) => {
                const text = msg.serverContent?.inputTranscription?.text;
                if (typeof text === "string" && text.length > 0) {
                  transcript += text;
                  enqueue({ type: "partial", text: transcript });
                }
              },
              onclose: () => {
                void finish();
              },
              onerror: (e) => {
                enqueue({ type: "error", message: String(e) });
                void finish();
              },
            },
          });
          connected = true;
          break;
        } catch {
          session = null;
        }
      }

      if (!connected) {
        enqueue({ type: "error", message: "Live session unavailable" });
        await finish();
        return;
      }

      try {
        const reader = request.body?.getReader();
        if (reader === undefined) {
          await finish();
          return;
        }
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value !== undefined && value.length > 0 && session !== null) {
            const base64 = Buffer.from(value).toString("base64");
            await session.sendRealtimeInput({
              media: { data: base64, mimeType: "audio/pcm;rate=16000" },
            });
          }
        }
        await finish();
      } catch (e) {
        enqueue({ type: "error", message: String(e) });
        await finish();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson" },
  });
}
