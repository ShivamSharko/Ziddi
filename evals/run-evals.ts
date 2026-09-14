/**
 * Eval runner. Loads fixtures and validates prompt outputs match expectations.
 * No prompt edit should ship without these passing.
 * Run with: npx tsx evals/run-evals.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GeminiClient, IntakeExtract } from "../packages/gemini/src/index";

interface Fixture {
  input: string;
  expected: Partial<{
    kind: string;
    city: string;
    state: string;
    urgency: string;
    amountRupees: number;
    detectedLanguage: string;
    confidence: number;
  }>;
}

const run = async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY not set. Set it with: export GEMINI_API_KEY=your_key");
    process.exit(1);
  }

  const fixturesPath = join(process.cwd(), "evals/fixtures/intake-extract.json");
  const fixtures: Fixture[] = JSON.parse(readFileSync(fixturesPath, "utf-8"));

  const client = new GeminiClient(apiKey);
  let passed = 0;
  let failed = 0;

  for (const fixture of fixtures) {
    const result = await IntakeExtract.intakeExtract(client, fixture.input);
    if (result.isErr()) {
      console.error(`❌ FAIL: ${fixture.input.slice(0, 40)}...`);
      console.error(`   Error: ${result.error.message}`);
      failed++;
      continue;
    }

    const actual = result.value;
    const matches = Object.entries(fixture.expected).every(([key, expectedValue]) => {
      if (key === "confidence") {
        return actual.confidence >= (expectedValue as number);
      }
      return actual[key as keyof typeof actual] === expectedValue;
    });

    if (matches) {
      console.log(`✅ PASS: ${fixture.input.slice(0, 40)}...`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${fixture.input.slice(0, 40)}...`);
      console.error(`   Expected:`, fixture.expected);
      console.error(`   Actual:`, actual);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
};

void run();

