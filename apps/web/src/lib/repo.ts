import { CaseRepository } from "@ziddi/agent";
import { SqliteEventStore } from "@ziddi/agent";
import { seedDemoCases } from "@ziddi/agent";
import type { DomainError } from "@ziddi/domain";
import path from "node:path";

declare global {
  var __ziddiStore: SqliteEventStore | undefined;
  var __ziddiRepo: CaseRepository | undefined;
}

import fs from "node:fs";

export const getRepo = (): CaseRepository => {
  if (globalThis.__ziddiRepo === undefined) {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.join(dataDir, "ziddi.db");
    globalThis.__ziddiStore = new SqliteEventStore(dbPath);
    globalThis.__ziddiRepo = new CaseRepository(globalThis.__ziddiStore);
    
    // Seed demo cases on first run
    void seedDemoCases(globalThis.__ziddiStore);
  }
  return globalThis.__ziddiRepo;
};

export function errorMessage(error: DomainError): string {
  switch (error.kind) {
    case "ValidationFailed":
      return error.message;
    case "InvalidTransition":
      return `Cannot transition: ${error.reason}`;
    case "InvariantBroken":
      return error.message;
    case "NotFound":
      return `${error.entity} not found`;
  }
}
