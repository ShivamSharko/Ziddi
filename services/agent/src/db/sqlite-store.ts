/**
 * SQLite event store using sql.js (pure WebAssembly — no native deps).
 * DB is kept in-memory and flushed to disk after every write.
 */
import { createRequire } from "node:module";
import initSqlJs, { type Database } from "sql.js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { DomainEvent } from "@ziddi/domain";
import type { EventStore } from "../repository";

export class SqliteEventStore implements EventStore {
  private db: Database | null = null;
  private readonly dbPath: string;
  private initPromise: Promise<void> | null = null;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  private async ensureInit(): Promise<void> {
    if (this.db !== null) return;
    if (this.initPromise !== null) {
      await this.initPromise;
      return;
    }
    this.initPromise = (async () => {
      mkdirSync(dirname(this.dbPath), { recursive: true });
      const require = createRequire(import.meta.url);
      const wasmPath = require.resolve("sql.js/dist/sql-wasm.wasm");
      const SQL = await initSqlJs({
        locateFile: () => wasmPath,
      });
      if (existsSync(this.dbPath)) {
        const buffer = readFileSync(this.dbPath);
        this.db = new SQL.Database(buffer);
      } else {
        this.db = new SQL.Database();
      }
      this.db.run(`
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          case_id TEXT NOT NULL,
          type TEXT NOT NULL,
          payload TEXT NOT NULL,
          at INTEGER NOT NULL
        )
      `);
      this.db.run(`
        CREATE INDEX IF NOT EXISTS idx_events_case_id ON events(case_id)
      `);
      this.flush();
    })();
    await this.initPromise;
  }

  private flush(): void {
    if (this.db === null) return;
    const data = this.db.export();
    writeFileSync(this.dbPath, Buffer.from(data));
  }

  async append(caseId: string, event: DomainEvent): Promise<void> {
    await this.ensureInit();
    if (this.db === null) throw new Error("DB not initialized");
    this.db.run(
      "INSERT INTO events (id, case_id, type, payload, at) VALUES (?, ?, ?, ?, ?)",
      [event.id, caseId, event.type, JSON.stringify(event), Number(event.at)],
    );
    this.flush();
  }

  async load(caseId: string): Promise<ReadonlyArray<DomainEvent>> {
    await this.ensureInit();
    if (this.db === null) throw new Error("DB not initialized");
    const results = this.db.exec(
      "SELECT payload FROM events WHERE case_id = ? ORDER BY at ASC",
      [caseId],
    );
    const rows = results[0]?.values ?? [];
    return rows.map((row) => JSON.parse(row[0] as string) as DomainEvent);
  }

  async listCaseIds(): Promise<ReadonlyArray<string>> {
    await this.ensureInit();
    if (this.db === null) throw new Error("DB not initialized");
    const results = this.db.exec("SELECT DISTINCT case_id FROM events");
    const rows = results[0]?.values ?? [];
    return rows.map((row) => row[0] as string);
  }
}
