/**
 * Voice intake client using Gemini Live API.
 * Streams audio, returns real-time transcription + structured extraction.
 */
import { GoogleGenAI, type LiveServerMessage } from "@google/genai";
import { ok, err, Result } from "@ziddi/domain";
import type { DomainError } from "@ziddi/domain";

export interface VoiceIntakeResult {
  readonly transcript: string;
  readonly extracted: {
    kind: string;
    summary: string;
    city: string;
    state: string;
    urgency: string;
    amountRupees?: number;
    isGenuineGrievance: boolean;
  } | null;
}

export class VoiceClient {
  private readonly ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async startSession(
    onTranscript: (text: string) => void,
    onExtraction: (data: VoiceIntakeResult) => void,
  ): Promise<Result<{ stop: () => void }, DomainError>> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event: any) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const base64Audio = await blobToBase64(audioBlob);
        
        try {
          const response = await this.ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: "audio/webm",
                    data: base64Audio,
                  },
                },
                {
                  text: "Transcribe this Hinglish audio and extract structured grievance data. Return JSON with: transcript (the spoken words), kind (CivicPothole|LandlordDeposit|ConsumerRefund|RtiFiling|etc), summary, city, state, urgency, amountRupees (if mentioned), isGenuineGrievance (boolean).",
                },
              ],
            },
            config: {
              responseMimeType: "application/json",
            },
          });

          const raw = response.text ?? "{}";
          const parsed = JSON.parse(raw);
          
          onTranscript(parsed.transcript ?? "");
          onExtraction({
            transcript: parsed.transcript ?? "",
            extracted: parsed,
          });
        } catch (error) {
          console.error("Voice extraction failed:", error);
          onTranscript("(Voice extraction failed, please type manually)");
        }

        stream.getTracks().forEach((track: any) => track.stop());
      };

      mediaRecorder.start();

      return ok({
        stop: () => {
          if (mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
          }
        },
      });
    } catch (error) {
      return err({
        kind: "ValidationFailed",
        message: `Microphone access denied: ${String(error)}`,
      });
    }
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64 ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
