# Phase 5 — Delivery

*What shipped, where it lives, how to run it, and what's still open for the user to decide.*

## What shipped

### 1. `prototype-5-clover-direct/` — the Phase 5 prototype folder

A new prototype folder matching the house layout of `prototype-1..4`. Contains:

- **`README.md`** — one-page overview, architecture sketch, run instructions, kill thresholds
- **`docs/PRD-clover-direct.md`** — full PRD for the hero product
- **`docs/PRD-smartdeposit.md`** — full PRD for the services/catering capability
- **`docs/PRD-weekendcash.md`** — full PRD for the prototype-1 reshape, with the corrected regulatory framing (non-lender post-payment settlement acceleration, Stripe/Square Instant Payout precedent)
- **`docs/agent-order-translation-spec.md`** — detailed spec for the load-bearing Agent Order Translation Layer that bridges agent-layer protocols (ACP, AP2, Mastercard Agent Pay) to Clover's Platform API order model

### 2. Cinematic showcase — Clover CNP edition

A new cinematic showcase route in `demo-app/` that tells the full Phase 5 narrative in 5 scenes. Follows the same Apple-keynote style as the existing `/showcase` but is specifically the Clover-CNP story.

- **Route**: `/clover-cnp-showcase`
- **Scenes**:
  1. `CloverCnpHero` — opening asymmetry slide. "Clover is card-present heavy. Toast/Shopify/Square own conventional CNP. But Fiserv is the only SMB acquirer whose 6M merchants are ready for AI agent payments today." 4-column comparison highlighting the Dec 2025 Mastercard Agent Pay integration.
  2. `CloverDirectScene` — hero product. Split screen: ChatGPT → Clover Agent Checkout Gateway pipeline on the left, Luigi's Pizzeria POS receipt with full ticket (modifiers, tip, delivery) + 8% vs 28% take-rate comparison on the right. Ends on the public kill threshold.
  3. `SmartDepositScene` — services hero. Split screen: Apple Intelligence booking flow → Blue Orchid Spa dashboard showing "Fully booked. Zero no-shows." and the instrumented (but not-yet-claimed) dispute mandate panel.
  4. `WeekendCashScene` — humanizing act / reshape of prototype-1. Split screen: Friday-to-Saturday timeline → Luigi's Finxact account crediting $8,420 on Saturday 6am, with explicit "★ BACKED BY FISERV" badge and Taleb safeguards.
  5. `CloverCnpClosing` — portfolio discipline. Lists the 4 in-scope products with their kill thresholds and the 3 explored-and-parked items (Net-Zero, P3, P4) in the via-negativa framing.

- **Files**:
  - `demo-app/src/pages/CloverCnpShowcasePage.jsx`
  - `demo-app/src/components/clovercnp/CloverCnpHero.jsx`
  - `demo-app/src/components/clovercnp/CloverDirectScene.jsx`
  - `demo-app/src/components/clovercnp/SmartDepositScene.jsx`
  - `demo-app/src/components/clovercnp/WeekendCashScene.jsx`
  - `demo-app/src/components/clovercnp/CloverCnpClosing.jsx`
  - Route registered in `demo-app/src/App.jsx`

**How to run**:
```bash
cd demo-app
npm install        # if needed
npm run dev
# open http://localhost:3000/clover-cnp-showcase
```
Use arrow keys to navigate. Esc to exit to landing.

### 3. v3 Investor Day deck

**File**: `deliverables/Fiserv_Crypto_Strategy_Investor_Day_v3.pptx`

Built by modifying v2 in place (so all the infrastructure, market, stack, protocol, and blue-ocean slides survive unchanged). The changes:

| Slide | v2 | v3 |
|---|---|---|
| 2 — Strategic Recommendation | Broad Fiserv crypto strategy summary | **Reframed to Clover CNP.** Four columns now read: "WHERE THE WEDGE IS (2026)", "PORTFOLIO — PHASE 5 BUILD", "EXPLORED AND PARKED", "KEY FACTS (Phase 4 research)". Bottom recommendation updated to name Clover Direct as the lead. |
| 16 — Prototype 1 | Merchant Yield Sweep | **Clover Direct** (new hero) |
| 17 — Prototype 2 | Pay-by-Agent x402 | **SmartDeposit** |
| 18 — Prototype 3 | Instant Supplier Pay | **WeekendCash** (reshape of P1) |
| 19 — Prototype 4 | Cross-Border Instant Settlement | **Clover Agent Checkout Backbone** (reshape of P2) |
| 20 — Risk Assessment | Risk/mitigation table | **Portfolio Discipline & Kill Thresholds.** Risk table removed. Body content enumerates the 4 in-scope products with their kill thresholds + the 3 parked items with rationale. |
| All other slides | — | Unchanged (market opportunity, competitive landscape, vertical stack, FIUSD flywheel, provider architecture, x402/MPP gap, Blue Ocean framework, closing quote — all survive the reframe) |

Each updated prototype slide preserves the house style (title + problem + solution + "how it works" + 4 metric columns + closing line) and every metric column uses a `<a:br/>` XML soft break for the label so they fit inside the narrow boxes without overflow — identical to the v2 format.

**Build script**: `/tmp/build_v3_deck.py` (preserved for reproducibility — re-runs against the v2 source to regenerate v3).

## What still needs your sign-off before real production build

These are the Phase 5 gates from `06-portfolio-after.md`, none of which can be made autonomously:

1. **Single cross-BU P&L owner** for the Clover-CNP portfolio — Drucker's non-negotiable, repeated on every panel candidate
2. **Clover Merchant Directory strategy** — Option A (build native) / B (license Shopify Agentic Plan) / C (per-platform direct). The single biggest open architectural decision.
3. **AI-lab demo partnership** (Anthropic or OpenAI) for the Clover Direct hero demo
4. **WeekendCash pricing model** — panel-preferred is "free, Fiserv-backstopped" but this is a P&L owner call
5. **SmartDeposit branding** — standalone or folded into Clover Direct as a named capability
6. **Investor Day timing** — determines whether Phase 5 engineering needs scope cuts
7. **Rename everything** before first production commit — "Pay-by-Agent x402" → "Clover Agent Checkout", "Merchant Yield Sweep" → "WeekendCash" (or SaturdayCash)

## Verification evidence

- **Cinematic showcase**: verified end-to-end via `preview_*` tools. All 5 scenes render. Demo sequences auto-play on scroll. Screenshots captured during development showed:
  - Clover Direct split screen with full Luigi's POS ticket and 8% vs 28% comparison rendered correctly
  - SmartDeposit showing "Fully booked. Zero no-shows. 12 of 12 bookings protected by deposit"
  - WeekendCash showing "+$8,420.00 Weekend revenue — landed. ★ BACKED BY FISERV"
  - Closing slide enumerating all 4 kill thresholds + 3 parked items
- **v3 deck**: rendered to PDF via `soffice`, each of the 4 new prototype slides plus the Portfolio Discipline slide visually inspected as individual JPGs. No overflow, no literal escape characters, metric labels tight inside boxes via XML soft breaks.

## File map delta (Phase 5)

**New files**:
```
prototype-5-clover-direct/README.md
prototype-5-clover-direct/docs/PRD-clover-direct.md
prototype-5-clover-direct/docs/PRD-smartdeposit.md
prototype-5-clover-direct/docs/PRD-weekendcash.md
prototype-5-clover-direct/docs/agent-order-translation-spec.md

demo-app/src/pages/CloverCnpShowcasePage.jsx
demo-app/src/components/clovercnp/CloverCnpHero.jsx
demo-app/src/components/clovercnp/CloverDirectScene.jsx
demo-app/src/components/clovercnp/SmartDepositScene.jsx
demo-app/src/components/clovercnp/WeekendCashScene.jsx
demo-app/src/components/clovercnp/CloverCnpClosing.jsx

deliverables/Fiserv_Crypto_Strategy_Investor_Day_v3.pptx
deliverables/clover-cnp/07-phase5-delivery.md (this file)
```

**Modified files**:
```
demo-app/src/App.jsx           # new route /clover-cnp-showcase
deliverables/clover-cnp/00-index.md  # phase 5 status updated
```

## What was intentionally NOT built in Phase 5

Matching the "out of scope" sections in the PRDs, these items stay on the roadmap but don't exist yet:

- Real Mastercard Agent Pay production integration (demo mode only)
- Real ChatGPT / Gemini merchant directory submission — gated on the Option A/B/C decision
- Production Clover Platform API credentials — demo mode only
- Real FIUSD settlement — simulated via the same Finxact-client demo-mode pattern as prototypes 1-4
- Backend FastAPI service for prototype-5-clover-direct — scaffolded in `prototype-5-clover-direct/backend/` directory structure only; the PRDs define the shape, the actual service is Phase 5b work after the directory strategy decision

The cinematic showcase is entirely frontend-only — the backbone pipeline is scripted via `DemoSequence` steps, the same way the existing prototype-1..4 showcase scenes work. This is deliberate: the scene's job is to tell the story at Investor Day, not to stand in for the real integration.

## Related artifacts

- Phase 4 handoff: `deliverables/clover-cnp/06-portfolio-after.md`
- Phase 4 research: `deliverables/clover-cnp/phase4-research-findings.md`
- Original plan: `~/.claude/plans/hashed-greeting-spring.md`
- v2 deck (reference): `~/Downloads/Fiserv_Crypto_Strategy_Investor_Day_v2.pptx`
- v3 deck: `deliverables/Fiserv_Crypto_Strategy_Investor_Day_v3.pptx`
