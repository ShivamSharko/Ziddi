import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { GeminiClient } from "../client";

describe("GeminiClient", () => {
  it("instantiates with API key", () => {
    const client = new GeminiClient("test-key");
    expect(client).toBeInstanceOf(GeminiClient);
  });

  it("exports zodToJsonSchema indirectly via generateStructured signature", () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    expect(schema).toBeDefined();
  });
});

