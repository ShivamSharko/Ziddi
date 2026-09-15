# Ziddi (ज़िद्दी)

**The AI agent that never gives up on your grievance.**

Ziddi is a citizen-side follow-through engine for Indian grievances: potholes, landlord deposits, RTI backlogs, consumer refunds. It owns the chasing, escalating, deadline-hitting, and evidence-packing until the case closes.

> "India built 56 million pending cases because systems bet on citizen fatigue. Ziddi flips the bet: persistence becomes a public utility."

[![CI](https://github.com/ShivamSharko/Ziddi/actions/workflows/ci.yml/badge.svg)](https://github.com/ShivamSharko/Ziddi/actions/workflows/ci.yml)

## Why Ziddi exists

Every grievance system in India is designed around **filing**. Nothing is designed around **persistence**. Sludge works precisely because the cost of follow-up is pushed onto the citizen — so the system bets you will tire.

**Ziddi transfers the cost of persistence from the citizen to an agent with infinite patience.**

## Built for Indian behavior

- ✅ WhatsApp-style chat UX, not cold dashboards
- ✅ Hinglish-native (voice + text intake, Gemini Live API)
- ✅ Receipt Vault (evidence-first, numbered EVID-01… sequence)
- ✅ Family-share mode (WhatsApp)
- ✅ Festival-aware triggers (Diwali → deposits, Monsoon → potholes)
- ✅ "You're top X% persistent in Bengaluru" social status (Fight Meter)
- ✅ Anonymous mode (fear-of-retaliation safe)
- ✅ Agent drafts, human approves (no auto-file)
- ✅ Aadhaar + OTP verification, hash-only storage (UIDAI-compliant)

## Architecture

`
packages/domain     → Pure event-sourced domain (zero dependencies)
packages/gemini     → Typed Gemini client with eval-gated prompts
packages/ui         → Shared React components + i18n (EN / हिं / Hinglish)
services/agent      → Orchestrator (connects AI + domain)
apps/web            → Next.js 16 web app
extensions/chrome   → Portal automation (CPGRAMS / e-Daakhil / RTI Online)
`

**Stack:** TypeScript (strict) · Next.js 16 App Router + Turbopack · Gemini 3 Flash family with quota-aware fallback chain · pnpm workspaces · Vitest + Playwright + eval fixtures · GitHub Actions CI

**Principles:** Event-sourced · Rules-as-code (LLM never computes deadlines) · Result types · Eval-gated prompts · Agent drafts, human approves

See docs/ARCHITECTURE.md, docs/adr/ and docs/GEMINI_USAGE.md for full details.

## Running locally

`ash
# Install dependencies
pnpm install

# Start web app
cd apps/web
cp .env.local.example .env.local
# Add your Gemini API key to .env.local (free at https://aistudio.google.com/app/apikey)
pnpm dev
`

Open http://localhost:3000 and submit a grievance in Hinglish:

> "Landlord ne 60000 deposit wapas nahi diya Bengaluru mein, 2 mahine ho gaye."

## Testing

`ash
# Typecheck all packages
pnpm typecheck

# Run all unit tests
pnpm test

# Run prompt evals (requires GEMINI_API_KEY)
pnpm evals

# Run e2e + a11y + mobile (spawns its own server on :3100)
pnpm test:e2e
`

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [ADR-001: Stack & Persistence](docs/adr/ADR-001-stack.md)
- [ADR-002: Draft-not-file](docs/adr/ADR-002-draft-not-file.md)
- [ADR-003: Rules-as-code](docs/adr/ADR-003-rules-as-code.md)
- [Gemini Usage Log](docs/GEMINI_USAGE.md)

## Submission

Built for **Fund My Crazy 2026** — a Google Gemini initiative.

- Theme: **Our Community & Living**
- Judging criteria: Vision (30%) · Real-life Relevance (20%) · Built with Gemini (20%) · Future Focused (15%) · Execution (15%)

## Portal Automation (Chrome Extension)

Auto-fill Indian government grievance portals with your Ziddi case data.

**Supported portals:** CPGRAMS (pgportal.gov.in) · e-Daakhil (edaakhil.nic.in) · RTI Online (rtionline.gov.in)

**Installation:**
1. Open Chrome → chrome://extensions/
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the extensions/chrome folder

**Usage:** create a case → click the extension icon → select case → choose portal → review → **manually click Submit**.

**Guardrail:** the extension respects the draft-not-file principle — it fills, never files.

## License

MIT