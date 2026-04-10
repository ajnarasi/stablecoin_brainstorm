# Prototype 5 — Clover Direct

**Phase 5 deliverable of the Clover-CNP Growth workstream.** The hero product: every Clover restaurant and services merchant is discoverable and payable by every major AI agent, at 8% all-in instead of DoorDash's 28%.

> "Fiserv is the only SMB acquirer whose 6 million merchants are ready for AI agent payments today."

## What this prototype proves

1. **Discovery + acceptance = one story.** Phase 4 evidence showed OpenAI's end-to-end ACP Instant Checkout failed in early 2026 (only ~30 Shopify merchants activated) and OpenAI pivoted to discovery-only. Clover Direct must solve discovery *and* acceptance — not one or the other.
2. **The Fiserv-Mastercard Agent Pay integration (Dec 2025) is real asymmetric plumbing.** Toast and Square don't have it. Clover merchants become agent-payable at the acquirer layer without lifting a finger.
3. **Merchant-visible math**: 8% take-rate vs DoorDash 28-40% all-in. The pitch is the delta, not the rail.
4. **The Agent Order Translation Layer is the missing piece.** The acquirer-level integration terminates at tokenized card acceptance; translating agent intent (ACP / AP2 / Mastercard Agent Pay payloads) into Clover Platform API orders with line items, modifiers, tip, delivery is the load-bearing build.

## Scope of this prototype

This is a **demo-grade cinematic showcase**, not a production integration. The goal is to tell the story convincingly to investors in under 90 seconds per vertical.

**In scope:**
- Cinematic showcase scenes for **Clover Direct** (restaurant hero), **SmartDeposit** (services hero), and **WeekendCash** (horizontal "humanizing act", reshape of prototype-1's code)
- Mocked Agent Order Translation Layer payloads showing an ACP agent intent → Clover Platform API order shape
- Demo merchant data for "Luigi's Pizzeria" and "Blue Orchid Spa"
- v3 Investor Day deck with the new Clover-CNP narrative arc
- Phase 5 PRDs in this folder (`docs/`)

**Explicitly out of scope:**
- Real Mastercard Agent Pay integration (requires production Fiserv credentials)
- Real ChatGPT / Gemini merchant directory submission (decision pending — Option A/B/C in `06-portfolio-after.md`)
- Production Clover Platform API credentials (demo mode only)
- Real FIUSD settlement (simulated via same Finxact-client mock pattern as prototypes 1-4)

## Product shape (post-Phase-4 revision)

| | Original Phase 3 framing | Post-Phase-4 revision |
|---|---|---|
| Pitch | "Agents order end-to-end in ChatGPT" | **"Every Clover restaurant is discoverable and payable by every AI agent"** |
| Critical missing piece | None identified | **Agent Order Translation Layer** + Clover Merchant Directory |
| Hero demo | Live agent ordering from a real Clover restaurant at 8% | **Discovery → handoff → acceptance flow**, with the 8% vs 28% comparison as the closing beat |

## Architecture (high level)

```
  AI agent (ChatGPT / Gemini / Claude / Perplexity / Apple Intelligence)
                          |
                          v
  +---------------------------------------------------+
  |         Clover Merchant Directory                 |
  |  (Option A: build native / B: license Shopify     |
  |   Agentic Plan / C: per-platform direct — TBD)    |
  +---------------------------------------------------+
                          |
                          v
  +---------------------------------------------------+
  |   Clover Agent Checkout backbone  (reshape of P2) |
  |   Gateway + Verifier + Settler + Agent SDK +      |
  |   *** Agent Order Translation Layer ***           |
  +---------------------------------------------------+
                          |
           +--------------+--------------+
           v                             v
  Mastercard Agent Pay          Clover Platform API
  (Dec 2025 integration)        (rich order creation)
           |                             |
           +--------------+--------------+
                          v
                 Clover merchant POS
                 + Finxact + INDX (for WeekendCash-
                 grade settlement acceleration)
```

The **Agent Order Translation Layer** is the single most differentiating technical component. It takes agent intent in ACP / AP2 / Mastercard Agent Pay payload formats and maps it to Clover's Platform API order structure (line items, modifiers, discounts, service charges, tip, delivery metadata) with correct tax and totals.

## Repository layout

```
prototype-5-clover-direct/
  README.md                      # This file
  backend/                       # FastAPI stub (demo mode only)
    app/
      main.py                    # Single-file demo backend
      agent_order_translation.py # ACP payload → Clover order mapper
      demo_data.py               # Luigi's Pizzeria catalog, BOM, menu
    requirements.txt
    run.py
  docs/
    PRD-clover-direct.md         # Product spec
    PRD-smartdeposit.md          # Product spec
    PRD-weekendcash.md           # Product spec (reshape of P1)
    architecture.md              # Detailed architecture
    agent-order-translation-spec.md  # The load-bearing component
```

The cinematic showcase lives in the existing `demo-app/` — see `demo-app/src/pages/CloverCnpShowcasePage.jsx` and `demo-app/src/components/clovercnp/`.

## How to run the showcase

```bash
cd demo-app
npm install        # if not already
npm run dev
# open http://localhost:5173/clover-cnp-showcase
```

The cinematic showcase auto-plays on scroll. Keyboard: arrow keys to navigate, Esc to exit.

## What to watch in the demo

1. **Scene 1 — Clover Direct (restaurant hero)**: ChatGPT user says "order a large pepperoni from a pizza place near me." Agent hits Clover's directory. Clover Agent Checkout backbone translates intent → Clover order. Luigi's Pizzeria POS rings with a full ticket (pepperoni, extra cheese, side of garlic knots, 18% tip, delivery address). Merchant's dashboard shows "8% all-in (vs DoorDash 28%)." Kill threshold on the final card: <$50M annualized agent-channel GPV by Q4 2026 → product dies.
2. **Scene 2 — SmartDeposit (services hero)**: Apple Intelligence books a deep-tissue massage at Blue Orchid Spa for Saturday 2pm. A $50 deposit is locked at the click. Cryptographic mandate receipt shown as dispute defense evidence (claim held back — "directional, pending measurement" per Phase 4).
3. **Scene 3 — WeekendCash (humanizing act)**: Friday 11pm Luigi's closes out. Normal T+1 ACH would land Tuesday. WeekendCash advances via Finxact + INDX. Saturday morning 6am: money in the account. "Backed by Fiserv" badge explicitly shown — the product *is* the balance-sheet backstop.

## Phase 5 prerequisites (carried from Phase 4)

1. **Named cross-BU P&L owner** before first production-targeted commit (Drucker, non-negotiable)
2. **Clover Merchant Directory strategy** — Option A / B / C decision
3. **AI-lab demo partnership** (Anthropic or OpenAI) for the Clover Direct hero demo
4. **WeekendCash safeguards hard-wired** — 60-min balance-sheet backstop, 99.9% auto-pause, conservative ramp
5. **SmartDeposit dispute-defense claim** held back until instrumented

See `deliverables/clover-cnp/06-portfolio-after.md` for the full handoff context.

## Kill thresholds

| Product | Kill threshold | Rationale |
|---|---|---|
| Clover Direct | <$50M annualized agent-channel GPV by Q4 2026 | Asymmetric asset didn't cash in; absorb rails into generic acceptance |
| WeekendCash | <99.9% rolling 30-day SLA | Fragility on a Saturday-money promise is catastrophic |
| SmartDeposit | TBD — needs ~6 months of measured dispute-win-rate data | Earn the defensibility claim before selling it |
