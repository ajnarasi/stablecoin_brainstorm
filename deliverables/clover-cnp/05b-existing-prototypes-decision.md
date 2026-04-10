# Phase 4 — Retain / Reshape / Retire Decisions for Existing Prototypes

*Final decisions on the 4 shipped prototypes (Track C), carrying the Phase 3 panel verdicts through the Phase 4 validation work (including the user-demanded pushback challenges). These decisions feed directly into the Phase 5 build scope.*

## Summary table

| Prototype | Decision | New positioning (if reshape) | Code disposition | Workstream status |
|---|---|---|---|---|
| **prototype-1** Merchant Yield Sweep | **RESHAPE** | → **WeekendCash** (or SaturdayCash) — post-payment settlement acceleration on weekends/holidays via FIUSD + INDX rail | Keep Finxact-client, decision-gate service, SQLAlchemy schema; delete yield-accrual / ML yield predictor; extend with INDX integration | IN PORTFOLIO |
| **prototype-2** Pay-by-Agent x402 | **RESHAPE** | → **Clover Agent Checkout backbone** — the payment + Agent Order Translation Layer underneath Clover Direct and SmartDeposit | Keep Gateway/Verifier/Settler scaffolding and Agent SDK interface; re-target customer from enterprise devs to Clover merchants; build Agent Order Translation Layer on top of Clover Platform API; constrain Claude demo agent | IN PORTFOLIO (upgraded to load-bearing) |
| **prototype-3** Instant Supplier Pay | **RETIRE from workstream** | N/A | Extract ML depletion predictor to `/shared/ml-predictors/`; archive rest of code under `deliverables/archive/prototype-3-supplier-pay/` with RETIRED.md explaining rationale | REMOVED from Clover-CNP portfolio. Park as potential Commerce Hub B2B side-bet under separate program. |
| **prototype-4** Cross-Border Instant Settlement | **RETIRE from workstream** | N/A | Move out of Clover-CNP workstream ownership; retain as CommerceHub enterprise asset in a separate program. Keep shared `finxact-client` dependency intact. | REMOVED from Clover-CNP portfolio. Retained as CommerceHub asset. |

---

## prototype-1 → WeekendCash (reshape)

**Decision**: **RESHAPE.** 9-0 panel consensus in Phase 3. Phase 4 validation strengthened the reshape by confirming:
- Fiserv INDX went live in production on February 12, 2026 — the rail is real.
- WeekendCash is regulatorily clean as post-payment settlement acceleration (Stripe Instant Payout / Square Instant Transfer precedent). Phase 3 TILA concerns downgraded.
- Finxact internal balance-sheet funding is a genuine Fiserv-unique asset with no Square/Stripe equivalent.

**New target customer**: Any Clover merchant with weekend/holiday card volume. Primary beachheads: restaurants (Sunday prep cash needs) and services (Monday payroll).

**New value proposition**: *"Your Saturday money, on Saturday. Backed by Fiserv."*

**New mechanic** (2026-credible, no new consumer-side dependencies):
- Weekend/holiday card-funded Clover transactions settle through the normal flow.
- Fiserv's Finxact float advances the equivalent amount via INDX to the merchant's Finxact account on the same day (Saturday morning for Friday evening transactions; Sunday/Monday for weekend volume).
- Reconciliation happens Monday/Tuesday when card network settlement clears. Fiserv absorbs the float cost.
- Merchant sees: "money in my account on Saturday." Customer sees nothing different. No stablecoin in the customer-facing narrative.

**Code reuse from prototype-1**:
- ✅ `finxact-client` (shared) — keep, extend with INDX integration
- ✅ `decision_gate.py` — keep, repurpose to validate same-day advance eligibility
- ✅ `sweep_service.py` — keep architecture, rewrite orchestration for advance/reconcile pattern instead of sweep/unsweep
- ✅ SQLAlchemy schema — keep merchant/transaction entities
- ❌ ML outflow predictor — delete (wrong use case for new shape)
- ❌ Yield position tracker — delete (not applicable)
- ❌ Yield-accrual logic — delete (not applicable)
- ✅ Demo-mode fallback pattern — keep

**Mandatory Taleb safeguards** (non-negotiable, hard-wired in code before Phase 5 ships):
1. **60-minute Fiserv balance-sheet backstop** on any WeekendCash advance that fails to land. Fiserv pays from its own books, no merchant claim required.
2. **99.9% SLA auto-pause**: if rolling 30-day SLA drops below 99.9%, the product automatically stops accepting new merchants until investigation + restoration.
3. **Conservative 90-day opt-in ramp**: first 90 days, opt-in only, with a 5-25-100% volume stair-step.
4. **Public kill threshold**: if SLA <99.9% in any rolling 30-day window → auto-pause, acknowledged publicly in the merchant portal.

**Rename**: "Merchant Yield Sweep" → **WeekendCash** (panel accepted). Doumont preferred "SaturdayCash" for day-of-week specificity. **Decision for Phase 5 planning**: pick one before the first code rename commit; I'd lean SaturdayCash if there's no existing Fiserv brand conflict.

**P&L owner**: Must be named before Phase 5 starts (Drucker non-negotiable across all portfolio items).

---

## prototype-2 → Clover Agent Checkout backbone (reshape)

**Decision**: **RESHAPE.** 9-0 panel consensus in Phase 3, with the role significantly upgraded in Phase 4 validation.

**Upgrade from Phase 3 to Phase 4**: The Phase 3 panel framed prototype-2 as "the rail Clover Direct and SmartDeposit run on." Phase 4 evidence (V2 finding on Clover integration depth) established that the Fiserv-Mastercard Agent Pay integration operates at the acceptance/tokenization layer, **not** at the Clover order-context layer. That means Phase 5 needs an **Agent Order Translation Layer** that sits between agent-layer protocols (ACP, AP2, Mastercard Agent Pay payloads) and Clover's Platform API order structure. Prototype-2 is the natural home for this work, and it becomes the single most load-bearing piece of infrastructure in the Clover-CNP portfolio.

**New target customer**: Clover merchants (restaurants + services), with the "developer" role being Fiserv/Clover's internal teams building Clover Direct + SmartDeposit on top of this backbone. The original "enterprise API developer" customer is retired.

**New value proposition**: *"One backbone. Every Clover merchant becomes agent-payable and agent-orderable without changing their POS."*

**New mechanic**:
- **Gateway**: receives agent-originated payment intents via multiple agentic protocols (Mastercard Agent Pay as primary, ACP and AP2 as protocol adapters). Generalizes beyond just x402.
- **Verifier**: validates agent identity, spending guardrails, Fiserv tokenization. Upgrades from EIP-3009-only to protocol-multi-homed.
- **Agent Order Translation Layer** (NEW): converts agent intent payloads (product, modifiers, tip, delivery) into Clover Platform API order-creation calls. Handles menu/catalog mapping, tax, service charges, tip allocation.
- **Settler**: execution layer. Can settle cards directly via Clover's normal acceptance flow; settlement acceleration via WeekendCash rails available as a merchant option.
- **Agent SDK**: TypeScript library for the Clover Direct demo agent (Claude-based, constrained, scripted — scope cuts from prior spec panel stand).

**Code reuse from prototype-2**:
- ✅ Gateway (rewrite protocol adapters)
- ✅ Verifier (extend for Mastercard Agent Pay token verification + Fiserv guardrails)
- ✅ Settler (rewire to Clover acceptance flow, FIUSD-optional on back end)
- ✅ Agent SDK TypeScript interface
- ✅ Demo agent scaffolding (constrained Claude agent, hardcoded catalog, scripted scenario — prior spec panel recommendations)
- 🆕 **Agent Order Translation Layer** (new build; no Phase 3 prototype for this)
- 🆕 **Clover Platform API integration module** (new build)

**Rename**: "Pay-by-Agent x402" → **Clover Agent Checkout** (or similar). Doumont's point: every use of the old name from Phase 5 onward is a delay in clarity. Rename in code, docs, and demo copy before first Phase 5 commit.

**Phase 5 prerequisites**:
- AI-lab partnership (Anthropic or OpenAI) for the Clover Direct demo agent — Drucker carry.
- Single P&L owner named.
- Local Solana validator (if Solana settlement is retained at all — Phase 5 may retire Solana from the scope now that Mastercard Agent Pay is the primary path).
- Scope cuts: TypeScript only, single agentic protocol primary (Mastercard Agent Pay), demo-mode fallbacks for every external call.

---

## prototype-3 Instant Supplier Pay — RETIRE from workstream

**Decision**: **RETIRE.** 9-0 panel consensus in Phase 3. Phase 4 flip-the-arrow challenge (user pushback) also concluded retire — the flipped shape collapses into SmartDeposit.

**Rationale**:
- **JTBD fit**: Supplier Pay serves a B2B job (restaurant pays its suppliers). The Clover-CNP workstream is CNP-facing. Wrong program.
- **Cannibalization**: Moving restaurant B2B payments from card to FIUSD cost Fiserv $1,000-1,500/month per $50K/month merchant in lost interchange. Unit economics never modeled against FIUSD fee share.
- **Distributor dependency**: Needs Sysco/US Foods buy-in for the full addressable market. No outreach done. Drucker's "call before building" unanswered.
- **Flip-the-arrow test** (Phase 4, V8): Repositioning as customer-side catering deposits collapses into SmartDeposit. Catering is a workflow-software market (Caterease, Tripleseat), not a payments market. No distinct Fiserv product opportunity.

**Code disposition**:
- ✅ **Extract ML depletion predictor to `/shared/ml-predictors/`** — this is a reusable utility Fiserv doesn't have another instance of. Preserve even though the prototype retires.
- ✅ **Supplier catalog schema** — preserve as optional plug-in for SmartDeposit catering in case there's a future need for supplier-side integration.
- 🗄️ **Archive** the rest: `deliverables/archive/prototype-3-supplier-pay/` with a `RETIRED.md` explaining (a) the original thesis, (b) why it was retired from the Clover-CNP workstream, (c) the open questions (Sysco/US Foods buy-in, unit economics) that would need answers if it's ever revived, and (d) which code assets were preserved vs archived.

**Park status**: Prototype-3 is **not dead** — it's parked. If Fiserv wants to pursue a Commerce Hub B2B program in 2026 or 2027, the prototype is an asset to that program. But it is not in scope for Clover-CNP, it is not on the Clover-CNP Investor Day slide, and it does not consume Phase 5 engineering time.

**Investor Day treatment**: Move to the "explored and parked" slide alongside Clover Net-Zero in the synthesis narrative arc. The via-negativa discipline is the message.

---

## prototype-4 Cross-Border Instant Settlement — RETIRE from workstream

**Decision**: **RETIRE from the Clover-CNP workstream. RETAIN as a CommerceHub enterprise asset in a separate program.** 9-0 panel consensus in Phase 3, reinforced by Phase 4 evidence.

**Rationale**:
- **Customer fit**: Prototype-4 was built for CommerceHub enterprise merchants with predictable cross-border volume, not Clover SMBs.
- **Phase 4 pushback (V9) result**: No publicly available data supports a larger-than-5% Clover SMB cross-border share. The challenge failed to overturn the retirement.
- **Phase 4 new evidence**: **Mastercard acquired BVNK for $1.8B in 2026.** This gives Mastercard a stablecoin cross-border settlement capability across 130+ countries at the network level. Fiserv's original differentiator for prototype-4 ("embedded cross-border settlement in the acquiring platform") is obsoleted — every Mastercard-acquiring platform now has access to this through the network.
- **Competitive density**: Stripe Bridge ($1.1B acquisition), Mastercard BVNK ($1.8B acquisition), Wise, Revolut, Airwallex. SMB cross-border is a crowded red ocean. Fiserv's remaining differentiation lives only at the CommerceHub-enterprise-embedded level.

**Code disposition**:
- ✅ **Keep prototype-4 folder intact in its current location** (don't archive); it's still a useful CommerceHub asset.
- ✅ **Preserve `finxact-client` shared dependency** unchanged.
- ✅ **Remove from Clover-CNP Investor Day narrative**.
- ✅ **Transfer workstream ownership** to whoever leads CommerceHub enterprise products (organizational decision, not a code change).

**Investor Day treatment**: Show on the "explored and parked" / via-negativa slide as part of the discipline story.

---

## Net portfolio composition after Phase 4

### In Clover-CNP portfolio for Phase 5 build:

1. **Clover Direct** (new, merged hero product) — discovery + acceptance for AI-agent-driven restaurant and services traffic
2. **SmartDeposit** (new, merged hero product, may fold into Clover Direct brand) — enforceable deposits for services and catering
3. **WeekendCash** (reshape of prototype-1) — post-payment settlement acceleration on weekends/holidays
4. **Clover Agent Checkout backbone** (reshape of prototype-2) — load-bearing infrastructure: Gateway + Verifier + Settler + **Agent Order Translation Layer** + Agent SDK

Net engineering scope: 2 new hero products + 2 reshapes with significant extension. The Agent Order Translation Layer is new build on top of prototype-2, not just a rename of existing code.

### Killed / retired from this workstream:

- **Clover Net-Zero** (new) — killed as standalone; features folded into Clover Direct + SmartDeposit
- **prototype-3 Instant Supplier Pay** — retired; ML predictor preserved in `/shared/`; rest archived
- **prototype-4 Cross-Border** — retired from Clover-CNP; retained as CommerceHub asset
- Cross-border / marketplace-tax / agentic commerce topics that collapse into one of the survivors — absorbed

### Portfolio-level decisions carried to Phase 5:

1. **Single P&L owner before build kickoff** (Drucker)
2. **Clover Merchant Directory strategy** — build, license Shopify Agentic Plan, or per-platform direct (the single biggest open architectural decision)
3. **AI-lab demo partnership** for Clover Direct (Anthropic or OpenAI)
4. **Rename everything** before first Phase 5 commit
5. **Extract ML depletion predictor** from retiring prototype-3 to `/shared/`
6. **WeekendCash safeguards hard-wired** (Taleb's non-negotiables)
7. **Hold SmartDeposit dispute-defense pitch** out of hero copy until measured
