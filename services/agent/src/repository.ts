/**
 * Event Store. In-memory for the hackathon MVP.
 * Strict interface so we can swap to SQLite/Postgres later without changing orchestrator code.
 */
import type { DomainEvent } from "@ziddi/domain";
import * as Case from "@ziddi/domain/case";
import type { CaseState, DomainError } from "@ziddi/domain";
import { ok, err, Result } from "@ziddi/domain";

export interface EventStore {
  append(caseId: string, event: DomainEvent): Promise<void>;
  load(caseId: string): Promise<ReadonlyArray<DomainEvent>>;
  listCaseIds(): Promise<ReadonlyArray<string>>;
}

export class InMemoryEventStore implements EventStore {
  private readonly store = new Map<string, DomainEvent[]>();

  async append(caseId: string, event: DomainEvent): Promise<void> {
    const events = this.store.get(caseId) ?? [];
    events.push(event);
    this.store.set(caseId, events);
  }

  async load(caseId: string): Promise<ReadonlyArray<DomainEvent>> {
    return this.store.get(caseId) ?? [];
  }

  async listCaseIds(): Promise<ReadonlyArray<string>> {
    return Array.from(this.store.keys());
  }
}

export class CaseRepository {
  constructor(private readonly store: EventStore) {}

  async getCase(caseId: string): Promise<Result<CaseState, DomainError>> {
    const events = await this.store.load(caseId);
    return Case.rehydrate(events);
  }

  async saveEvent(caseId: string, event: DomainEvent): Promise<void> {
    await this.store.append(caseId, event);
  }

  async listCases(): Promise<ReadonlyArray<CaseState>> {
    const ids = await this.store.listCaseIds();
    const results = await Promise.all(ids.map((id) => this.getCase(id)));
    return results.filter((r): r is Result<CaseState, DomainError> & { isOk: () => true } => r.isOk()).map((r) => r.value);
  }
}

