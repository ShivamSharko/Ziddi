/**
 * Eval runner. Loads fixtures and validates prompt outputs match expectations.
 * No prompt edit should ship without these passing.
 * Failed fixtures are retried once after a 30s capacity-burst cool-down.
 * Run with: pnpm evals
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GeminiClient, IntakeExtract } from "../packages/gemini/src/index.ts";
import type { DomainError } from "../packages/domain/src/index.ts";

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
    isGenuineGrievance: boolean;
  }>;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const formatDomainError = (error: DomainError): string => {
  switch (error.kind) {
    case "ValidationFailed":
      return error.message;
    case "InvalidTransition":
      return error.reason;
    case "InvariantBroken":
      return error.message;
    case "NotFound":
      return `${error.entity} not found: ${error.id}`;
  }
};

const runFixture = async (client: GeminiClient, fixture: Fixture): Promise<boolean> => {
  const result = await IntakeExtract.intakeExtract(client, fixture.input);
  if (result.isErr()) {
    console.error(`❌ FAIL: ${fixture.input.slice(0, 40)}...`);
    console.error(`   Error: ${formatDomainError(result.error)}`);
    return false;
  }

  const actual = result.value;
  const CITY_SYNONYMS: Record<string, ReadonlyArray<string>> = {
    Bengaluru: ["Bengaluru", "Bangalore"],
    Mumbai: ["Mumbai", "Bombay"],
    Chennai: ["Chennai", "Madras"],
    Kolkata: ["Kolkata", "Calcutta"],
  };

  const matches = Object.entries(fixture.expected).every(([key, expectedValue]) => {
    if (key === "confidence") {
      return actual.confidence >= (expectedValue as number);
    }
    if (key === "city") {
      const synonyms = CITY_SYNONYMS[expectedValue as string];
      if (synonyms !== undefined) {
        return synonyms.includes(actual.city);
      }
    }
    return actual[key as keyof typeof actual] === expectedValue;
  });

  if (matches) {
    console.log(`✅ PASS: ${fixture.input.slice(0, 40)}...`);
    return true;
  }
  console.error(`❌ FAIL: ${fixture.input.slice(0, 40)}...`);
  console.error(`   Expected:`, fixture.expected);
  console.error(`   Actual:`, actual);
  return false;
};

const run = async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY not set. Set it with: set GEMINI_API_KEY=your_key");
    process.exit(1);
  }

  const fixturesPath = join(process.cwd(), "evals/fixtures/intake-extract.json");
  const fixtures: Fixture[] = JSON.parse(readFileSync(fixturesPath, "utf-8"));

  const client = new GeminiClient(apiKey);
  let failures: Fixture[] = [];

  for (const fixture of fixtures) {
    await sleep(2000);
    const passed = await runFixture(client, fixture);
    if (!passed) failures.push(fixture);
  }

  if (failures.length > 0) {
    console.log(
      `\n⏳ ${failures.length} failure(s). Waiting 30s (capacity-burst cool-down), then one retry...`,
    );
    await sleep(30_000);
    const stillFailing: Fixture[] = [];
    for (const fixture of failures) {
      const passed = await runFixture(client, fixture);
      if (!passed) stillFailing.push(fixture);
    }
    failures = stillFailing;
  }

  const passed = fixtures.length - failures.length;
  console.log(`\n${passed} passed, ${failures.length} failed`);
  process.exit(failures.length > 0 ? 1 : 0);
};

void run();
