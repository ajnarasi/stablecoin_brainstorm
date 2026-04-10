# Phase 2 — Jobs-to-be-Done Matrix

*Framing: Clover merchant = customer. Job language is the merchant's, not Fiserv's. Solution space (FIUSD, agent rails, cards, ACH, etc.) is deliberately held out of the job statements to avoid anchoring on Phase 1's findings. Where a job maps to an existing prototype it's tagged Track C, where it extends prototype-2 scaffolding it's tagged Track A, and otherwise Track B — tagging happens after the jobs are identified, not before.*

## How to read this

For each segment I capture:

1. **Job inventory** — a wide list of the jobs a merchant in this segment is trying to get done around CNP revenue. Intentionally broad so the matrix is defensible rather than cherry-picked.
2. **Top jobs** — the 3-6 jobs worth taking through Phase 3 with a one-line rationale.
3. **Functional / emotional / social layers and hire/fire criteria** for the top jobs.
4. **Where existing prototypes map in** — each of P1-P4 gets called out against the jobs they actually serve, so Track C has direct evidence to feed Phase 3.

The master matrix at the end consolidates everything. The three-track tagging filter is the penultimate section, the cross-segment observations are the last.

---

## Segment 1 — Restaurants (QSR & FSR, Clover's largest vertical)

### Job inventory

1. **"When I get a takeout or delivery order, I want the money to land in my bank without paying a 25-30% marketplace commission."** (marketplace displacement)
2. **"When a regular customer wants to order ahead, I want them to do it on my branded channel so I keep the relationship and the data."** (channel ownership)
3. **"When a catering inquiry comes in, I want to confirm it with a deposit in the next five minutes, before the lead goes cold."** (catering/events capture)
4. **"When I get a large catering or event order, I want to be paid on a schedule I control (deposit now, balance on delivery) without chasing invoices."** (structured billing)
5. **"When a customer abandons their cart at the last step, I want to recover the sale the same day without paying a marketing platform."** (cart recovery)
6. **"When a gift card is sold online, I want the funds usable instantly and the liability clean on my books."** (digital gift/stored value)
7. **"When a diner wants to pay at the table from their phone, I want it to feel as fast as tapping a card so tables turn."** (pay-at-table CNP — CP-adjacent but hits CNP economics)
8. **"When a subscription or meal-plan customer pays monthly, I want zero failed renewals and zero manual follow-up."** (recurring revenue)
9. **"When a chargeback comes in on a CNP order, I want to win the dispute on the first pass without rebuilding the whole file by hand."** (dispute defense)
10. **"When I sell loyalty credit or a prepaid card, I want to settle today so my cash flow matches my liabilities."** (prepaid economics)
11. **"When Settlement from the weekend lands on Tuesday afternoon, I want it in my account Saturday morning so I can pay my Sunday prep costs."** (settlement speed — applies to CP and CNP)
12. **"When an AI agent (ChatGPT, Gemini, etc.) asks to order on behalf of its user, I want the order to land on my system as if the user ordered directly — menu, modifiers, delivery info, tip, full ticket."** (agentic inbound — new demand channel)
13. **"When I run a flash promotion, I want to push it to every channel including AI agents without rebuilding my menu five times."** (channel multiplexing)
14. **"When I owe a supplier and we both agree on a net-10 discount, I want to claim that discount without a clerk pushing ACH buttons."** (B2B / supplier pay — not CNP-facing)
15. **"When a guest at the bar wants to open a tab on their phone, I want to preauthorize them without a card-not-present fraud hit."** (pre-auth CNP)

### Top jobs (take to Phase 3)

- **R1** — *Displace the marketplace take rate without rebuilding the ordering stack.* Clearest money on the table (20-40% of margin on delivered orders). Aligns with Toast's existing wedge but re-frames with agentic + stablecoin rails.
- **R2** — *Convert catering leads into booked-with-deposit revenue in the window before the lead cools.* High ticket size, low CNP infrastructure penetration, direct no-show/cancellation exposure.
- **R3** — *Turn AI agents into an inbound ordering channel without changing my POS.* Net-new demand that Clover can enable at the rail layer (Fiserv-Mastercard Agent Pay integration) and that Toast/Square haven't publicly matched.
- **R4** — *Land weekend settlement on Saturday morning, not Tuesday.* Not sexy but universally felt and directly addressable via FIUSD-settlement rails. (This is where the existing P1 yield-sweep DNA actually belongs — see Track C section.)
- **R5** — *Win CNP chargebacks without heroics.* Mastercard Agent Pay tokenization + network-token + Secure Card on File create a structural lift Clover can package as a feature, not a framework.

### JTBD layers for the top jobs

| Job | Functional | Emotional | Social | Hire criteria | Fire criteria |
|---|---|---|---|---|---|
| R1 — Displace marketplace tax | Accept digital orders through a channel I own at <10% all-in cost | Relief from the "I'm working for DoorDash" feeling | Looks like a restaurant that's beating the platforms, not being bled by them | Works on day 1 for existing menu; customers actually use it | Hidden fees; orders that don't print to the kitchen; any outage |
| R2 — Catering deposit capture | Send deposit link and get paid in the same conversation | Confidence that the booking is "real" | Treats the customer like a pro-grade caterer does | Deposit link works from text in <60s; money is locked | Manual invoicing workflow; deposit that can be casually charged back |
| R3 — Agentic inbound | Receive tickets from AI agents with all modifiers, tip, delivery intact | Curiosity/excitement at the first few orders; confidence that it's safe | First on the block to "sell to the AI" | Drops into existing POS as just another channel; auth/chargeback clean | Any step that requires a new dashboard or a new onboarding |
| R4 — Same-day / weekend settlement | Cash hits account the same day funds hit Fiserv | Stops dreading Monday-morning NSF | Looks well-run to suppliers and staff | Available on the accounts I already have; no extra fee that eats the win | Settlement delays framed as "technical issue" |
| R5 — Dispute defense | Packaged evidence auto-built per chargeback | Stops feeling extorted by "friendly fraud" | Respected as a merchant who fights back | Win rate visibly lifts in 60 days | Vendor takes a cut of recovered amount or charges monthly fee with no win |

---

## Segment 2 — Services (beauty/wellness, home services, professional services)

### Job inventory

1. **"When a client books an appointment, I want a deposit locked in the same click or I want the booking to fail."** (no-show defense — the headline job)
2. **"When a client books a recurring service (monthly facial, weekly cleaning), I want the card on file to actually work every time."** (recurring CNP reliability)
3. **"When a client cancels inside the cancellation window, I want to keep the deposit without a dispute or an angry review."** (deposit enforceability)
4. **"When I finish a big-ticket service (wedding, home renovation, legal engagement), I want the invoice paid in minutes not weeks, without chasing."** (AR collapse)
5. **"When a client wants to prepay for a package of 10 sessions, I want to take the payment and recognize the revenue as sessions are used."** (prepaid packages)
6. **"When a client wants to tip me after the service via text, I want a tip link that doesn't feel like a PayPal request."** (post-service tipping / CNP top-up)
7. **"When a client wants to pay in installments on a $2K service, I want a BNPL option that settles me today."** (SMB BNPL)
8. **"When I sell a gift card to someone for their friend's birthday, I want the money in my account today and the liability clean."** (gift card economics — same as R6)
9. **"When a client asks their AI assistant to book me for a haircut next Thursday, I want the booking + deposit to land the same as a web booking."** (agentic inbound — services version)
10. **"When a client ghosts on a final invoice, I want the collection to escalate automatically without me becoming a debt collector."** (AR escalation)
11. **"When I pay my suppliers (product distributors, subcontractors), I want the cash flow to match my receivables so I don't float them out of my own pocket."** (supplier side — not CNP-facing, adjacent to existing P3)
12. **"When I want to offer a discount for customers who pay directly (not through a gig platform), I want to price it in and have them actually see the savings."** (platform disintermediation — e.g., Thumbtack, Angi, TaskRabbit)
13. **"When my staff leave and take clients with them, I want my customer list and prepaid balances to stay with the business, not walk out the door."** (client-list lock-in via stored value)

### Top jobs (take to Phase 3)

- **S1** — *Lock a deposit in the same click as the booking, and keep it enforceable.* The single biggest dollar-weighted services CNP job — directly addresses the 10-20% no-show problem.
- **S2** — *Collapse AR from net-30 to instant on completed services.* High-ticket services merchants float their own receivables today; any speed lift is pure cash flow.
- **S3** — *Turn AI assistants into an inbound booking channel (with deposit intact).* Same structural bet as R3; services happens to be where AI assistants will book first (hair, nails, handy, pet).
- **S4** — *Pre-sell packages as stored value that settles today and amortizes on use.* Unlocks a rev-rec pattern services merchants can't do cleanly today.
- **S5** — *Disintermediate the platform tax (Thumbtack, Angi, TaskRabbit, Treatwell).* The services-vertical mirror of R1.

### JTBD layers for the top jobs

| Job | Functional | Emotional | Social | Hire criteria | Fire criteria |
|---|---|---|---|---|---|
| S1 — Enforceable deposit | One click, money locked, cancellation rules applied | Stops dreading weekend no-shows | Treats the customer like they value my time | Works in my existing booking tool; clear dispute defense | Deposit that can be casually reversed; any friction in the booking flow |
| S2 — AR collapse | Invoice sent → paid in minutes | Stops being "the collections department" | Looks like a real business, not a freelancer chasing money | Integrates with existing invoicing; buyer doesn't need new account | Anything that adds steps to the buyer |
| S3 — Agentic booking | AI assistant books → deposit lands → calendar filled | "The future showed up at my salon" | First-mover bragging rights | POS/calendar just sees a normal booking | Any requirement to build a separate "agent channel" |
| S4 — Package prepay | Customer pays $500 for 10 sessions today, amortized as used | Security of having cash on hand | Pro-grade pricing, not à la carte | Settles today, clean on the books | Revenue-recognition ambiguity; refund fights |
| S5 — Platform disintermediation | I can offer a 10% off for direct booking and actually deliver it | Stops feeling owned by the platform | Brand ownership with customers | Works with my existing customer list | Legal friction with the platform |

---

## Segment 3 — Breadth pass: other SMB (specialty retail, health, fitness, services-adjacent)

Run neutrally to check whether a horizontal cut is stronger than the two focal verticals.

- **Specialty retail** — Shopify already owns this wedge. Main SMB job unmet by Shopify is *buy-now-pay-on-delivery / conditional payment* (e.g., furniture, custom orders, made-to-measure). FIUSD-backed conditional escrow is interesting but small TAM inside Clover because most serious retail SMBs are on Shopify.
- **Fitness studios** — Job is almost identical to services (S1, S4). Package prepay and no-show enforcement are the headline jobs. No meaningful differentiation from services handling.
- **Health / medical aesthetics** — Same S1/S2 shape + HIPAA friction. Adds regulatory overhead for modest additional TAM.
- **Home services** — Already captured under services; worth flagging that home services has the largest per-job ticket size, making S2 (AR collapse) particularly valuable here.
- **Professional services (legal, accounting, consulting)** — S2 (AR collapse) is the dominant job. Deposit patterns (retainers) are also big.

**Verdict of the breadth pass**: the restaurant + services cut is genuinely where the leverage is. Specialty retail is a Shopify territory fight Clover shouldn't pick. The interesting breadth observation is that *several SMB segments share R4/S2 — "settlement speed / AR collapse"* — making it a candidate for a horizontal offering rather than a vertical one.

---

## Master matrix

Filter rule (explicit, applied below): keep a job only if both (a) CNP is the relevant context and (b) a FIUSD or agent rail materially changes the math (cost, speed, trust, reach, or new demand). Kill B2B-only, CP-only, or "card already solves it" jobs.

| ID | Job (merchant voice) | Segment(s) | CNP? | FIUSD/agent lever | Track tag | Phase 3 verdict |
|---|---|---|---|---|---|---|
| R1 | "Accept digital orders without paying marketplace 25-30%" | Restaurants | ✅ | **Agent rails (new channel) + FIUSD settlement** | A + B | **take forward** |
| R2 | "Catering deposit locked in the same conversation" | Restaurants | ✅ | Agent-mediated mandate + fast settlement | A | **take forward** |
| R3 | "AI agent orders landing in my POS as normal tickets" | Restaurants | ✅ | **Agent rails — core** | A | **take forward** |
| R4 | "Same-day / weekend settlement" | Restaurants (+ all SMB) | partial | FIUSD settlement rail | C (extends P1 DNA, not as yield play) | **take forward as reshaped P1** |
| R5 | "Win CNP chargebacks without heroics" | Restaurants (+ services) | ✅ | Network token + Agent Pay tokenization | B | **take forward** |
| R6 | "Digital gift card settles today, liability clean" | Restaurants (+ retail) | ✅ | FIUSD settlement + on-chain mandate | B (low priority) | park — small unit lift |
| R7 | "Pay-at-table / QR-to-pay CNP" | Restaurants | partial | Marginal | — | kill — card already solves it |
| R8 | "Recurring subscription renewals never fail" | Restaurants | ✅ | Network token helps, agent rails marginal | B (low priority) | park — marginal stablecoin lever |
| R9 | "Cart recovery without paying a marketing platform" | Restaurants + all SMB | ✅ | Agent-mediated retarget | B (experimental) | park |
| R10 | "Bar pre-auth tabs on phone" | Restaurants | partial | Marginal | — | kill |
| R11 | "B2B supplier pay with early-discount capture" | Restaurants | ❌ (B2B) | FIUSD + AI procurement (existing P3) | C | **take forward as Track C decision only — not a CNP job** |
| S1 | "Enforceable deposit at booking click" | Services | ✅ | Agent-mandate cryptographic commitment + fast settlement | A + B | **take forward** |
| S2 | "AR collapse on completed high-ticket services" | Services (+ breadth) | ✅ | FIUSD settlement rail | B + (C reshape hook) | **take forward** |
| S3 | "AI assistant books service + pays deposit" | Services | ✅ | **Agent rails — core** | A | **take forward** |
| S4 | "Package prepay stored-value that amortizes on use" | Services | ✅ | FIUSD stored balance + on-chain amortization | B | **take forward — strong** |
| S5 | "Disintermediate services platform tax (Thumbtack/Angi)" | Services | ✅ | Agent-mediated direct booking | B | **take forward** |
| S6 | "Recurring service CNP reliability" | Services | ✅ | Network token | B (low) | park |
| S7 | "Cross-border / international online sales" | All SMB | ✅ | FIUSD cross-border settlement (existing P4) | C | **take forward as Track C decision only** |

### Shortlist sent to Phase 3 (strategy panel)

**New opportunity set (Track A + Track B)** — 8 candidates that will get the full panel one-pager treatment:

1. **Clover Direct** (R1 + R3 merged) — branded direct-channel ordering powered by agentic inbound, settled in FIUSD, priced to undercut DoorDash/Uber Eats dramatically.
2. **SmartDeposit** (S1 + R2 merged) — frictionless, enforceable deposits for services bookings and restaurant catering, with a cryptographic mandate that doubles as dispute defense.
3. **Clover Concierge Inbox** (R3 + S3 merged) — a single pipe into the Clover POS for any AI agent (ChatGPT, Gemini, Claude, Perplexity Shopping, Apple Intelligence) without the merchant building anything new.
4. **Clover Net-Zero** (S2) — AR collapse for high-ticket services: invoice sent, invoice paid, settled today, no follow-up, built on FIUSD settlement rail.
5. **Clover Packages** (S4) — prepaid stored-value packages that settle today, amortize programmatically on use, and travel with the customer record rather than walking out with a stylist.
6. **Direct Offer** (R1-lite + S5) — a 10-20% off-the-top incentive the merchant can grant customers for booking direct instead of via a gig platform, with the savings underwritten by the rail cost delta.
7. **Agent-Shield Chargeback** (R5) — Agent Pay tokenization + Secure Card on File + packaged evidence, shipped as a single Clover feature.
8. **WeekendCash** (R4 reshape of P1) — settlement acceleration on weekends and holidays via FIUSD rail, marketed to restaurants and services. Uses prototype-1 scaffolding but with the story reframed from "yield on idle" to "your money, sooner" — a CNP-economic cash-flow play rather than a treasury-management play.

**Existing-prototype re-examination (Track C)** — all four shipped prototypes will also go through the Phase 3 panel with the explicit prompt "would you build this for Clover CNP today, reshape it, or kill it?" Panel input, combined with the JTBD mapping above, produces the retain/reshape/retire decisions in Phase 4.

### Track C first-read mapping (JTBD-first, not code-first)

| Prototype | Job(s) it actually serves | Clover-CNP fit | First-read direction |
|---|---|---|---|
| **P1 Yield Sweep** | "Make idle money earn" — *treasury*, not CNP | **Weak as-is** | **Reshape candidate → WeekendCash.** Same Finxact + decision-gate scaffolding, but the story moves from "yield on idle" to "weekend settlement acceleration" / "your money sooner." Same code, CNP-native narrative. |
| **P2 Agent-Pay x402** | R3, S3, R2/S1 (deposits), R1 (direct channel) | **Strongest, but mis-positioned** | **Reshape candidate.** Keep the scaffolding, re-target from "enterprise API developers" to "Clover merchants receive orders from any AI agent." Becomes the rail for opportunities 1, 2, 3 above. |
| **P3 Supplier Pay** | R11 — B2B supplier pay | **Not CNP** | **Reshape or retire.** Doesn't serve any CNP job. Options: (a) park as a Commerce Hub B2B side-bet independent of this workstream; (b) retire from this workstream's portfolio; (c) reshape as merchant *accounts-receivable* collapse (S2) by flipping the arrow — same Finxact primitives, different user. |
| **P4 Cross-Border** | S7 — cross-border CNP | **CommerceHub enterprise, not Clover SMB** | **Retain narrow or retire.** Panel already flagged red-ocean risk. In Clover context, real addressable share is small. Consider retaining as CommerceHub asset only and removing from the Clover-CNP portfolio. |

These are first-read directions — the Phase 3 panel will stress-test them and the Phase 4 validation work will produce the final verdicts.

---

## Cross-segment observations

- **The real wedge is "inbound agent rail + stablecoin settlement," not "stablecoin at checkout."** The JTBD work keeps surfacing jobs where consumers pay with cards as usual but the merchant benefits from agentic order capture and/or stablecoin-speed settlement. That's consistent with the Phase 1 conclusion that consumer FIUSD acceptance is 2027+. The 2026 merchant benefit is real even when no consumer ever touches a stablecoin.
- **Restaurants and services have the same deep structure on three of the top jobs** — direct-channel displacement, deposit enforceability, agentic inbound — which means one prototype can credibly serve both verticals if designed right. That's a strong efficiency argument for Phase 5.
- **Prototype-2 is the right scaffolding for most of the new shortlist.** Track A is carrying more weight than expected: 5 of the 8 shortlist items plausibly ride on prototype-2's gateway/verifier/settler stack with some Clover-specific adapters. That shifts the Phase 5 effort estimate.
- **Prototype-1 is not a CNP play in its current framing** — but the *code* wants to serve a CNP cash-flow job (WeekendCash). This is the clearest "reshape, don't retire" candidate in Track C.
- **Prototype-3 fails the filter** on the Clover-CNP lens (B2B, not CNP). It may still be a valid Commerce Hub bet but it doesn't belong in this workstream's portfolio. Phase 3 panel will confirm.
- **Prototype-4 probably fails the filter** on the Clover-SMB lens (the customer is a CommerceHub enterprise merchant, not a Clover SMB). Panel will confirm.
- **The breadth pass validated verticalizing on restaurants + services** but surfaced one horizontal job (settlement speed / AR collapse) that cuts across segments. That's the WeekendCash opportunity.
- **Two jobs I initially expected to matter didn't survive the filter**: (a) pay-at-table / QR is a card-solved problem with no stablecoin lever, (b) cart recovery is more of a marketing-channel problem than a payments problem. Noting this explicitly so Phase 3 doesn't resurrect them.

---

## Open questions carried into Phase 3

1. **How does the Fiserv-Mastercard Agent Pay integration actually land at the Clover POS layer?** The 2025 announcement is corporate; the specific merchant-UX and ticket-flow mechanics aren't public. This shapes whether R3/S3/Clover Concierge Inbox is a thin integration or a heavy build.
2. **Distributor buy-in for P3 is still the Drucker question** — but only matters if Phase 3 panel argues P3 should be reshaped into something that serves a CNP job. Otherwise it falls out of scope.
3. **WeekendCash pricing** — does the merchant economic benefit of earlier settlement on weekends/holidays need to be funded by a per-transaction fee, a bank-side spread, or a Fiserv subsidy? This is critical to whether it's a real product or a loss leader.
4. **Regulatory framing of "merchant AR collapse"** — Clover Net-Zero probably runs into TILA/Reg Z territory if it looks like a lender. Needs a compliance review before it goes to prototype.
5. **Agent-Shield Chargeback evidence** — does the Mastercard Agent Pay tokenization actually create network-side dispute protection that Clover can monetize, or is the lift marginal relative to Secure Card on File?
