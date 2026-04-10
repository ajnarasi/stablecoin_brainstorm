# PRD — Clover Direct

*Phase 5 hero product. Owning the agentic-commerce channel for Clover restaurants.*

## Problem

Clover restaurant merchants route the majority of their digital demand through DoorDash, Uber Eats, and Grubhub at 25-30% commission (40%+ all-in). Toast has built a $36K/year-savings wedge against this with commission-free online ordering. Clover has no equivalent product. Meanwhile, AI shopping agents (ChatGPT, Gemini, Claude, Perplexity Shopping, Apple Intelligence) are emerging as a new digital demand channel — and no Clover merchant is reachable on any of them today.

## Opportunity

Fiserv integrated **Mastercard Agent Pay Acceptance Framework into Clover in December 2025**. This is a rail-level integration at the acquirer layer, not a merchant-side build. Neither Toast, Square, nor Shopify POS has a comparable integration as of April 2026. Every Clover merchant is structurally ready to accept agent-initiated payments — but nothing above the rail layer makes them discoverable, nothing translates agent intent into Clover tickets with line items and modifiers, and nothing closes the economic delta into a merchant-visible pitch.

Clover Direct is the product that turns the rail into a business.

## JTBD

**Primary** (restaurants): *"When I get a takeout or delivery order, I want the money to land in my bank without paying a 25-30% marketplace commission, and I want every AI channel my customers use to route orders into my POS the same way a walk-in would."*

**Secondary** (services, via SmartDeposit backbone overlap): *"When a client books an appointment through their AI assistant, I want the booking and deposit to land in my calendar and my account the same way a web booking would."*

## Target customer

- **Beachhead**: Independent Clover restaurants and small chains (2-10 locations) currently paying DoorDash + Uber Eats + Grubhub 25-30% commission. ~250-400K merchants in the first addressable tier.
- **Expansion 1**: Larger chains and QSR franchisees.
- **Expansion 2**: Services merchants via the shared backbone with SmartDeposit.

## The product in one sentence

**Every Clover merchant is discoverable by every AI agent and accepts agent-initiated orders as normal Clover tickets, at 8% all-in instead of DoorDash's 28%.**

## Scope — MVP (Phase 5 build)

### In scope

1. **Clover Agent Checkout backbone integration** (depends on reshaped prototype-2)
   - Gateway accepts Mastercard Agent Pay tokenized payloads as primary protocol
   - Gateway accepts ACP / AP2 payloads as protocol adapters for non-Mastercard agents
   - Verifier validates agent identity, spending guardrails, Fiserv Secure Card on File
   - **Agent Order Translation Layer** — the load-bearing component. Converts agent intent payloads into Clover Platform API order structures with line items, modifiers, tip, delivery.
2. **Clover Merchant Directory** — **one of Options A/B/C from the Phase 4 decisions doc**:
   - Option A: Native Clover Merchant Directory syndicated to ChatGPT, Gemini, Perplexity, Apple Intelligence, Microsoft Copilot
   - Option B: License Shopify Agentic Plan for Clover merchants
   - Option C: Per-platform direct integrations
   - Decision gates the rest of Phase 5. P&L owner + product lead call.
3. **Merchant-facing dashboard** in Clover
   - "Orders from AI agents this week" pane
   - Channel breakdown (ChatGPT / Gemini / Perplexity / Apple / Other)
   - Take-rate comparison vs DoorDash / Uber Eats (8% vs 28% delta, merchant-visible)
   - "Your next upcoming agent orders" list
4. **Merchant activation flow** — zero-touch by default (every Clover restaurant auto-enabled) with a single opt-out toggle, a "learn more" modal, and a quickstart demo video.

### Out of scope (Phase 5 MVP)

- Fulfillment / delivery dispatch — Clover Direct covers ordering and payment, not the van. Integration with existing third-party delivery (or merchant's in-house drivers) is a Phase 6 concern.
- Real-time inventory sync across AI agents (agents query catalog at order time, not continuously)
- Loyalty/promotions applied through AI agent channel (Phase 6)
- Multi-language agent conversations (English only at MVP; ChatGPT handles the language layer itself)
- In-person pickup confirmation via agent (handoff happens at the merchant's existing workflow)

## Acceptance criteria

| # | Criterion | How we'll know |
|---|---|---|
| 1 | An agent order lands on Luigi's Pizzeria POS as a full ticket | Demo: ChatGPT prompt → agent intent → ticket with line items, modifiers, tip, delivery shows on Clover station within 10 seconds |
| 2 | The merchant sees an 8% vs 28% comparison in their dashboard | Dashboard row shows "Agent channel: 8% • DoorDash: 28%" with cumulative merchant savings |
| 3 | The Agent Order Translation Layer handles all three protocol inputs | Fixture tests: ACP payload, AP2 payload, Mastercard Agent Pay payload → all produce equivalent Clover Platform API order calls |
| 4 | An agent can discover a Clover merchant via the chosen directory strategy | Strategy A/B/C decision + proof-of-concept listing retrieval |
| 5 | Merchant opt-out toggle works | Click toggle → merchant removed from directory and stops receiving agent orders within 60 seconds |
| 6 | Safeguards: spending guardrails enforced | Agent over-limit order rejected at the Verifier with a clear decline code |
| 7 | Kill-threshold instrumentation lives in the dashboard | Q4 2026 YTD agent-channel GPV surfaced for internal portfolio review |

## Non-goals

- Clover Direct does **not** build a consumer-facing app. The agent is the consumer surface.
- Clover Direct does **not** compete with DoorDash on logistics. It competes on channel economics.
- Clover Direct does **not** require a Fiserv consumer wallet. FIUSD is back-end plumbing for merchant settlement, not a consumer-visible asset.
- Clover Direct is **not** a lending product. No advance against unpaid orders. Settlement acceleration (via WeekendCash) is a sibling product, not a Clover Direct feature.

## Metrics

### North star
- **Annualized agent-channel GPV through Clover**. Kill threshold: <$50M by Q4 2026.

### Health metrics
- Merchants activated (auto-enabled total; opt-out rate)
- Agent orders per merchant per week
- Average ticket size via agent channel
- Take-rate realized (target: 8% all-in, including card interchange + agent rail fee + Clover margin)
- Discovery-to-order conversion (agent surfaces a merchant → an order lands)
- Order-to-POS latency (target: <10 seconds end-to-end)

### Leading indicators
- AI platform coverage (how many of ChatGPT/Gemini/Perplexity/Claude/Apple Intelligence/Copilot list Clover merchants)
- Agent Order Translation Layer protocol coverage (ACP, AP2, Mastercard Agent Pay — target: all three by GA)
- Merchant NPS on agent channel (target: >50)

## Risks & mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Agent-channel volume is pre-volume in 2026 (Phase 4 finding: OpenAI ACP end-to-end failed) | HIGH | Ship with kill threshold hard-wired. Don't over-invest in the hero product until volume materializes. Lead the Investor Day with the asymmetry story, not the GPV numbers. |
| Shopify Agentic Storefronts owns the discovery layer | HIGH | Directory strategy decision is the first Phase 5 milestone. Option B (license Shopify) is fastest to market if political constraints allow. |
| Toast gets a comparable Mastercard integration in 2026 | MEDIUM | 12-month window is real but not infinite. Ship Clover Direct fast enough to own the category mental model before Toast catches up. Distribution asymmetry today beats feature parity in 12 months. |
| Merchants don't understand "agent channel" as a product | MEDIUM | Merchant dashboard leads with the 8% vs 28% delta, not the protocol. FIUSD is never in the hero copy. |
| Agent Order Translation Layer misses edge cases (modifiers, substitutions, allergens, delivery fees) | MEDIUM | Phase 5 scope includes a fixture test suite across realistic restaurant tickets. Ship with a fallback to "order requires manual confirmation" if translation confidence is below threshold. |
| Mastercard Agent Pay tokenization dispute-win-rate claim is unproven | LOW (for Clover Direct specifically; matters more for SmartDeposit) | Don't pitch the dispute defense angle in Clover Direct hero copy; it's SmartDeposit's job to measure and earn that claim. |

## Dependencies

- **Reshaped prototype-2** (Clover Agent Checkout backbone) — load-bearing
- **Clover Platform API access** for order creation — existing Fiserv infrastructure
- **Mastercard Agent Pay Acceptance Framework** — December 2025 integration in production
- **Clover Merchant Directory** — Option A/B/C decision pending
- **AI-lab demo partnership** (Anthropic or OpenAI) — for the Investor Day hero demo
- **Single cross-BU P&L owner** — gate on all Phase 5 commits

## Open questions

1. Directory strategy (A/B/C) — single biggest open architectural decision
2. Pricing model for the 8% take-rate. Is this a flat fee, interchange+agent-rail pass-through, or tiered? Need unit economics model from Fiserv Finance.
3. Merchant activation default — is opt-out the right default, or should it be opt-in for the first 90 days?
4. International — Clover is live in 8 countries. Is Clover Direct US-only at MVP or global from day one?
5. Kill-threshold enforcement mechanism — what does "absorbed into generic acceptance" look like operationally if we hit the kill threshold at Q4 2026?
