# Portfolio State — End of Phase 4

*This is the handoff doc for Phase 5. The strategy work (Phases 1-4) is complete; the build work (Phase 5) is deferred for user-driven execution. This file captures the portfolio state, open decisions, and Phase 5 entry conditions so a new reader can pick up where we stopped without re-reading 9 other docs.*

## What this workstream is

**North star**: Grow Clover merchants' e-commerce / card-not-present (CNP) share using FIUSD + agentic commerce.

**Why now**: Fiserv integrated Mastercard Agent Pay into Clover in December 2025 — an asymmetric asset neither Toast nor Square has. Clover can't catch up on conventional CNP product (Toast owns restaurants, Shopify owns retail), but it can leapfrog on agentic rails if it moves fast.

**Focal segments**: Restaurants (QSR/FSR) + services (beauty, home, professional). Specialty retail is a watch.

## The portfolio as of 2026-04-09

### In the Clover-CNP portfolio (GREEN for Phase 5)

| Product | Type | Status | Why it's here |
|---|---|---|---|
| **Clover Direct** | New hero product | Product-shape revised in Phase 4 | Every Clover restaurant discoverable + payable by every major AI agent. Lead product. Asymmetric on Mastercard Agent Pay integration. |
| **SmartDeposit** | New hero product (may fold brand into Clover Direct) | GREEN, dispute-claim held back | One-click enforceable deposits for services + restaurant catering. Same JTBD pattern across both verticals. |
| **WeekendCash** (reshape of prototype-1) | Reshape | GREEN unconditional | Post-payment settlement acceleration on weekends/holidays via Finxact + INDX. Clean non-lender precedent. "Saturday money on Saturday, backed by Fiserv." |
| **Clover Agent Checkout backbone** (reshape of prototype-2) | Reshape, load-bearing | GREEN, upgraded role | Gateway + Verifier + Settler + **new Agent Order Translation Layer** + Agent SDK. The rail Clover Direct and SmartDeposit both run on. |

### Killed / retired from this workstream

| Item | Status | Disposition |
|---|---|---|
| **Clover Net-Zero** | KILL as standalone | Settlement-speed feature folds into Clover Direct + SmartDeposit. Name dead. |
| **prototype-3 Instant Supplier Pay** | RETIRE from workstream | Extract ML depletion predictor to `/shared/ml-predictors/`. Archive rest under `deliverables/archive/prototype-3-supplier-pay/` with RETIRED.md. Park as potential separate Commerce Hub B2B side-bet. |
| **prototype-4 Cross-Border** | RETIRE from workstream | Retain as CommerceHub enterprise asset in a separate program. Mastercard BVNK acquisition obsoleted the differentiator. |

### The rationale for each kill/retirement

- **Net-Zero**: Non-lender shape exists but Stripe/Square/QuickBooks Invoicing already offer it. Competitive parity, not TILA risk. Kill as standalone; fold the capability.
- **Supplier Pay**: B2B, not CNP. Flip-the-arrow catering shape collapses into SmartDeposit. Real product, wrong workstream.
- **Cross-Border**: CommerceHub enterprise product, not Clover SMB product. Mastercard BVNK acquisition ($1.8B, 2026) means every Mastercard-acquiring platform has network-level cross-border stablecoin settlement; Fiserv's "embedded in CommerceHub" wedge is obsoleted.

## Phase 5 prerequisites (must be satisfied before build starts)

These are the gates. No Phase 5 code should ship until they're answered.

1. **Single cross-BU P&L owner named** for the Clover-CNP portfolio. Drucker's non-negotiable, repeated on every candidate. Real name, not an org.
2. **Clover Merchant Directory strategy decided** — the single biggest open architectural decision:
   - **Option A**: Build a native Clover Merchant Directory syndicated to ChatGPT, Gemini, Perplexity, Apple Intelligence, Copilot. Maximum control, slowest.
   - **Option B**: License Shopify's Agentic Plan (available to non-Shopify merchants) and use Shopify Catalog as Clover's discovery layer. Fastest, politically awkward (Shopify is the competitor).
   - **Option C**: Per-platform direct integrations — skip Shopify Catalog entirely, go direct to each AI platform's merchant program. Middle ground.
   - **Status**: OPEN. User will decide.
3. **AI-lab demo partnership secured** (Anthropic or OpenAI) for the Clover Direct demo agent. Drucker's carry from Phase 3.
4. **WeekendCash safeguards hard-wired in code** before first merchant is enrolled:
   - 60-minute Fiserv balance-sheet backstop on SLA miss
   - 99.9% rolling-30-day SLA auto-pause threshold
   - Conservative opt-in ramp for first 90 days (5% → 25% → 100% volume stair-step)
   - Public kill threshold in merchant-visible docs
5. **SmartDeposit dispute-defense pitch held back** from hero copy until Phase 6 measurement. Ship on enforceable-deposit JTBD only; earn the dispute claim with real data.
6. **Rename everything** before first Phase 5 commit:
   - "Merchant Yield Sweep" → **WeekendCash** (or SaturdayCash)
   - "Pay-by-Agent x402" → **Clover Agent Checkout**
   - "Instant Supplier Pay" → archived under that name
   - "Cross-Border Instant Settlement" → scoped out, not renamed
7. **Extract ML depletion predictor** from retiring prototype-3 to `/shared/ml-predictors/` before prototype-3 archival.

## Phase 5 build scope (when you pick this up)

### Product 1 — Clover Direct
- **Hero pitch**: "Every Clover restaurant is ready for AI agent payments today, at 8% not 28%."
- **Revised shape** (post-Phase-4): Discovery + acceptance. Not end-to-end in-chat ordering.
- **Key components**:
  - Merchant onboarding flow (idempotent — no merchant action required)
  - Directory listing strategy execution (pending Option A/B/C decision)
  - Acceptance integration with Mastercard Agent Pay
  - Merchant dashboard: "orders from AI agents this week, channel breakdown, take-rate comparison vs marketplaces"
  - Cinematic showcase demo following existing prototype-1..4 house style

### Product 2 — SmartDeposit
- **Hero pitch**: "Your client said they'd show up. Now prove it."
- **Key components**:
  - Deposit link generation (text + agent-initiated)
  - Mastercard Agent Pay cryptographic mandate capture
  - Merchant dashboard: "Saturday night, zero no-shows"
  - Catering workflow extension for restaurants
  - Optional booking-platform partnership integration (pending named partner)

### Product 3 — WeekendCash (reshape of prototype-1)
- **Hero pitch**: "Your Saturday money, on Saturday. Backed by Fiserv."
- **Reshape work**:
  - Keep: `finxact-client`, `decision_gate.py`, sweep_service architecture, SQLAlchemy schema, demo-mode fallback
  - Delete: ML outflow predictor, yield-accrual logic, yield position tracker
  - Extend: INDX integration, advance/reconcile pattern (replacing sweep/unsweep)
  - Hard-wire: Taleb's 4 safeguards
- **Merchant dashboard**: "Weekend revenue in your account today, at no cost"

### Product 4 — Clover Agent Checkout backbone (reshape of prototype-2)
- **Upgrade from Phase 3**: load-bearing infrastructure, not just "a rail"
- **Keep**: Gateway, Verifier, Settler, Agent SDK TypeScript interface, demo agent scaffolding (constrained, scripted)
- **Build new**:
  - **Agent Order Translation Layer** — the most technically differentiating component in the portfolio. Converts agent intent payloads (ACP, AP2, Mastercard Agent Pay) into Clover Platform API order structures with line items, modifiers, tip, delivery.
  - **Clover Platform API integration module**
- **Protocol support**: Mastercard Agent Pay primary, ACP and AP2 as protocol adapters, Solana/x402 optional or retired based on Phase 5 scoping
- **Scope cuts from prior spec panel**: TypeScript only, constrained Claude agent, hardcoded product catalog, scripted scenario, local Solana validator if used at all

## Cinematic showcase and Investor Day narrative arc

### Arc (Phase 3 panel consensus, carried)

1. **Lead**: *"Fiserv is the only SMB acquirer whose 6 million merchants are ready for AI agent payments today."* — single sentence, no jargon.
2. **Product act — Clover Direct**: live demo, agent discovery + handoff + acceptance + 8% vs DoorDash 28%
3. **Humanizing act — WeekendCash**: Saturday-morning-money moment; Fiserv-backstop framing
4. **Capability act — SmartDeposit**: same backbone, services vertical, no-show dashboard
5. **Plumbing slide — Clover Agent Checkout backbone**: the shared rail + Agent Order Translation Layer
6. **Via-negativa slide — explored and parked**: Net-Zero, prototype-3, prototype-4 (discipline signal)
7. **Kill thresholds slide**: every shipped product has a named kill threshold

### Kill thresholds (to be displayed on the final slide)

- **Clover Direct**: <$50M annualized agent-channel GPV by Q4 2026 → product dies, rails absorbed as generic acceptance
- **WeekendCash**: <99.9% rolling 30-day SLA → auto-pause
- **SmartDeposit**: to be determined in Phase 5 (likely: dispute win-rate lift threshold after 6 months of data)

## Open decisions carried to Phase 5

1. **Clover Merchant Directory strategy** (Option A / B / C above) — THE biggest architectural decision
2. **WeekendCash pricing** — free, fee-per-transaction, or tiered? Panel-preferred is "free, Fiserv-backstopped"
3. **SmartDeposit branding** — standalone brand or capability of Clover Direct? Phase 3 panel split; Collins/Doumont wanted fold, most others wanted named capability
4. **AI-lab demo partner identity** — Anthropic or OpenAI
5. **Investor Day timing** — determines whether scope cuts are needed

## File map for a new reader

| File | What it contains |
|---|---|
| `00-index.md` | The index you're looking at from the top of this folder |
| `01-problem-space.md` | Phase 1 external scan: Clover CNP position, FIUSD state, agentic commerce landscape, friction data |
| `01b-existing-prototypes-baseline.md` | Phase 1 extraction of the 4 shipped prototypes + prior panel verdicts + strategy thesis from Full_Analysis.docx |
| `02-jtbd-matrix.md` | Phase 2 JTBD discovery, segment-by-segment job inventory, shortlisted 8 opportunities |
| `03-strategy-briefs.md` | Phase 3 one-pagers for the 4 hero opportunities with 9-expert debates and verdicts |
| `03b-existing-prototype-panel.md` | Phase 3 retain/reshape/retire debates on the 4 shipped prototypes |
| `04-panel-synthesis.md` | Phase 3 synthesis: ranked portfolio, cross-candidate themes, Investor Day arc, open questions |
| `phase4-research-findings.md` | Phase 4 research findings with citations (9 questions answered) |
| `05-validation-report.md` | Phase 4 go/no-go synthesis, pushback verdicts, product-shape revisions |
| `05b-existing-prototypes-decision.md` | Phase 4 final retain/reshape/retire decisions with code disposition |
| `06-portfolio-after.md` | This doc — Phase 5 handoff |

## Complementary reference files outside this folder

- `~/.claude/plans/hashed-greeting-spring.md` — original 5-phase plan the workstream followed
- `~/.claude/projects/-Users-ajnarasi-Documents-Work-Projects-stablecoin/memory/` — user profile, project context, 5-phase framework, prototype portfolio saved as persistent memory
- `prototype-1-yield-sweep/` — code to be reshaped into WeekendCash
- `prototype-2-agent-pay/` — code to be reshaped into Clover Agent Checkout backbone
- `prototype-3-supplier-pay/` — code to be retired (preserve ML predictor to `/shared/`)
- `prototype-4-cross-border/` — code to be retained as CommerceHub asset only
- `deliverables/Fiserv_Crypto_Strategy_Full_Analysis.docx` — prior strategy doc; thesis mostly survives the Clover-CNP lens but should be updated to reflect the Phase 4 sequencing (agentic first, FIUSD settlement second) and the Net-Zero kill
- `deliverables/Fiserv_Panel_Evaluations.docx` — prior panel scores; the new panel verdicts supersede where they differ
- `deliverables/Fiserv_Crypto_Strategy_Investor_Day.pptx` — deck to be updated with the Clover-CNP narrative arc and the kill slide

## How to resume this workstream

1. Read this file.
2. Decide the 7 Phase 5 prerequisites above (P&L owner, directory strategy, AI-lab partner, etc.).
3. Scope Phase 5 engineering to match the decisions and the Investor Day timing.
4. Start with the reshape of prototype-1 → WeekendCash (lowest risk, highest demo energy per unit effort).
5. In parallel, start the Clover Agent Checkout backbone reshape since everything else depends on it.
6. Build Clover Direct and SmartDeposit on top of the backbone once it's functional.
7. Update the Investor Day deck to match the ranked-portfolio narrative.

The strategy work is done. The build work is yours.
