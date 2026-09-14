# ADR-001: Stack & Principles

**Date:** 2026-09-14
**Status:** Accepted

## Context
Ziddi is a citizen grievance persistence engine for India. It must be:
- Rock-solid (grievances involve money, housing, legal rights)
- Fast to ship (24h hackathon)
- Auditable (every AI action logged)
- Trustworthy (Indian users have high skepticism)

## Decision

### Stack
- **Language:** TypeScript 5.7 strict
- **Runtime:** Node 22 LTS
- **Monorepo:** pnpm 10 + Turborepo 2.5
- **Linter/Formatter:** Biome 2.0 (ESLint+Prettier replacement)
- **Validation:** Zod 3.24 (single source of truth with TS)
- **Error handling:** neverthrow (Result types, zero exceptions in domain)
- **State machine:** custom finite-state (XState too heavy for 24h)
- **AI:** Gemini 3 Flash (loop) + Gemini 3.1 Pro (drafts) + Live API (voice)
- **DB:** SQLite + Drizzle ORM (swap to Postgres later via repository interface)
- **Web:** Next.js 15 App Router
- **UI:** shadcn + Tailwind + Radix primitives
- **Testing:** Vitest + Playwright

### Principles
1. **Agent drafts, human approves.** Never auto-file.
2. **Informational assistance, not legal advice.** Disclaimers on every output.
3. **Rules-as-code.** SLA computation is deterministic, pure, tested — never in LLM.
4. **Event-sourced domain.** Every state transition is an append-only event.
5. **Eval-gated prompts.** No prompt edit without a fixture.
6. **Evidence-first.** No action without evidence + receipt vault.
7. **A11y & Hindi-first.** Elderly users and non-English speakers are first-class.
8. **Offline-first PWA.** Patchy Indian internet.

## Consequences
- Higher upfront complexity for auditability.
- Slower iteration on prompts (must add fixtures).
- More test code than typical startup.
- Worth it: we touch housing, money, legal rights.

