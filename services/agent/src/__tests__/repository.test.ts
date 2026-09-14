import { describe, it, expect } from "vitest";
import { InMemoryEventStore, CaseRepository } from "../repository";
import type { CaseOpened } from "@ziddi/domain";

describe("CaseRepository", () => {
  it("saves and rehydrates a case from events", async () => {
    const store = new InMemoryEventStore();
    const repo = new CaseRepository(store);

    const event: CaseOpened = {
      id: "01J9K1ABCDEFGH1234567890AB",
      caseId: "01J9K1ABCDEFGH1234567890ZZ",
      type: "CaseOpened",
      kind: "LandlordDeposit",
      summary: "Landlord not returning 60000 deposit",
      city: "Bengaluru",
      state: "Karnataka",
      urgency: "High",
      amountPaise: 6000000n,
      at: 1_726_000_000_000n,
      actor: { type: "Citizen", id: "c1" },
    };

    await repo.saveEvent(event.caseId, event);
    const result = await repo.getCase(event.caseId);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.kind).toBe("LandlordDeposit");
      expect(result.value.status).toBe("Evidence");
      expect(result.value.amountPaise).toBe(6000000n);
    }
  });

  it("returns error for unknown case", async () => {
    const store = new InMemoryEventStore();
    const repo = new CaseRepository(store);
    const result = await repo.getCase("unknown-id");
    expect(result.isErr()).toBe(true);
  });
});

