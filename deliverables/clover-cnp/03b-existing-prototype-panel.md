# Phase 3 — Panel Verdicts on Existing Prototypes (Track C)

*Panel: Christensen, Porter, Drucker, Godin, Kim & Mauborgne, Collins, Taleb, Meadows, Doumont. Each of the 4 shipped prototypes runs through the explicit question: "If you were starting today with the Clover-CNP north star, would you build this, reshape it, or kill it?" Verdicts are in the expert's own voice. The prior panel verdicts in 01b-existing-prototypes-baseline.md are referenced but may be overridden by the new lens.*

---

## prototype-1 — Merchant Yield Sweep

**Reminder**: AI-driven sweep of idle SMB settlement balances into FIUSD to earn yield, with decision gate + unsweep safeguards. Prior panel score 9/10.

**Panel question**: *Starting today with the Clover-CNP north star — build, reshape, or kill? And is WeekendCash the right reshape?*

**Christensen**: **Reshape.** The JTBD analysis in Phase 2 is clear — merchants weren't hiring a "yield product," they were hiring "make my weekend not be broke." The original prototype aimed at the wrong job. WeekendCash is the correct reshape because the *code* survives but the narrative rotates onto a job merchants actually feel. Yield-on-idle was a story Fiserv told; Saturday money is a story merchants will tell each other.

**Porter**: **Reshape.** The old framing put Fiserv in a competitive race with treasury products, money-market funds, and neobank yield features — a race against specialists with structurally lower costs. WeekendCash puts Fiserv in a race against *itself* and the acquiring market's status-quo of T+1/T+2 ACH. That's a race Fiserv can win because it owns the rails. Reshape.

**Drucker**: **Reshape — but the cross-BU ownership problem I flagged the first time is still unsolved.** P1 had three BUs touching it (Clover, CommerceHub, Finxact) and no single owner. WeekendCash has the same structure and will fail the same way unless a single P&L owner is named before Phase 5 starts. My verdict conditional: reshape to WeekendCash, **but only if a named owner exists**. Otherwise kill.

**Godin**: **Reshape, enthusiastically.** "Saturday money, on Saturday" is the most viral SMB payments pitch I have seen in years. Yield-sweep had the wrong hook. WeekendCash has the best hook. Same code, better story, 10x the demo energy.

**Kim & Mauborgne**: **Reshape.** The ERRC grid on yield-sweep was: raise yield, reduce idle. That put Fiserv in a crowded ocean. The ERRC grid on WeekendCash is: eliminate weekend float, reduce calendar-time friction. Different ocean. Reshape.

**Collins**: **Reshape.** Yield-sweep wasn't a hedgehog fit — Fiserv's "best in the world" is acquiring, not treasury management. WeekendCash is a hedgehog fit — "move money faster than anyone else can for SMBs" is the purest expression of the acquirer's job. Reshape.

**Taleb**: **Reshape, with the hardest non-negotiables I've put on any product in this review.** Yield-sweep had catastrophic downside from aggressive sweep + liquidity shortfall. WeekendCash has catastrophic downside from promised-but-failed same-day settlement. The shape of the fragility is different but the magnitude is the same. My safeguards transfer: Fiserv balance-sheet backstop within 60 minutes on SLA miss, 99.9% auto-pause threshold, conservative ramp. With those safeguards: reshape. Without: kill.

**Meadows**: **Reshape.** The leverage point was always the merchant's expectation of when money arrives, not the yield curve on idle balances. Yield-sweep fought the wrong loop. WeekendCash works with a real behavioral loop (merchants rewire cash flow expectations around same-day settlement). Reshape.

**Doumont**: **Reshape, and rename it now, not later.** "Merchant Yield Sweep" is dead as a brand the moment the reshape lands. "WeekendCash" is acceptable but I prefer **"SaturdayCash"** because it names the *exact day* the merchant feels the pain. Saturday is the hook; cash is the noun. Pick it now; don't let the old brand linger through Phase 5 and infect the demo copy.

**Consensus verdict**: **RESHAPE → WeekendCash (or SaturdayCash per Doumont).** 9-0 agreement that the reshape direction is correct. 3 conditional votes (Drucker, Taleb) that require specific safeguards before Phase 5 ship. 1 naming recommendation (Doumont). The original yield-sweep framing is retired.

---

## prototype-2 — Pay-by-Agent x402

**Reminder**: Gateway + Verifier + Settler for HTTP 402 agent payments with bank-verified identity, EIP-3009 signatures, Solana settlement. Prior business panel 10/10, prior spec panel 6.3/10 (highest demo risk). Not yet integrated into demo-app.

**Panel question**: *Starting today with the Clover-CNP north star — build, reshape, or kill? And is "Clover Direct's backbone" the right reshape?*

**Christensen**: **Reshape.** This is the single most important prototype in the portfolio when viewed through the Clover-CNP lens, and the single most mis-positioned in its current form. The original story was "enterprise API developers building AI agents." The reshape is "Clover merchants receive orders from any AI agent without lifting a finger." Same gateway/verifier/settler, same bank-verified identity — different customer, different distribution model. This is the highest-leverage reshape in the portfolio.

**Porter**: **Reshape.** Competitive positioning of the original was hopeless — Stripe owns enterprise developer DX, Bridge, Privy, MPP, Tempo. Fiserv cannot win a developer-API fight against Stripe. But competitive positioning of the reshape is *the strongest in the portfolio* — Stripe has enterprise developer mindshare but doesn't have 700K Clover restaurants. The Mastercard Agent Pay integration is the rail; this prototype is the implementation layer on top of it. Reshape.

**Drucker**: **Reshape, but the scope must be cut hard.** Prior spec panel flagged this as the highest-complexity, tightest-feasibility prototype of the four. The reshape doesn't reduce the complexity — it shifts it. Must be paired with aggressive scope cuts (Solana only, EIP-3009 only, TypeScript only, constrained Claude agent) and a partnership with Anthropic or OpenAI for the demo agent. Without those, the reshape becomes a zombie that looks ambitious and ships nothing.

**Godin**: **Reshape.** The pitch reshapes too: *"Stripe: one merchant at a time. Fiserv: six million merchants overnight."* That comparison slide is still the strongest in the deck. The reshape just adds a second layer of story: *and those six million merchants are already enabled, because the Mastercard Agent Pay integration is live.*

**Kim & Mauborgne**: **Reshape.** Blue-ocean shift: the old framing put Fiserv in the "agent-commerce protocol" ocean, which is crowded (ACP, AP2, x402, UCP, MPP). The new framing puts Fiserv in an empty ocean — "SMB acquirer whose merchants are default-reachable by every agent." Nobody else is there. Reshape with urgency.

**Collins**: **Reshape.** Hedgehog fit is genuinely strong once the customer is the Clover merchant and not the developer. Acquiring is the hedgehog; distribution is the flywheel; this reshape serves both. Ship it.

**Taleb**: **Reshape with demo-risk discipline.** The prior spec panel flagged Claude agent non-determinism as a Black-Swan-level demo failure. Reshape doesn't change that. Demo must be *scripted*, the agent must be *constrained*, and the local Solana validator recommendation from the prior spec panel must be followed. If any of that slips, the reshape still ships but the demo doesn't — and in a demo-driven investor narrative, a demo that doesn't ship is a dead product.

**Meadows**: **Reshape — and treat the discovery graph as the missing half of the system.** This prototype is the *payment* layer of agent-initiated commerce. It is necessary but not sufficient. The other half is the *discovery* layer — which agents know which merchants exist. That's my Clover Direct observation repeated here. The prototype reshape handles the rail; the parallel discovery-graph workstream handles the demand. Both or neither.

**Doumont**: **Reshape. Rename.** "Pay-by-Agent x402" is three forms of noise stacked (a technical verb, a compound protocol name, and a number). **"Clover Agent Checkout"** or **"Agents Pay Clover"** — pick one, retire the old name today. Every use of the old name from Phase 5 onward is a delay in clarity.

**Consensus verdict**: **RESHAPE → Clover Direct's backbone (agentic inbound capability across Clover POS).** 9-0 agreement that this is the right reshape. Conditions: scope cut (Drucker + Taleb), discovery-graph parallel workstream (Meadows), rename (Doumont), partnership with Anthropic or OpenAI for the demo agent (Drucker). Prior panel 10/10 verdict stands as the *vision* verdict; this panel's reshape takes the same vision and corrects the positioning.

---

## prototype-3 — Instant Supplier Pay

**Reminder**: AI procurement agent monitors ingredient inventory, auto-generates POs to distributors (Sysco, US Foods), pays suppliers in FIUSD capturing 2-5% early-payment discounts. Prior business panel 7/10, prior spec panel 8.2/10 (lowest demo risk).

**Panel question**: *Starting today with the Clover-CNP north star — build, reshape, or kill?*

**Christensen**: **Retire from this workstream. Park as a Commerce Hub B2B side-bet, not a Clover-CNP product.** The JTBD here is real and painful — restaurant owners genuinely want to stop losing money on supplier payments. But the job is *B2B, not CNP*. Every dollar of energy spent shipping this is a dollar not spent on the CNP workstream that Phase 2 defined. This is a great product for the wrong program.

**Porter**: **Retire from this workstream.** The cannibalization math I flagged before is still true — every $50K/month of B2B card payments moved to FIUSD costs Fiserv $1,000-1,500 in lost interchange. That can be overcome if the FIUSD fee share is higher than the interchange delta, but the unit economics have never been modeled. And regardless: it doesn't grow Clover CNP share. Retire from this workstream and revisit in a separate Commerce Hub B2B program.

**Drucker**: **Retire from this workstream.** Layer in my prior objection too — Fiserv has never called Sysco or US Foods to confirm they'll accept FIUSD. Until that call is made, the addressable market is theoretical. But even if the call goes well, the product belongs in a B2B program, not a CNP program. Don't blur the mandate.

**Godin**: **Retire from this workstream but not from Fiserv's story.** There's a real pitch here — "restaurants auto-capturing $1,200 a month in early-payment discounts" — but it lives in a different investor narrative (B2B automation, working capital) than the CNP story Clover Direct is leading. Keep the asset; move it out of this program.

**Kim & Mauborgne**: **Reshape or retire.** There is a conceivable CNP-facing reshape: **flip the arrow.** Instead of the restaurant paying *its* suppliers in FIUSD, the restaurant's *customers* pre-pay large catering orders against a structured mandate, and the supplier pays get paid via the same primitive. But this pushes the product into SmartDeposit territory and doesn't need a separate stack. Retire as a standalone and keep the supplier-catalog code as an optional Phase 5 plug-in to SmartDeposit for catering.

**Collins**: **Retire from this workstream.** Hedgehog fit is weak for Clover-CNP. This is a vertical solution in the wrong program.

**Taleb**: **Retire from this workstream — but preserve the code.** Prior panel correctly called this the lowest-risk, highest-feasibility prototype of the four. It's a well-built asset. Don't throw it away. Park it cleanly in a Commerce Hub B2B bucket with its own story and its own metrics. Don't orphan it.

**Meadows**: **Retire from this workstream.** The feedback loop this prototype targets (sales → inventory depletion → auto-PO → early-pay discount) is a real and valuable loop, but it's an *operations* loop, not a CNP loop. Different system, different leverage point. Move it.

**Doumont**: **Retire from this workstream.** The story "Instant Supplier Pay" and the story "Grow Clover CNP share" do not belong on the same slide. Split them cleanly or both stories will be weakened by proximity.

**Consensus verdict**: **RETIRE from this workstream. PARK as a Commerce Hub B2B side-bet.** 9-0 agreement. The code and research are preserved. The product is removed from the Clover-CNP portfolio and from the Investor Day Clover-CNP narrative. It may still ship in 2026 under a different program owner.

**Dissent note**: Kim & Mauborgne offered a reshape path (flip the arrow into customer-side catering mandates) but immediately noted that the reshape collapses back into SmartDeposit and doesn't justify a standalone product. The panel accepts this as "preserve the supplier catalog code as a potential SmartDeposit plug-in" rather than a real reshape.

---

## prototype-4 — Cross-Border Instant Settlement

**Reminder**: Auto-detect cross-border transactions, lock FX rate, settle in FIUSD, 1-3 second settlement vs 3-5 day wire. Prior business panel 8/10, prior spec panel 7.3/10.

**Panel question**: *Starting today with the Clover-CNP north star — build, reshape, or kill?*

**Christensen**: **Retire from the Clover-CNP workstream; retain as a CommerceHub enterprise asset.** The JTBD is genuinely served — merchants with cross-border volume do want invisible conversion and fast settlement. But this merchant is a CommerceHub enterprise merchant, not a Clover SMB. The segments do not overlap meaningfully. Retire from this program.

**Porter**: **Retire from this workstream.** My previous analysis of the competitive intensity stands — cross-border is a red ocean (Stripe Bridge, Worldpay BVNK, Wise, Revolut, Airwallex). Fiserv's unique wedge is *embedded-in-CommerceHub invisibility*, but that wedge doesn't translate to Clover SMBs, who are 95%+ domestic. Keep as a CommerceHub enterprise asset; remove from the Clover-CNP portfolio.

**Drucker**: **Retire from this workstream.** The segment fit is wrong for Clover. There may be a small-but-real Clover SMB subset with international e-commerce volume (boutique online retailers, digital services), but it's too thin to justify a dedicated prototype. If the feature ships at all for Clover, it ships as an invisible back-end for the ~5% of Clover merchants with cross-border volume — not as a product with its own GTM.

**Godin**: **Retire the brand, retain the feature.** "Cross-Border Instant Settlement" is a CommerceHub pitch. There is no Clover SMB pitch here. If a Clover merchant with international volume benefits from the underlying rail, good — but they don't need to hear about it, and it's not the Clover demo.

**Kim & Mauborgne**: **Retire from Clover-CNP — and I want to note the blue-ocean observation we made the first time still holds for CommerceHub.** The "invisible cross-border settlement embedded in the acquiring platform" value innovation is real and differentiated from Wise/Bridge/BVNK. That story is still worth telling. It's just a *CommerceHub* story, not a Clover story.

**Collins**: **Retire from this workstream.** Hedgehog fit is wrong. Clover's best-in-the-world is not cross-border FX. This is the clearest retire in the portfolio.

**Taleb**: **Retire from this workstream, retain as CommerceHub asset.** FX slippage risk (5 bps on $10B volume = $5M/year) is real but well-bounded at CommerceHub enterprise scale and well-managed by existing tooling. At Clover SMB scale it's not worth the complexity. Retain where it fits; retire where it doesn't.

**Meadows**: **Retire from this workstream.** The leverage point for Clover CNP growth is the domestic agent channel, not the cross-border rail. Different system. Move it.

**Doumont**: **Retire from this workstream.** The Investor Day story is already complicated with four products (Clover Direct, SmartDeposit, WeekendCash, and the P2 reshape backbone). Adding "and also we do cross-border" dilutes every other message on the slide. Keep it for CommerceHub; drop it from Clover.

**Consensus verdict**: **RETIRE from the Clover-CNP workstream. RETAIN as a CommerceHub enterprise asset in a separate program.** 9-0 agreement. The code and the product positioning are kept alive for CommerceHub; they are removed from the Clover-CNP Investor Day narrative and from the Phase 5 build scope.

---

## Track C consolidated verdicts

| Prototype | Verdict | Direction |
|---|---|---|
| **P1 Yield Sweep** | **Reshape** | → WeekendCash (or SaturdayCash). Safeguards non-negotiable. Rename immediately. Single P&L owner required. |
| **P2 Pay-by-Agent x402** | **Reshape** | → Clover Agent Checkout / agentic inbound backbone for Clover Direct + SmartDeposit. Scope cut. AI-lab partnership. Discovery-graph parallel workstream. Rename. |
| **P3 Instant Supplier Pay** | **Retire from workstream** | Park as separate Commerce Hub B2B side-bet. Preserve code. Not a Clover-CNP product. |
| **P4 Cross-Border** | **Retire from workstream** | Retain as CommerceHub enterprise asset in a separate program. Not a Clover-CNP product. |

Phase 4 will take these verdicts plus the new-opportunity verdicts from `03-strategy-briefs.md` and produce the final retain / reshape / retire decision document (`05b-existing-prototypes-decision.md`) with rationale, new positioning, and archive instructions as applicable.
