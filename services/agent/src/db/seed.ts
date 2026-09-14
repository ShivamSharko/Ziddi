import { ulid } from "ulid";
import type {
  CaseOpened,
  EvidenceAttached,
  DraftPrepared,
} from "@ziddi/domain";
import type { EventStore } from "../repository";

const NOW = BigInt(Date.now());
const DAY_MS = 86_400_000n;

export async function seedDemoCases(store: EventStore) {
  const existing = await store.listCaseIds();
  if (existing.length > 0) {
    console.log("Database already has cases, skipping seed");
    return;
  }

  console.log("Seeding 3 demo cases...");

  // Case 1: Bengaluru pothole (74 days old, high urgency)
  const case1Id = ulid();
  const case1Opened: CaseOpened = {
    id: ulid(),
    caseId: case1Id,
    type: "CaseOpened",
    kind: "CivicPothole",
    summary: "HSR Layout 27th main road pe bada pothole hai, 3 mahine se fix nahi hua. Kal bike gir gayi.",
    city: "Bengaluru",
    state: "Karnataka",
    locality: "HSR Layout",
    urgency: "High",
    at: NOW - 74n * DAY_MS,
    actor: { type: "Citizen", id: "user_1" },
  };
  const case1Evidence1: EvidenceAttached = {
    id: ulid(),
    caseId: case1Id,
    type: "EvidenceAttached",
    evidenceId: ulid(),
    mimeType: "text/plain",
    description: "Pothole photo from Google Maps",
    hashSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    at: NOW - 73n * DAY_MS,
    actor: { type: "Citizen", id: "user_1" },
  };
  const case1Evidence2: EvidenceAttached = {
    id: ulid(),
    caseId: case1Id,
    type: "EvidenceAttached",
    evidenceId: ulid(),
    mimeType: "text/plain",
    description: "BBMP complaint reference number",
    hashSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    at: NOW - 70n * DAY_MS,
    actor: { type: "Citizen", id: "user_1" },
  };

  await store.append(case1Id, case1Opened);
  await store.append(case1Id, case1Evidence1);
  await store.append(case1Id, case1Evidence2);

  // Case 2: Landlord deposit ₹60k (45 days old, high urgency)
  const case2Id = ulid();
  const case2Opened: CaseOpened = {
    id: ulid(),
    caseId: case2Id,
    type: "CaseOpened",
    kind: "LandlordDeposit",
    summary: "Landlord ne 60000 deposit wapas nahi diya Bengaluru mein, 2 mahine ho gaye. Rental agreement hai mere paas.",
    city: "Bengaluru",
    state: "Karnataka",
    locality: "Koramangala",
    urgency: "High",
    amountPaise: 6000000n,
    at: NOW - 45n * DAY_MS,
    actor: { type: "Citizen", id: "user_1" },
  };
  const case2Evidence1: EvidenceAttached = {
    id: ulid(),
    caseId: case2Id,
    type: "EvidenceAttached",
    evidenceId: ulid(),
    mimeType: "text/plain",
    description: "Rental agreement page 1",
    hashSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    at: NOW - 44n * DAY_MS,
    actor: { type: "Citizen", id: "user_1" },
  };
  const case2Evidence2: EvidenceAttached = {
    id: ulid(),
    caseId: case2Id,
    type: "EvidenceAttached",
    evidenceId: ulid(),
    mimeType: "text/plain",
    description: "UPI transaction screenshot",
    hashSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    at: NOW - 44n * DAY_MS,
    actor: { type: "Citizen", id: "user_1" },
  };
  const case2Draft: DraftPrepared = {
    id: ulid(),
    caseId: case2Id,
    type: "DraftPrepared",
    draftId: ulid(),
    stage: "DemandNotice",
    language: "en-IN-hinglish",
    body: "DRAFT: Demand Notice for Security Deposit Refund\n\nDate: ...\n\nTo,\nLandlord Name\nAddress\n\nSubject: Demand for refund of security deposit of Rs. 60,000/-\n\nRespected Sir/Madam,\n\nI am writing to demand the refund of my security deposit of Rs. 60,000/- as per the rental agreement dated ...\n\n[Full draft content here]",
    confidence: 0.92,
    at: NOW - 40n * DAY_MS,
    actor: { type: "Agent", runId: ulid() },
  };

  await store.append(case2Id, case2Opened);
  await store.append(case2Id, case2Evidence1);
  await store.append(case2Id, case2Evidence2);
  await store.append(case2Id, case2Draft);

  // Case 3: Airline refund ₹15k (90 days old, emergency urgency)
  const case3Id = ulid();
  const case3Opened: CaseOpened = {
    id: ulid(),
    caseId: case3Id,
    type: "CaseOpened",
    kind: "ConsumerRefund",
    summary: "Air India ne flight cancel ki thi, 15000 refund nahi mil raha. 1 mahine ho gaye.",
    city: "Mumbai",
    state: "Maharashtra",
    locality: "Andheri",
    urgency: "High",
    amountPaise: 1500000n,
    at: NOW - 90n * DAY_MS,
    actor: { type: "Citizen", id: "user_1" },
  };
  const case3Evidence1: EvidenceAttached = {
    id: ulid(),
    caseId: case3Id,
    type: "EvidenceAttached",
    evidenceId: ulid(),
    mimeType: "text/plain",
    description: "Flight booking confirmation",
    hashSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    at: NOW - 89n * DAY_MS,
    actor: { type: "Citizen", id: "user_1" },
  };
  const case3Evidence2: EvidenceAttached = {
    id: ulid(),
    caseId: case3Id,
    type: "EvidenceAttached",
    evidenceId: ulid(),
    mimeType: "text/plain",
    description: "Cancellation email from Air India",
    hashSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    at: NOW - 88n * DAY_MS,
    actor: { type: "Citizen", id: "user_1" },
  };

  await store.append(case3Id, case3Opened);
  await store.append(case3Id, case3Evidence1);
  await store.append(case3Id, case3Evidence2);

  console.log("Seeded 3 demo cases successfully");
}

