# ADR-001: Technology Stack & Persistence Strategy

- **Status:** Accepted
- **Date:** 2026-09-15

## Context
Ziddi had to be built in ~24 hours on a Windows machine running Node 24, targeting the Fund My Crazy 2026 hackathon, while maintaining production-grade quality: strict typing, comprehensive tests, CI gates, and zero-cost Gemini usage on the free tier.

## Decision
- **Language/runtime:** TypeScript (strict, exactOptionalPropertyTypes, noUncheckedIndexedAccess) on Node 24.
- **Web:** Next.js 16 App Router with Turbopack.
- **Monorepo:** pnpm 10 workspaces + Turborepo 2.10 (6 packages: domain, gemini, ui, agent, web, evals).
- **Testing:** Vitest (unit), custom eval runner (prompt fixtures), Playwright (e2e + axe-core a11y).
- **Persistence:** Append-only event store behind an `EventStore` interface. Implementation: `JsonFileEventStore` (JSON file, flushed per write).

### Persistence rationale (honest lessons)
1. `better-sqlite3` was attempted first (spec suggested SQLite+Drizzle) but has no prebuilt binaries for Node 24 on Windows and requires a C++ toolchain (`node-gyp`) — unacceptable for a 1-day build.
2. `sql.js` (WASM SQLite) was attempted second but Turbopack bundles its WASM loader into the browser graph, breaking server-only usage in the App Router.
3. `JsonFileEventStore` has zero native/WASM dependencies, is trivially inspectable for demos, and satisfies the interface — swapping to Postgres/SQLite later requires changing one constructor call.

## Consequences
- Positive: fully portable, no build-toolchain risk, demo-safe, interface keeps the door open for real DBs.
- Negative: single-writer assumption; not suitable for high-concurrency production without swapping the store.
- Mitigation: repository interface + event sourcing means migration is a storage-layer change only.

