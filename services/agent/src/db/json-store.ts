/**
 * Persistent event store backed by a JSON file.
 * Reads the file on first access, writes after every append.
 * Simple, reliable, zero native deps. Tests use InMemoryEventStore instead.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { DomainEvent } from "@ziddi/domain";
import type { EventStore } from "../repository";

interface JsonStoreShape {
  events: Array<{ caseId: string; event: DomainEvent }>;
}

const replacer = (_key: string, value: any) =>
  typeof value === "bigint" ? { $bigint: value.toString() } : value;

const reviver = (_key: string, value: any) =>
  value && typeof value === "object" && typeof value.$bigint === "string"
    ? BigInt(value.$bigint)
    : value;

export class JsonFileEventStore implements EventStore {
  private readonly path: string;
  private data: JsonStoreShape | null = null;

  constructor(path: string) {
    this.path = path;
  }

  private ensureLoaded(): JsonStoreShape {
    if (this.data !== null) return this.data;
    mkdirSync(dirname(this.path), { recursive: true });
    if (existsSync(this.path)) {
      try {
        const raw = readFileSync(this.path, "utf-8");
        const parsed = JSON.parse(raw, reviver) as Partial<JsonStoreShape>;
        this.data = { events: parsed.events ?? [] };
      } catch {
        this.data = { events: [] };
      }
    } else {
      this.data = { events: [] };
    }
    return this.data;
  }

  private persist(): void {
    if (this.data === null) return;
    writeFileSync(this.path, JSON.stringify(this.data, replacer), "utf-8");
  }

  async append(caseId: string, event: DomainEvent): Promise<void> {
    const store = this.ensureLoaded();
    store.events.push({ caseId, event });
    this.persist();
  }

  async load(caseId: string): Promise<ReadonlyArray<DomainEvent>> {
    const store = this.ensureLoaded();
    return store.events.filter((e) => e.caseId === caseId).map((e) => e.event);
  }

  async listCaseIds(): Promise<ReadonlyArray<string>> {
    const store = this.ensureLoaded();
    return Array.from(new Set(store.events.map((e) => e.caseId)));
  }
}

