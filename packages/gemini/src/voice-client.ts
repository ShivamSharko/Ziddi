/**
 * Voice intake client: processes base64-encoded audio into transcript + structured case.
 * Uses a fallback chain of audio-capable Flash models (gemini-2.0-flash-exp was retired).
 */
import { GoogleGenAI } from "@google/genai";
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

const VOICE_MODELS = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite"];

const VOICE_INSTRUCTION = `Transcribe this Hinglish audio and extract structured grievance data.

Return JSON with these exact fields:
- transcript: the spoken words in original language
- kind: one of [CivicPothole, CivicGarbage, CivicWater, LandlordDeposit, ConsumerRefund, RtiFiling, RtiAppeal, AadhaarUpdate, ElectricityBill, TelecomRefund]
- summary: concise description of the problem (10-100 chars)
- city: city name
- state: Indian state name
- urgency: one of [Emergency, High, Standard, Low]
- amountRupees: numeric amount if mentioned, omit if not
- isGenuineGrievance: true if this is a real civic/consumer issue, false for abuse/jokes/test

Example output:
{
  "transcript": "Mera landlord ne 60000 deposit wapas nahi diya",
  "kind": "LandlordDeposit",
  "summary": "Landlord not returning 60000 deposit",
  "city": "Bengaluru",
  "state": "Karnataka",
  "urgency": "High",
  "amountRupees": 60000,
  "isGenuineGrievance": true
}`;

export class VoiceClient {
  private readonly ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async processAudio(base64Audio: string): Promise<Result<VoiceIntakeResult, DomainError>> {
    let lastError: unknown = null;

    for (const model of VOICE_MODELS) {
      try {
        const response = await this.ai.models.generateContent({
          model,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: "audio/webm",
                  data: base64Audio,
                },
              },
              { text: VOICE_INSTRUCTION },
            ],
          },
          config: {
            responseMimeType: "application/json",
          },
        });

        const raw = response.text ?? "{}";
        const parsed = JSON.parse(raw) as Record<string, unknown>;

        return ok({
          transcript: typeof parsed.transcript === "string" ? parsed.transcript : "",
          extracted: parsed as VoiceIntakeResult["extracted"],
        });
      } catch (error) {
        lastError = error;
      }
    }

    return err({
      kind: "ValidationFailed",
      message: `Voice processing failed on all models: ${String(lastError)}`,
    });
  }
}
