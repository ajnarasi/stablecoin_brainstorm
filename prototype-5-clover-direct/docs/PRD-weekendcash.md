# PRD — WeekendCash

*Phase 5 reshape of prototype-1 (Merchant Yield Sweep). Horizontal "humanizing act" in the portfolio.*

## Problem

Clover merchants sit on their weekend card revenue until Tuesday. A restaurant closes strong on Saturday night, watches the weekend numbers roll up, and can't touch the cash until the banking week reopens. Services merchants finish their Saturday bookings at 6pm and still pay Monday's payroll from Friday's reserves. This is the most universally-felt SMB cash-flow pain in the portfolio and the least-addressed.

The original prototype-1 aimed this same code stack at the wrong job — "earn yield on idle balances" — which optimized for a metric merchants weren't hiring a product to solve. The reshape pivots the narrative to the job merchants actually feel: **Saturday money, on Saturday.**

## Opportunity

Fiserv already owns the closed loop: **Finxact** as the banking core, **FIUSD** as the stablecoin, **INDX** as the real-time cash settlement platform (live in production as of February 12, 2026). No competitor has this stack. Stripe Instant Payout and Square Instant Transfer both exist, but they charge 1.5-1.75% fees and run through external bank partners. Fiserv can fund the float from Finxact's internal balance sheet via INDX at a cost materially below that and — per the Phase 3 panel consensus — sell the product as "free on weekends, backed by Fiserv."

## JTBD

*"When the weekend's settlement lands on Tuesday afternoon, I want it in my account Saturday morning so I can pay my Sunday prep costs."*

Universally felt across restaurants, services, retail.

## Target customer

- **Any Clover merchant with weekend/holiday card volume**. Effectively all of them, but the value is highest for:
  - Restaurants: Sunday prep costs (produce, protein, linen)
  - Services: Monday payroll
  - Retail: weekend-heavy seasonal merchants

## The product in one sentence

**Your Saturday money, on Saturday. Backed by Fiserv.**

## Regulatory framing (important — differs from the Phase 3 panel's initial concern)

WeekendCash is **post-payment settlement acceleration**, not lending. The customer has already paid via card by the time WeekendCash acts; Fiserv is accelerating the merchant's receipt of already-earned funds. This is structurally identical to Stripe Instant Payout and Square Instant Transfer — both of which are fee-for-service, **not subject to TILA, not lender-licensed**. Stripe uses Celtic Bank; Fiserv doesn't need an external bank partner because Finxact is the bank partner.

Phase 3's TILA concerns were correct for Net-Zero's factoring shape (advance against an unpaid invoice) but do not apply to WeekendCash's post-payment shape. Phase 4 validation report (V5) confirms this.

## Scope — MVP (Phase 5 reshape)

### In scope

1. **Reshape prototype-1's code**:
   - Keep: `shared/finxact-client`, `decision_gate.py`, sweep_service architecture, SQLAlchemy schema, demo-mode fallback pattern
   - Delete: ML outflow predictor, yield-accrual logic, yield position tracker
   - Extend: INDX integration for the float advance, advance/reconcile pattern replacing sweep/unsweep
2. **Advance pattern**: on Friday close-of-business (or configurable merchant cutoff), calculate weekend advance eligibility. Advance via INDX to merchant's Finxact account by Saturday morning.
3. **Reconcile pattern**: card network settlement clears Monday/Tuesday. Fiserv absorbs the float cost; merchant sees nothing.
4. **Merchant-facing dashboard**:
   - "Your Saturday money — landing at 6am Saturday"
   - Historical weekend advances ledger
   - "Backed by Fiserv" explicit visual anchor
5. **Taleb safeguards** — **non-negotiable, hard-wired in code**:
   - **60-minute Fiserv balance-sheet backstop** on any advance that fails to land. Fiserv pays from its own books within 60 minutes, no merchant claim required.
   - **99.9% rolling 30-day SLA auto-pause**: if SLA drops below 99.9% in any rolling 30-day window, the product automatically stops accepting new merchants and acknowledges the pause in the merchant portal.
   - **Conservative 90-day opt-in ramp** for first 90 days: 5% → 25% → 100% volume stair-step.
   - **Public kill threshold**: SLA <99.9% rolling 30-day → auto-pause.

### Out of scope (Phase 5 MVP)

- Yield on FIUSD balances (killed with the original prototype-1 framing)
- Non-weekend settlement acceleration (Stripe/Square parity feature — Phase 6 only if needed)
- Holiday-specific logic beyond treating holidays the same as weekends (Phase 6)
- Merchant-paid variant (default is free; paid tier considered for Phase 6)
- International merchants (US only at MVP)

## Acceptance criteria

| # | Criterion | How we'll know |
|---|---|---|
| 1 | Weekend card volume from Friday 5pm → Sunday 11pm lands in merchant's Finxact account by Saturday 6am | End-to-end demo with simulated weekend volume |
| 2 | Merchant sees "Saturday money" arriving in the dashboard | Demo: dashboard card animates in on Saturday morning |
| 3 | Card network settlement reconciles without merchant visibility | Demo: Monday/Tuesday reconcile runs; merchant sees no change |
| 4 | 60-minute balance-sheet backstop triggers on simulated advance failure | Fault injection: simulate INDX miss → Fiserv backstop engages within 60 min → merchant sees no impact |
| 5 | 99.9% SLA auto-pause triggers on simulated SLA breach | Fault injection: simulate SLA breach → product auto-pauses new merchant onboarding |
| 6 | Conservative ramp enforced for first 90 days | Instrumented: merchant enrollment date drives 5/25/100% eligibility tier |
| 7 | Merchant-visible "Backed by Fiserv" label on the dashboard | Visual: "Backed by Fiserv" badge is the second-most-visible element after "Saturday money" |
| 8 | No consumer sees or handles FIUSD | UX review: FIUSD does not appear in any merchant-facing copy |

## Non-goals

- WeekendCash is **not** a loan, an advance against a receivable, or a cash-advance product. If it ever looks like one in the legal review, the product reshapes or ships.
- WeekendCash does **not** pitch FIUSD to merchants. FIUSD is the rail, not the product.
- WeekendCash does **not** guarantee Monday/Tuesday non-weekend settlement acceleration. That's a Stripe/Square parity feature and not a Fiserv differentiator.

## Metrics

### North star
- **Merchant weekend-to-Saturday settlement success rate**. Target: 99.9% rolling 30-day SLA. Kill threshold: <99.9% → auto-pause.

### Health metrics
- Merchants enrolled (by week)
- Weekend volume advanced (dollars)
- Merchant NPS on WeekendCash (target: >70 — this should be the highest NPS product in the portfolio)
- Merchant retention lift attributable to WeekendCash (target: 3-5pp at 12 months)
- Backstop invocations (target: <1 per rolling 30-day window)

### Fiserv-internal health
- Cost of float (internal, via Finxact balance sheet)
- Float duration (target: <72 hours typical, <96 hours worst case)
- Funding capacity headroom vs. peak weekend volume

## Risks & mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Promised Saturday money fails to land even once | **CATASTROPHIC** (Taleb) | 60-minute balance-sheet backstop. The backstop is not a fallback — it *is* the product feature. "Backed by Fiserv" is the hero marketing line. |
| INDX production SLA slips | HIGH | 99.9% auto-pause hard-wired. INDX is live as of February 2026 but has a short production history. Monitor aggressively. |
| Cost of float exceeds plan | MEDIUM | Finance models the spread at Finxact's cost of capital; product team reviews monthly. Pricing lever (convert to paid tier) exists if economics degrade. |
| Regulatory reclassification (product is inspected and called factoring) | LOW | Post-payment structure documented in Compliance. Stripe/Square precedent cited. Celtic Bank-style fallback architecture available if needed. |
| Merchant over-depends on the feature and is exposed during an outage | MEDIUM | Conservative ramp in first 90 days. Merchant-visible SLA disclosure. |
| "Free on weekends" cannibalizes Square/Stripe feature positioning | LOW (and desired) | The product is supposed to take share. Pricing is a strategic lever. |

## Dependencies

- **INDX in production** ✅ (live February 12, 2026)
- **Finxact internal balance-sheet float authorization** — Fiserv Finance approval required before production launch
- **Taleb safeguards hard-wired** before any merchant enrollment
- **Single cross-BU P&L owner** — shared across portfolio, Drucker carry
- **Rename**: prototype-1 code renamed from "MerchantYieldSweep" to "WeekendCash" before first commit
- **Compliance sign-off** on post-payment settlement-acceleration legal classification

## Open questions

1. **Pricing model**: free for all merchants? Free for first 90 days then paid? Paid at parity with Square (1.75%)? The panel preferred "free, Fiserv-backed" for maximum category definition.
2. **Ramp policy**: is 5/25/100% the right stair-step? Or slower (1/5/25/100%)?
3. **Non-weekend expansion**: if WeekendCash wins, how quickly do we add Monday-through-Friday instant payout? Does that make the product a me-too vs. Square/Stripe?
4. **Naming**: the Phase 3 panel accepted "WeekendCash"; Doumont preferred "SaturdayCash" for day-of-week specificity. Decision gate before first commit.
5. **International**: launch US-only. When does international come? Gates on Finxact international readiness.
