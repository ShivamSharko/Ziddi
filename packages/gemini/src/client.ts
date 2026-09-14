/**
 * Typed Gemini client. Structured outputs enforced via Zod.
 * Model registry with automatic fallback: Google renames model ids often,
 * so a 404 NOT_FOUND on one id retries the next known-good id.
 * Sept 2026 pricing: 3.5 Flash ~$0.50/$3.00 per 1M in/out; 3.1 Pro ~$2/$12.
 * NOTE: Gemini 3 Pro ids require the Interactions API on v1beta; generateContent
 * serves the Flash family. Drafts therefore run on Flash with Pro as best-effort.
 */
import { GoogleGenAI } from "@google/genai";
import { ok, err, Result } from "@ziddi/domain";
import type { DomainError } from "@ziddi/domain";
import { z, type ZodSchema } from "zod";

export type GeminiModel = "gemini-3.5-flash" | "gemini-3.6-flash" | "gemini-3.1-pro";

const MODEL_FALLBACKS: Record<GeminiModel, ReadonlyArray<string>> = {
  "gemini-3.5-flash": ["gemini-3.6-flash", "gemini-3.8-flash", "gemini-3.7-flash"],
  "gemini-3.6-flash": ["gemini-3.7-flash", "gemini-3.8-flash", "gemini-3.5-flash"],
  "gemini-3.1-pro": ["gemini-3.1-pro-preview", "gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.8-flash"],
};

export interface CallOptions {
  readonly model: GeminiModel;
  readonly systemInstruction?: string;
  readonly temperature?: number;
  readonly maxRetries?: number;
}

const DEFAULT_RETRIES = 2;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const isNotFound = (error: unknown): boolean => {
  const e = error as { status?: number; code?: number; message?: string };
  return (
    e?.status === 404 ||
    e?.code === 404 ||
    String(e?.message ?? "").includes("NOT_FOUND")
  );
};

const isUnavailable = (error: unknown): boolean => {
  const e = error as { status?: number; code?: number; message?: string };
  return (
    e?.status === 503 ||
    e?.code === 503 ||
    String(e?.message ?? "").includes("UNAVAILABLE") ||
    String(e?.message ?? "").toLowerCase().includes("high demand")
  );
};

export class GeminiClient {
  private readonly ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateStructured<T extends ZodSchema>(
    prompt: string,
    schema: T,
    options: CallOptions,
  ): Promise<Result<z.infer<T>, DomainError>> {
    const candidates = [options.model, ...MODEL_FALLBACKS[options.model]];
    const maxRetries = options.maxRetries ?? DEFAULT_RETRIES;
    let lastError: unknown = null;

    for (const model of candidates) {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await this.ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              ...(options.systemInstruction !== undefined && {
                systemInstruction: options.systemInstruction,
              }),
              ...(options.temperature !== undefined && { temperature: options.temperature }),
              responseMimeType: "application/json",
              responseSchema: zodToJsonSchema(schema),
            },
          });

          const raw = response.text;
          if (raw === undefined || raw.length === 0) {
            lastError = new Error("Empty response");
            continue;
          }

          const parsed: unknown = JSON.parse(raw);
          const validated = schema.safeParse(parsed);
          if (!validated.success) {
            lastError = validated.error;
            continue;
          }
          return ok(validated.data);
        } catch (error) {
          lastError = error;
          if (isNotFound(error)) break;
          if (isUnavailable(error) && attempt < Math.max(maxRetries, 4)) {
            await sleep(Math.pow(2, attempt) * 1000);
            continue;
          }
          if (attempt < maxRetries) await sleep(Math.pow(2, attempt) * 250);
        }
      }
    }

    return err({
      kind: "ValidationFailed",
      message: `Gemini call failed across models [${candidates.join(", ")}]: ${String(lastError)}`,
    });
  }

  async generateText(prompt: string, options: CallOptions): Promise<Result<string, DomainError>> {
    const candidates = [options.model, ...MODEL_FALLBACKS[options.model]];
    const maxRetries = options.maxRetries ?? DEFAULT_RETRIES;
    let lastError: unknown = null;

    for (const model of candidates) {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await this.ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              ...(options.systemInstruction !== undefined && {
                systemInstruction: options.systemInstruction,
              }),
              ...(options.temperature !== undefined && { temperature: options.temperature }),
            },
          });
          const text = response.text;
          if (text === undefined) {
            lastError = new Error("Empty response");
            continue;
          }
          return ok(text);
        } catch (error) {
          lastError = error;
          if (isNotFound(error)) break;
          if (isUnavailable(error) && attempt < Math.max(maxRetries, 4)) {
            await sleep(Math.pow(2, attempt) * 1000);
            continue;
          }
          if (attempt < maxRetries) await sleep(Math.pow(2, attempt) * 250);
        }
      }
    }

    return err({
      kind: "ValidationFailed",
      message: `Gemini text call failed across models [${candidates.join(", ")}]: ${String(lastError)}`,
    });
  }
}

/**
 * Convert Zod schema to Gemini JSON schema format.
 * Simplified converter sufficient for our use cases.
 */
function zodToJsonSchema(schema: ZodSchema): unknown {
  return toJsonSchemaRecurse(schema._def);
}

function toJsonSchemaRecurse(def: any): any {
  const typeName = def.typeName;

  switch (typeName) {
    case "ZodString":
      return { type: "string" };
    case "ZodNumber":
      return { type: "number" };
    case "ZodBigInt":
      return { type: "integer" };
    case "ZodBoolean":
      return { type: "boolean" };
    case "ZodLiteral":
      return { type: typeof def.value, enum: [def.value] };
    case "ZodEnum":
      return { type: "string", enum: def.values };
    case "ZodArray":
      return { type: "array", items: toJsonSchemaRecurse(def.type._def) };
    case "ZodOptional":
    case "ZodNullable":
      return toJsonSchemaRecurse(def.innerType._def);
    case "ZodObject": {
      const properties: Record<string, any> = {};
      const required: string[] = [];
      for (const [key, shape] of Object.entries(def.shape())) {
        properties[key] = toJsonSchemaRecurse((shape as any)._def);
        const isOptional = (shape as any).isOptional?.() ?? false;
        if (!isOptional) required.push(key);
      }
      return { type: "object", properties, ...(required.length > 0 ? { required } : {}) };
    }
    case "ZodDiscriminatedUnion": {
      return {
        oneOf: def.options.map((opt: any) => toJsonSchemaRecurse(opt._def)),
      };
    }
    case "ZodUnion": {
      return { oneOf: def.options.map((opt: any) => toJsonSchemaRecurse(opt._def)) };
    }
    default:
      return { type: "string" };
  }
}
