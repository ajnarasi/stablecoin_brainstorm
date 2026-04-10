# Phase 6 — Delivery

*Re-expand the Clover-CNP portfolio from 4 to 6 products, de-phase the mock demo, and ship a presenter-ready v4 deck with talking points and script on every slide.*

## Why this happened

Phase 5 shipped with prototype-3 Supplier Pay and prototype-4 Cross-Border explicitly retired from the Clover-CNP workstream — Phase 4 panel verdicts had deemed them "B2B, not CNP" and "CommerceHub enterprise, not Clover SMB" respectively. In Phase 6 the user reversed both retirements and asked for reshape positioning that fits the Clover-CNP narrative, along with de-phasing the mock demo (the narrative is no longer "Phase 5 — Clover CNP Growth", it's just "the Clover CNP Portfolio") and a new v4 deck with speaker notes on every slide.

## Positioning rationale

### SupplierCash (reshape of prototype-3 Supplier Pay)

**Original Phase 4 verdict**: Retire — "B2B, not CNP. Parked as potential Commerce Hub B2B side-bet."

**Phase 6 reframe**: **Outflow-side companion to WeekendCash.** WeekendCash gives a Clover merchant their weekend money on Saturday morning (inflow acceleration). SupplierCash captures the other side of the ledger: $1,200/month in eliminated card interchange + early-pay discounts on supplier payments (outflow savings). Same merchant, same Finxact + INDX rails, both sides of the cash cycle.

**Why it belongs in the CNP portfolio even though it's not CNP revenue**: it's a **retention play**. Every dollar of margin Clover preserves on the supplier side makes the CNP pitch stickier. A merchant who gets Saturday-morning weekend money AND $1,200/month in supplier savings is not going to churn to Toast over a feature-parity fight on online ordering — the cash-cycle story is a moat. The narrative connection to CNP is indirect but real: merchant retention extends the lifetime over which the core CNP products (Clover Direct, SmartDeposit) can run.

**Kill threshold**: < $800/month average captured discount per enrolled merchant → product retires. If the math doesn't clear that bar, the retention argument collapses and we don't ship.

### International Lane (reshape of prototype-4 Cross-Border)

**Original Phase 4 verdict**: Retire from workstream — "CommerceHub enterprise, not Clover SMB. Mastercard BVNK acquisition obsoleted the differentiator. Retain as CommerceHub asset only."

**Phase 6 reframe**: **Silent companion capability of Clover Agent Checkout Backbone.** The insight that unlocks this reshape: when a ChatGPT user in Mexico City orders from Luigi's Pizzeria in NYC, that transaction is *already agentic* AND *already cross-border*. Every Clover Direct merchant who accepts an international agent order IS, by definition, a Clover SMB cross-border merchant — the Phase 4 panel's "wrong customer" critique was too categorical.

**Why it belongs as a feature rather than a standalone product**: it rides the same Clover Agent Checkout Backbone rails as Clover Direct. The backbone inspects the currency field on every incoming agent intent; when it's non-USD, International Lane auto-converts via FIUSD on Solana, OFAC screens, and settles the merchant via INDX. Silent to the merchant. Silent to the agent. No new product, no new integration, no new sales motion. When Clover Direct ships, International Lane ships with it.

**Kill threshold**: < 2% of Clover Direct order flow is cross-border → capability stays silent (never marketed as a separate product). The feature remains live on the backbone but doesn't get dedicated GTM attention.

**Addressing the BVNK concern**: Mastercard acquired BVNK for $1.8B in 2026, giving Mastercard network-level cross-border stablecoin rails. Phase 4 read this as "Fiserv's differentiator obsoleted." Phase 6 reads it differently: Mastercard's bet **validates** the stablecoin cross-border thesis, and Fiserv's unique edge isn't the rail itself — it's the *integration into Clover merchant POS flow* which Mastercard can't replicate without buying an acquirer. The differentiator shifted from "we have stablecoin rails" to "we have stablecoin rails embedded in the merchant checkout flow."

## What shipped

### 1. Cinematic showcase — 7 scenes

Two new scenes added to `/clover-cnp-showcase`, Phase 5 label removed, closing slide updated.

**Edits**:
- `demo-app/src/components/clovercnp/CloverCnpHero.jsx` — removed the `<p>Phase 5 — Clover CNP Growth</p>` element entirely. The scene now opens directly on the "Clover is card-present heavy" headline.
- `demo-app/src/components/clovercnp/CloverCnpClosing.jsx` — in-scope label changed from "In scope — Phase 5 build" → "In scope — build portfolio". In-scope list extended from 4 rows to 6 (added SupplierCash and International Lane with their kill thresholds). Parked list reduced from 3 rows to 1 (prototype-3 and prototype-4 removed; only Clover Net-Zero remains as the on-the-record kill).
- `demo-app/src/pages/CloverCnpShowcasePage.jsx` — imports for SupplierPayScene + CrossBorderScene added. `SECTION_IDS` extended from 5 → 7 entries. `SECTION_LABELS` extended to match. Two new scene components rendered between `<WeekendCashScene />` and `<CloverCnpClosing />`.

**New files**:
- `demo-app/src/components/clovercnp/SupplierPayScene.jsx` — inventory grid + AI procurement pipeline + Finxact B2B FIUSD settlement. Hero framing: "WeekendCash gives Luigi his Saturday money on Saturday. SupplierCash saves him $1,200 every month on the other side of his ledger." Result metric: "$1,200/month saved". Retention-play panel at the bottom explains the CNP connection explicitly: "Not CNP revenue. Every dollar Clover preserves on the supplier side makes the CNP pitch stickier."
- `demo-app/src/components/clovercnp/CrossBorderScene.jsx` — pipeline on the left (agent order → currency detection → FX lock → FIUSD conversion → INDX settlement), side-by-side cost comparison on the right (traditional card rails $60 total vs International Lane $5 total). Hero framing: "A ChatGPT user in Mexico City orders from Luigi's in NYC. That transaction is already agentic. And it's already cross-border." Same-backbone callout at the bottom: "No new product. No new integration. Lives inside Clover Agent Checkout Backbone. When Clover Direct ships, International Lane ships with it."

**Showcase order** (7 scenes total):
1. CloverCnpHero — The Asymmetry
2. CloverDirectScene — Clover Direct
3. SmartDepositScene — SmartDeposit
4. WeekendCashScene — WeekendCash
5. **SupplierPayScene — SupplierCash** (new)
6. **CrossBorderScene — International Lane** (new)
7. CloverCnpClosing — Portfolio Discipline (now showing 6 in-scope products)

### 2. v4 Investor Day deck

**File**: `deliverables/Fiserv_Crypto_Strategy_Investor_Day_v4.pptx`

23 slides (v3 was 21). Built by `/tmp/build_v4_deck.py` starting from the v2 source (not v3 — keeps reproducibility clean). All v3 transformations applied, plus two new prototype slides duplicated via XML-level `duplicate_slide()` + `move_slide()` to produce the correct order.

**Slide structure**:

| # | Slide | Change from v3 |
|---|---|---|
| 1 | Title | Unchanged. **Notes added.** |
| 2 | Strategic Recommendation | **Extended**: Portfolio column grows from 4 to 6 products (bullets cloned with paragraph XML to preserve font formatting). Parked list shrinks to just Clover Net-Zero. Recommendation copy updated. **Notes added.** |
| 3-15 | Market / competitive / infrastructure / stack / flywheel / architecture / partners / security / scoring / gap / build-vs-implement / one-software-update / blue-ocean | Unchanged content. **Notes added on every slide.** |
| 16 | Clover Direct (P1) | Unchanged. **Notes added.** |
| 17 | SmartDeposit (P2) | Unchanged. **Notes added.** |
| 18 | WeekendCash (P3) | Unchanged. **Notes added.** |
| 19 | Clover Agent Checkout Backbone (P4) | Unchanged. **Notes added.** |
| **20** | **SupplierCash (P5)** | **NEW slide** — duplicated from slide 16 (Clover Direct template), then content rewritten via `update_prototype_slide()`. Moved into position via `move_slide()`. |
| **21** | **International Lane (P6)** | **NEW slide** — same duplication + reorder approach. |
| 22 | Portfolio Discipline & Kill Thresholds | **Extended**: in-scope list grows from 4 to 6 products. Parked list reduced to Net-Zero only. Label changed to "IN SCOPE — BUILD PORTFOLIO". **Notes added.** |
| 23 | Closing quote | Unchanged. **Notes added.** |

**Speaker notes format** — every slide has a notes block in this shape:
```
TALKING POINTS
• 3-5 bullets the presenter can skim during delivery
• Short, one idea per bullet

SCRIPT
2-4 sentences of narration the presenter can read
verbatim if they need to. Written as spoken English,
not bullet fragments.
```

Notes length by slide (all in characters):
```
 1. 557   2. 759   3. 711   4. 767   5. 795   6. 683
 7. 741   8. 907   9. 779  10. 603  11. 632  12. 834
13. 939  14. 727  15. 914  16. 1133 17. 1017 18. 1048
19. 934  20. 1156 21. 1287 22. 764  23. 709
```
Every slide > 557 chars, well above the 300-char verification threshold. The two new prototype slides (20, 21) are the longest at 1156 and 1287 chars, reflecting the additional context needed to explain the reshape rationale.

### 3. Build script

**File**: `/tmp/build_v4_deck.py` (ephemeral, not committed but documented here for reproducibility).

Extends `/tmp/build_v3_deck.py` with:
- **`duplicate_slide(pres, src_slide)`** — XML-level deep copy of a source slide's shape tree into a new slide created via `add_slide(src_slide.slide_layout)`. Used to clone slide 16 (Clover Direct) as the template for the two new prototype slides.
- **`move_slide(pres, from_idx, to_idx)`** — reorders `_sldIdLst` elements to put the new slides in positions 20 and 21 (after Clover Agent Checkout Backbone, before Portfolio Discipline). The script does two moves: first pulls SupplierCash from position 21 → 19, then pulls International Lane from position 22 → 20, producing the final order.
- **Extended `set_multiline`** — when called with more lines than existing paragraphs, it now **clones the XML of the last existing paragraph** (`deepcopy(paras[-1]._p)`) to manufacture additional paragraphs that preserve the source's paragraph properties, run properties, bullet styling, and font size. This was required for slide 2's Portfolio column, where extending 4 bullets to 6 previously produced 2 oversized-font bullets.
- **`PRODUCTS` list** grows from 4 to 6, adding `SupplierCash` and `International Lane` content blocks with problem/solution/steps/metrics/closing fields matching the existing shape.
- **`NOTES_BY_SLIDE` dict** — 23 entries with `_notes(talking_points_list, script_paragraph)` formatted as "TALKING POINTS / SCRIPT".
- **`apply_notes(pres)`** — iterates slides and writes `slide.notes_slide.notes_text_frame.text = NOTES_BY_SLIDE[slide_num]`.
- **`update_strategic_recommendation`** updated to emit the 6-bullet portfolio column, shortened parked column, and revised recommendation footer.
- **`update_risk_slide`** updated to emit the 6-product in-scope list and single-item parked list.

## Inline PRDs for the two new products

### SupplierCash — PRD

- **Problem**: Clover restaurants place 15-30 supply orders/week at 2-3% interchange and leave 2% early-pay discounts unclaimed because settlement takes 2-5 days. On $50K/month supply spend that's $1,000-1,500 of lost margin every month.
- **Solution**: AI procurement agent monitors ingredient depletion from Clover POS sales data, auto-generates POs grouped by supplier, pays via FIUSD through Finxact. Supplier receives USD via INDX in 2.7 seconds. Discount captured. Card interchange eliminated.
- **JTBD**: "When I pay my suppliers, I want the money to move without card fees and I want to capture every early-pay discount the supplier offers — not just the ones I happen to remember."
- **Customer**: Clover restaurant merchants with $10K+ monthly supply spend (the higher the spend, the more valuable the product). Beachhead: independents and small chains (2-10 locations).
- **FIUSD/agent mechanic**: AI agent (the procurement bot) initiates B2B FIUSD transfers through Finxact. Supplier side can accept FIUSD directly if they're on Finxact, or receive USD via INDX if not. Early-pay discount math is computed from supplier terms stored against the merchant profile.
- **Success metrics**: Average captured discount per enrolled merchant per month. Target: $1,200/mo.
- **Kill threshold**: < $800/mo average captured discount per enrolled merchant → product retires. Three months of data below that line and we shut it down.
- **Dependencies**: Finxact B2B transfer API, INDX for USD settlement on the supplier side, merchant BOM mapping (30 days of sales data minimum), supplier terms database.
- **Open questions**: Phase 4 Drucker carry — no outreach to Sysco/US Foods yet. Needs to happen before production ship. Fallback: small regional distributors as beachhead.

### International Lane — PRD

- **Problem**: Cross-border card processing costs 3-5% in fees plus 2-4% FX markup. Settlement takes T+3 through 4 intermediaries. A $1,000 MXN→USD order costs the merchant $47-60 in fees. $6.3T cross-border e-commerce market is underserved for SMB.
- **Solution**: Clover Agent Checkout Backbone auto-detects currency mismatch on incoming agent orders, locks FX for 30 seconds, converts to FIUSD on Solana, OFAC + GENIUS Act compliance screens, INDX converts FIUSD → USD → merchant's Finxact account in 3 seconds.
- **JTBD**: "When a customer in another country pays me, I want to receive USD in my bank account the same day, at a reasonable fee, without learning anything new."
- **Customer**: Every Clover Direct merchant (implicit). Not marketed as a standalone product; merchants experience it as "orders from abroad settle the same day at no extra cost."
- **FIUSD/agent mechanic**: Agent intent payload carries the buyer's currency. Clover Agent Checkout Backbone's Gateway branches on that field: USD orders go through the normal path, non-USD orders drop into International Lane for FX conversion via Solana → FIUSD → INDX → USD.
- **Success metrics**: % of Clover Direct order flow that is cross-border. Per-order cost savings vs traditional card rails ($55 per $1,000 target). Settlement time (target: <5 sec end-to-end).
- **Kill threshold**: < 2% of Clover Direct flow is cross-border over a 90-day window → capability stays silent (lives on the backbone but gets no GTM attention).
- **Dependencies**: Clover Agent Checkout Backbone Gateway + Agent Order Translation Layer, FX rate source (BVNK-style or equivalent), OFAC screening service, INDX USD settlement.
- **Open questions**: Which FX rate provider? BVNK now belongs to Mastercard — either consume the Mastercard network rate or contract with a second provider for redundancy. Compliance review for the GENIUS Act trigger on merchant-acquirer cross-border flows.

## File map delta (Phase 6)

**New files**:
```
demo-app/src/components/clovercnp/SupplierPayScene.jsx
demo-app/src/components/clovercnp/CrossBorderScene.jsx
deliverables/Fiserv_Crypto_Strategy_Investor_Day_v4.pptx
deliverables/clover-cnp/08-phase6-delivery.md (this file)
/tmp/build_v4_deck.py (build script, ephemeral — documented in this file for reproducibility)
```

**Modified files**:
```
demo-app/src/components/clovercnp/CloverCnpHero.jsx      # removed Phase 5 tag
demo-app/src/components/clovercnp/CloverCnpClosing.jsx   # +2 in-scope rows, -2 parked rows, label change
demo-app/src/pages/CloverCnpShowcasePage.jsx             # +2 imports, +2 sections, +2 scene components
deliverables/clover-cnp/00-index.md                      # +1 row for Phase 6 delivery
```

**Unchanged by design**:
- All v3 Phase 5 deliverables (PRDs, portfolio-after doc, research findings) remain valid. The Phase 4 verdict reversal is a user-directed scope change, not a new finding that invalidates prior analysis.
- v3 deck stays on disk as a historical reference.
- `prototype-5-clover-direct/` folder and its PRDs are not touched — the SupplierCash and International Lane PRDs live inline in this delivery doc since they're code reshapes rather than new prototypes.

## Verification evidence

1. **Showcase renders end-to-end** ✅
   - Confirmed 7 sections found by DOM query (`cnp-hero`, `clover-direct`, `smart-deposit`, `weekend-cash`, `supplier-cash`, `international-lane`, `cnp-closing`)
   - 7 progress dots render in the side nav
   - Hero scene contains no "Phase 5" text (verified via `.innerText` check)
   - SupplierCash scene: 6 DemoSequence steps completed, fade-in panel shows "ROLLING 30 DAYS / +$1,247.30 captured"
   - International Lane scene: 6 steps completed, side-by-side comparison panel renders (traditional $60 vs International Lane $5, "Luigi saves $55 on this order • 91.7% reduction")
   - Closing scene: 6 in-scope rows (Clover Direct, SmartDeposit, WeekendCash, Clover Agent Checkout backbone, SupplierCash, International Lane) and only Clover Net-Zero in parked list
2. **v4 deck builds + renders** ✅
   - `python3 /tmp/build_v4_deck.py` produces 23-slide deck without errors
   - PDF conversion via `soffice --headless` successful
   - Slides 20, 21 visually match v3 prototype-slide style (title + problem + solution + 5 steps + 4-metric impact row + closing, no overflow, soft-break metric labels)
   - Slide 22 (Portfolio Discipline): 6 in-scope products, 1 parked (Net-Zero)
   - Slide 2 (Strategic Recommendation): 6-bullet Portfolio column with consistent font formatting (fixed the clone-XML regression), Parked column shortened, recommendation footer updated
3. **Speaker notes land in PowerPoint** ✅
   - Every slide has notes > 557 characters
   - All notes follow the "TALKING POINTS ... SCRIPT" format
   - Prototype slides (16-21) are the longest at 934-1287 chars, reflecting richer narration
4. **Delivery doc + index consistency** ✅ (this file + index update)

## Open items rolled forward from Phase 5

The seven Phase 5 prerequisites in `06-portfolio-after.md` all still apply. None of them were resolved by Phase 6 — this was a scope change, not a gate-clearing exercise:

1. **Single cross-BU P&L owner** — Drucker's non-negotiable, still unnamed. With 6 products instead of 4, this becomes MORE urgent, not less.
2. **Clover Merchant Directory strategy** — Option A (build native) / B (license Shopify Agentic Plan) / C (per-platform direct). Still open.
3. **AI-lab demo partnership** (Anthropic or OpenAI) — still needed for the Investor Day Clover Direct demo.
4. **WeekendCash safeguards hard-wired** — 60-min backstop, 99.9% auto-pause, 90-day ramp. Still applies.
5. **SmartDeposit dispute-defense claim** — still held until 6 months of data.
6. **Rename everything** before first production commit — "Pay-by-Agent x402" → "Clover Agent Checkout", "Merchant Yield Sweep" → "WeekendCash", "Instant Supplier Pay" → "SupplierCash", "Cross-Border Instant Settlement" → "International Lane". Now 4 renames needed instead of 2.
7. **Investor Day timing** — determines whether scope cuts are needed. With 6 products on the hook instead of 4, this tightens.

**New Phase 6 prerequisite**: unit economics review for SupplierCash. The kill threshold of $800/mo average captured discount needs a sanity check against realistic merchant supply spend distribution. If the median Clover restaurant only spends $30K/mo on supplies, the 2% early-pay discount caps out at $600/mo and the kill threshold is unachievable by construction. Phase 6 build should instrument real merchant spend data before marketing the product.

## How to regenerate

```bash
# Regenerate v4 deck from v2 source
python3 /tmp/build_v4_deck.py

# Convert to PDF
soffice --headless --convert-to pdf \
  deliverables/Fiserv_Crypto_Strategy_Investor_Day_v4.pptx \
  --outdir /tmp/

# Render individual slides
pdftoppm -jpeg -r 100 /tmp/Fiserv_Crypto_Strategy_Investor_Day_v4.pdf /tmp/v4slide

# Run the showcase
cd demo-app && npm run dev
# open http://localhost:3000/clover-cnp-showcase
```
