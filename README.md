# Ziddi (ज़िद्दी)

**The AI agent that never gives up on your grievance.**

Ziddi is a citizen-side follow-through engine for Indian grievances: potholes, landlord deposits, RTI backlogs, consumer refunds. It owns the **chasing, escalating, deadline-hitting, and evidence-packing** until the case closes.

> "India built 56 million pending cases because systems bet on citizen fatigue. Ziddi flips the bet: persistence becomes a public utility."

## Why Ziddi exists
Every grievance system in India is designed around *filing*. Nothing is designed around *persistence*. Sludge works precisely because the cost of follow-up is pushed onto the citizen — so the system bets you will tire.

## Built for Indian behavior
- WhatsApp-style chat UX, not cold dashboards
- Hinglish-native (voice + text intake)
- Receipt Vault (evidence-first, OCR)
- Family-share mode
- Festival-aware triggers (Diwali→deposits, Monsoon→potholes)
- "You're top X% persistent in Bengaluru" social status
- Anonymous mode (fear-of-retaliation safe)
- Agent drafts, human approves (no auto-file)

## Architecture
Monorepo (pnpm + Turborepo). Event-sourced domain. CQRS-lite. Rules-as-code. Eval-gated Gemini prompts. Zero exceptions in domain (Result types).

## Running locally pnpm install
pnpm dev 
## Docs
- [ADR-001: Stack & Principles](./docs/adr/001-stack-and-principles.md)

## Submission
Built for [Fund My Crazy 2026](https://fundmycrazy.com) — a Google Gemini initiative.

