import { CaseRepository, JsonFileEventStore } from "@ziddi/agent";
import type { DomainError } from "@ziddi/domain";
import path from "node:path";

declare global {
  var __ziddiStore: JsonFileEventStore | undefined;
  var __ziddiRepo: CaseRepository | undefined;
}

export const getRepo = (): CaseRepository => {
  if (globalThis.__ziddiRepo === undefined) {
    const dataDir = process.env.ZIDDI_DATA_DIR ?? "data";
    const dbPath = path.join(process.cwd(), dataDir, "ziddi.json");
    globalThis.__ziddiStore = new JsonFileEventStore(dbPath);
    globalThis.__ziddiRepo = new CaseRepository(globalThis.__ziddiStore);
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
