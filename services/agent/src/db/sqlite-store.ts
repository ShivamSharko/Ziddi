import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import type { DomainEvent } from "@ziddi/domain";
import type { EventStore } from "../repository";
import { events } from "./schema";

const replacer = (_key: string, value: any) =>
  typeof value === "bigint" ? { $bigint: value.toString() } : value;

const reviver = (_key: string, value: any) =>
  value && typeof value === "object" && typeof value.$bigint === "string"
    ? BigInt(value.$bigint)
    : value;

export class SqliteEventStore implements EventStore {
  private db: Database.Database;
  private orm: ReturnType<typeof drizzle>;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.orm = drizzle(this.db);
    this.migrate();
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        at INTEGER NOT NULL
      )
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_events_case_id ON events(case_id)
    `);
  }

  async append(caseId: string, event: DomainEvent): Promise<void> {
    await this.orm.insert(events).values({
      id: event.id,
      caseId,
      type: event.type,
      payload: JSON.stringify(event, replacer),
      at: Number(event.at),
    });
  }

  async load(caseId: string): Promise<ReadonlyArray<DomainEvent>> {
    const rows = await this.orm
      .select()
      .from(events)
      .where(eq(events.caseId, caseId))
      .orderBy(events.at);

    return rows.map((row) => JSON.parse(row.payload, reviver) as DomainEvent);
  }

  async listCaseIds(): Promise<ReadonlyArray<string>> {
    const rows = await this.orm.select({ caseId: events.caseId }).from(events).groupBy(events.caseId);
    return rows.map((r) => r.caseId);
  }
}
