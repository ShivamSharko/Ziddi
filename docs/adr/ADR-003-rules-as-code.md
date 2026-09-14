# ADR-003: Rules-as-Code — No LLM in Decision Paths

- **Status:** Accepted
- **Date:** 2026-09-15

## Context
Statutory deadlines (RTI Act 2005 s.7(1)/s.19, CPGRAMS 21-day norm, CPA 2019 s.69 limitation, Model Tenancy Act deposit refund) must be exact and auditable. LLMs hallucinate dates and section numbers. The judging rubric rewards future-proof, machine-readable design.

## Decision
- All decision logic is pure, deterministic TypeScript with unit tests:
  - `packages/domain/src/sla.ts` — SLA windows per case kind × urgency (bigint ms math).
  - `packages/domain/src/legal-registry.ts` — 2026 statutory deadline registry with citations (10 case kinds).
  - `packages/domain/src/festivals.ts` — seasonal trigger windows.
  - `packages/domain/src/aadhaar.ts` — Verhoeff checksum validation.
  - `packages/domain/src/case.ts` — event folding, progress, persistence percentile.
- LLMs are used ONLY for: intake extraction, evidence checklists, document drafting — always Zod-validated, always eval-gated (10 fixtures in CI), always confidence-scored.
- The escalation engine reads deadlines from the registry, never from model output.

## Consequences
- Positive: deadlines are testable (33 unit tests), versionable, and citable; model swaps never change legal behavior.
- Negative: registry requires manual updates when statutes change.
- Mitigation: registry is a single versioned file with tests asserting key deadlines (30d RTI reply, 90d second appeal, 730d CPA limitation, 21d CPGRAMS).

