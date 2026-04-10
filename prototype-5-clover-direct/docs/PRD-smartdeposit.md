# PRD — SmartDeposit

*Phase 5 capability product. Services-vertical hero with catering overlap into restaurants. May fold brand into Clover Direct.*

## Problem

Clover services merchants (beauty, home, professional) lose 10-20% of booked revenue to no-shows. Industry data: UK salons alone lose £1.6B/year to no-shows; deposit-protected salons reduce no-shows by 29-70%. But taking a deposit today requires a separate CNP infrastructure most Clover services merchants don't have set up, and even when they do, the deposit is chargeback-vulnerable the moment the customer disputes. Restaurants with catering programs face an adjacent problem: catering inquiries go cold in the window before a deposit is locked, and merchants lose the booking.

## Opportunity

The same rail Clover Direct uses — Mastercard Agent Pay cryptographic mandate + Clover Agent Checkout backbone — can be pointed at a different job: **locking a deposit enforceably at the moment of booking**, with the cryptographic mandate acting as dispute defense evidence. An AI assistant booking a haircut for Thursday at 2pm can also lock the deposit in the same breath. A restaurant catering inquiry can be converted to a booked+deposited catering order before the lead cools.

## JTBD

**Primary** (services): *"When a client books an appointment, I want a deposit locked in the same click or I want the booking to fail."*

**Secondary** (restaurant catering): *"When a catering inquiry comes in, I want to confirm it with a deposit in the next five minutes before the lead goes cold."*

## Target customer

- **Beachhead**: Clover salons, spas, barbershops, and personal care merchants with a history of no-show pain. ~150K merchants.
- **Expansion 1**: Home services merchants with first-visit deposit practices (plumbing quotes, cleaning bookings, pet grooming).
- **Expansion 2**: Restaurant catering programs (~30K Clover restaurants with active catering).
- **Expansion 3**: Professional services with retainer patterns.

## The product in one sentence

**One-click deposits that are actually enforceable, locked at the moment of booking, via text link or AI agent.**

## Scope — MVP (Phase 5 build)

### In scope

1. **Deposit link generation**: merchant generates a text-to-client deposit link from Clover, or a booking system integrates via API to auto-generate.
2. **Agent-initiated deposit capture**: AI assistants that book through the Clover Agent Checkout backbone can lock a deposit as part of the booking transaction.
3. **Cryptographic mandate capture**: the Mastercard Agent Pay tokenization payload is stored as the "deposit mandate" — the signed record that this specific customer consented to this specific deposit for this specific booking at this specific time.
4. **Cancellation window enforcement**: merchant configures their cancellation rules (e.g., "full refund before 24h, 50% refund 6-24h, no refund inside 6h"); the mandate and the configured rule together form the dispute evidence packet.
5. **Merchant dashboard** in Clover:
   - "Deposits locked this week"
   - "No-shows prevented (deposits captured)"
   - "Saturday night, zero no-shows" demo hero view
   - **Dispute panel** (instrumentation-only at MVP — measures dispute win rate for deposit transactions but doesn't yet pitch the lift; see Phase 4 holdback)
6. **Catering deposit flow** for restaurants — the same backbone with a restaurant-specific template (catering order details, headcount, delivery window, gratuity).

### Out of scope (Phase 5 MVP)

- Booking-platform deep integrations (Vagaro, GlossGenius, Mindbody, Booksy, Treatwell). These are Phase 5 partnership gates, not code. Drucker carry from Phase 3.
- Installment plans on deposits (e.g., "pay 50% now, 50% closer to the date"). Phase 6.
- Dispute-defense pitch in hero copy — **held back per Phase 4 verdict**. The mandate instrumentation ships; the claim does not.
- Refund automation — manual at MVP, automated in Phase 6.
- Subscription/recurring visit packages — these are Clover Packages territory, covered under a potential Phase 6 spin-off.

## Acceptance criteria

| # | Criterion | How we'll know |
|---|---|---|
| 1 | A merchant can generate a deposit link in under 10 seconds from Clover | Demo: click "Request deposit" → text link generated → copy to clipboard → SMS to customer |
| 2 | A customer can pay the deposit in one tap | Demo: click link on mobile → pay with card → deposit locked → confirmation shown |
| 3 | The cryptographic mandate is captured and retrievable | API: GET /deposits/{id}/mandate returns the signed payload with customer intent, amount, booking context |
| 4 | An AI agent can initiate a deposit as part of a booking | Demo: Apple Intelligence books a massage → agent intent payload includes deposit request → backbone captures both the booking and the deposit mandate |
| 5 | Cancellation window rules produce a dispute evidence packet | Demo: merchant configures 24h rule → customer cancels inside window → evidence packet auto-assembled |
| 6 | Merchant dashboard shows "no-shows prevented" count | Dashboard card renders merchant-visible number |
| 7 | Catering deposit template works end-to-end | Demo: Luigi's catering inquiry → deposit link with catering context → customer pays → catering booking locked on Clover |

## Non-goals

- SmartDeposit does **not** pitch the dispute-defense lift in hero copy at MVP. Phase 4 held this back until instrumented.
- SmartDeposit is **not** a booking platform. It assumes the merchant has a calendar (Clover-native or integrated) and focuses on the deposit primitive.
- SmartDeposit does **not** handle customer-side payment scheduling — the deposit is locked at booking, full stop.

## Metrics

### North star
- **No-shows prevented per merchant per month** (deposits captured that would have been no-shows without them). Target: 5-15% lift in services merchants; 20-30% in catering.

### Health metrics
- Deposits locked per merchant per week
- Deposit-to-booking ratio (how often a booking captures a deposit)
- Agent-initiated vs text-link-initiated deposit split
- Cancellation rate inside window vs outside window
- Deposit dispute rate (MVP instrumentation; becomes the claim once data is in)
- Average deposit size by vertical

### Leading indicators (Phase 6 gates)
- Dispute win rate delta vs Clover baseline (target: >10pp lift for the claim to be sellable)
- Merchant NPS on deposit feature
- Booking-platform partnership count (Drucker carry)

## Risks & mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Booking UX friction kills the "one click" promise | HIGH | Ruthless UX review on the mobile deposit page. Single-input deposit payment, Apple Pay / Google Pay first. |
| Dispute-mandate lift is marginal in practice | MEDIUM | Phase 4 held the claim back; Phase 5 instruments. Real number in Phase 6. Product is still strong on the primary JTBD. |
| Booking platforms won't integrate without commercial incentives | MEDIUM | Drucker carry. Start with API-only MVP; secure 2 of top 5 booking platforms as Phase 5 commercial work, not engineering work. |
| Merchants set cancellation rules too loose and undermine the deposit | LOW | Product opinion: smart defaults with a "are you sure you want to allow full refund inside 2 hours?" nudge. |
| Services verticals are fragmented; GTM is hand-to-hand | MEDIUM | Piggyback on Clover's existing services-merchant sales motion. Don't build a new sales team for this. |

## Dependencies

- **Reshaped prototype-2** (Clover Agent Checkout backbone) — shared with Clover Direct
- **Mastercard Agent Pay cryptographic mandate capture** — new build on top of the tokenization payload
- **Clover Booking / Calendar API or partner integrations** — at least one integration path required for MVP
- **Dispute evidence packet format** — lightweight at MVP, grows in Phase 6
- **Single cross-BU P&L owner** (shared with Clover Direct if the brand folds)

## Open questions

1. **Brand decision**: does SmartDeposit ship as a named capability of Clover Direct or as its own product? Phase 3 panel split. My recommendation: ship as a named capability under Clover Direct for the hero narrative; surface "SmartDeposit" as the internal feature name for the booking-first customer case.
2. **Dispute claim timing**: how many months of data do we need before the dispute-defense pitch can enter hero copy? Suggest 6 months post-MVP.
3. **Booking partner priority**: Vagaro, GlossGenius, Mindbody, Booksy, Treatwell — which two to target first? Dependent on the commercial relationship work.
4. **Catering as sub-case vs. product**: is catering deposit a SmartDeposit use case or a Clover Direct restaurant feature? Currently modeled as SmartDeposit since the deposit mechanic is the same; could flip if restaurant-catering demand volume is larger than services deposits.
