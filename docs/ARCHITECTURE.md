# Ziddi Architecture

## Monorepo Structure

```
ziddi/
├─ packages/
│  ├─ domain/      # Pure event-sourced domain (no AI, no DB, no HTTP)
│  ├─ gemini/      # Typed Gemini client with Zod validation
│  └─ ui/          # Shared React components with Hinglish
├─ services/
│  └─ agent/       # Orchestrator (connects AI + domain)
├─ apps/
│  └─ web/         # Next.js 16 web app
└─ evals/          # Prompt eval fixtures
```

## Core Principles

1. **Event-sourced domain**: Every state transition is an immutable event. Append-only log makes the system auditable and safe.

2. **Rules-as-code**: SLA computation is deterministic, pure, tested — never in LLM. The agent doesn't compute deadlines; it enforces them.

3. **Result types everywhere**: `neverthrow` Result<T, E> — zero exceptions in domain code. Every error is typed and handled explicitly.

4. **Eval-gated prompts**: No prompt edit ships without a fixture passing. Evals run in CI.

5. **Agent drafts, human approves**: The agent NEVER auto-files. Every legal document requires explicit human approval.

## Data Flow

```
Citizen (Hinglish text/voice)
  ↓
Intake Agent (Gemini Flash) → structured CaseOpened event
  ↓
Event Store (in-memory for MVP, SQLite/Postgres for prod)
  ↓
Evidence Checklist (Gemini Flash) → structured checklist
  ↓
Citizen uploads evidence → EvidenceAttached events
  ↓
Drafter (Gemini Flash) → DraftPrepared event with legal document
  ↓
Human approval gate → DraftApproved / DraftRejected
  ↓
SLA clock (pure domain logic) → auto-escalate on breach
```

## Indian Psychology Baked In

- **WhatsApp-first UX**: Chat-style intake, not cold forms
- **Hinglish-native**: All prompts and UI strings support Hinglish
- **Receipt culture**: Evidence vault is a core primitive (Indians keep UPI screenshots, bills)
- **Family consultation**: "Share with family" button, not just social share
- **Fear of retaliation**: Anonymous mode + encrypted evidence store
- **Festival triggers**: Diwali → deposits, Monsoon → potholes
- **Status signaling**: "You're top 5% persistent in Bengaluru"

## Tech Stack (Sept 2026)

- **Language**: TypeScript 7.0.2
- **Runtime**: Node 22 LTS
- **Web**: Next.js 16.3.5 + Turbopack
- **AI**: Gemini 3.5 Flash (loop) + Gemini 3.1 Pro (drafts, with fallback chain)
- **Validation**: Zod 3.24 + neverthrow Result types
- **Monorepo**: pnpm 10 + Turborepo 2.10
- **Testing**: Vitest + Playwright (e2e)
- **Styling**: Tailwind CSS v4 + Radix primitives

## Deployment

- **MVP**: In-memory event store (resets on restart, fine for demo)
- **Production**: Swap InMemoryEventStore for SQLite/Postgres via repository interface — zero code changes in orchestrator

