# Ziddi (ज़िद्दी)

**The AI agent that never gives up on your grievance.**

Ziddi is a citizen-side follow-through engine for Indian grievances: potholes, landlord deposits, RTI backlogs, consumer refunds. It owns the **chasing, escalating, deadline-hitting, and evidence-packing** until the case closes.

> "India built 56 million pending cases because systems bet on citizen fatigue. Ziddi flips the bet: persistence becomes a public utility."

[![CI](https://github.com/ShivamSharko/Ziddi/actions/workflows/ci.yml/badge.svg)](https://github.com/ShivamSharko/Ziddi/actions/workflows/ci.yml)

## Why Ziddi exists

Every grievance system in India is designed around *filing*. Nothing is designed around *persistence*. Sludge works precisely because the cost of follow-up is pushed onto the citizen — so the system bets you will tire.

**Ziddi transfers the cost of persistence from the citizen to an agent with infinite patience.**

## Built for Indian behavior

- ✅ WhatsApp-style chat UX, not cold dashboards
- ✅ Hinglish-native (voice + text intake)
- ✅ Receipt Vault (evidence-first, OCR)
- ✅ Family-share mode
- ✅ Festival-aware triggers (Diwali→deposits, Monsoon→potholes)
- ✅ "You're top X% persistent in Bengaluru" social status
- ✅ Anonymous mode (fear-of-retaliation safe)
- ✅ Agent drafts, human approves (no auto-file)

## Architecture

```
packages/domain     ← Pure event-sourced domain (zero dependencies)
packages/gemini     ← Typed Gemini client with eval-gated prompts
packages/ui         ← Shared React components with Hinglish
services/agent      ← Orchestrator (connects AI + domain)
apps/web            ← Next.js 16 web app
```

**Stack:** TypeScript 7 + Next.js 16 + Gemini 3.5 Flash + pnpm workspaces

**Principles:** Event-sourced · Rules-as-code · Result types · Eval-gated prompts · Agent drafts, human approves

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for full details.

## Running locally

```bash
# Install dependencies
pnpm install

# Start web app
cd apps/web
cp .env.local.example .env.local
# Add your Gemini API key to .env.local (get free at https://aistudio.google.com/app/apikey)
pnpm dev
```

Open http://localhost:3000 and submit a grievance in Hinglish:
> "Landlord ne 60000 deposit wapas nahi diya Bengaluru mein, 2 mahine ho gaye."

## Testing

```bash
# Typecheck all packages
pnpm typecheck

# Run all tests
pnpm test

# Run evals (requires GEMINI_API_KEY)
export GEMINI_API_KEY=your_key
pnpm evals
```

## Docs

- [Architecture](./docs/ARCHITECTURE.md)
- [Indian Behavior Research](./docs/research/indian-behavior.md)
- [ADR-001: Stack & Principles](./docs/adr/001-stack-and-principles.md)

## Submission

Built for [Fund My Crazy 2026](https://fundmycrazy.com) — a Google Gemini initiative.

**Theme:** Our Community & Living  
**Judging Criteria:** Vision (30%) · Real-life Relevance (20%) · Built with Gemini (20%) · Future Focused (15%) · Execution (15%)

## License

MIT
