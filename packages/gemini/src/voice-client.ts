/**
 * Voice intake client using Gemini 2.0 Flash for audio processing.
 * Processes base64-encoded audio, returns transcription + structured extraction.
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

export class VoiceClient {
  private readonly ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async processAudio(base64Audio: string): Promise<Result<VoiceIntakeResult, DomainError>> {
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
              text: `Transcribe this Hinglish audio and extract structured grievance data.
              
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
}`,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
        },
      });

      const raw = response.text ?? "{}";
      const parsed = JSON.parse(raw);

      return ok({
        transcript: parsed.transcript ?? "",
        extracted: parsed,
      });
    } catch (error) {
      return err({
        kind: "ValidationFailed",
        message: `Voice processing failed: ${String(error)}`,
      });
    }
  }
}
