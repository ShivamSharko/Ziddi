# ADR-002: The Agent Drafts, Never Auto-Files

- **Status:** Accepted
- **Date:** 2026-09-15

## Context
Automated legal filing carries unauthorized-practice-of-law exposure and trust risk. The DoNotPay precedent (FTC order, Jan 2025, over deceptive capability claims) shows the regulatory and reputational cost of overclaiming. Indian grievance portals (CPGRAMS, e-Daakhil, RTI Online) also have anti-automation controls that make scraping fragile.

## Decision
- The agent produces **drafts only** (`DraftPrepared` event). Every document requires an explicit human approval (`DraftApproved`) or rejection (`DraftRejected`) before the case status advances to Filed.
- Every draft and every draft view carries the disclaimer: "Informational assistance, not legal advice."
- No portal automation in v1: outputs are portal-ready packs (formatted text + citation list + evidence checklist) the citizen pastes/submits themselves.
- No success guarantees anywhere in UI or generated documents.

## Consequences
- Positive: legal-safety posture is a judging asset; users retain agency ("Babu anxiety" reduced without removing control); no fragile scraping.
- Negative: one extra click per document (mitigated by a single Approve button).
- Enforcement: the state machine makes approval structurally mandatory — `approveDraft` is the only transition into Filed.

