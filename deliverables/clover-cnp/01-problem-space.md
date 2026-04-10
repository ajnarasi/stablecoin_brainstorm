# Phase 1 — Problem Space (External Scan)

*Date: 2026-04-09. Workstream: FIUSD + agentic commerce as a CNP growth vector for Clover. Verticals in scope: restaurants and services.*

## Executive summary

- **Clover's CNP problem is structural, not just product.** Clover runs ~$329B annualized GPV across ~700K merchants, but restaurants are its largest vertical and the platform was built card-present-first. Public Fiserv disclosures do not break out e-comm/CNP share — that opacity is itself a tell. Toast and Shopify openly publish digital-channel mix; Fiserv does not.
- **Toast has already won the "shift from third-party marketplaces to native digital" narrative** in restaurants with commission-free online ordering, Order with Google, and Local by Toast — the exact wedge Clover needs to attack. Clover's online ordering is a feature; Toast's is a product line.
- **FIUSD is real but not merchant-facing.** Launched June 2025 as a bank-and-FI infrastructure play, runs on Solana, Paxos+Circle reserves, interoperable with PYUSD and on Mastercard's network. There is no public path today for a Clover SMB to accept FIUSD at checkout. Roughrider Coin (ND) is the first state issuance, 2026. The merchant-acceptance story is a roadmap, not a product.
- **The GENIUS Act (signed July 18, 2025) is the unlock**, not the constraint. It establishes federal payment-stablecoin issuer licensing, and arguably preempts state money-transmitter regimes for compliant issuers — which is precisely why Fiserv could move. The hard part now is bank-sponsorship plumbing on the merchant-acceptance side, not legality.
- **Agentic commerce is past vaporware but pre-volume.** OpenAI/Stripe ACP is shipping (Etsy live, Shopify rolling), Visa Trusted Agent Protocol pilots in early 2026, Mastercard Agent Pay went live in Australia/ASEAN April 2026 with global rollout. Coinbase x402 has Linux Foundation backing but ~$28K/day onchain volume — real demand has not arrived.
- **Fiserv is already inside the agentic tent.** In December 2025 Fiserv announced integration of Mastercard's Agent Pay Acceptance Framework into Clover, becoming one of the first major acquirers to do so. This is the strategic surface area for the workstream — Clover merchants will be agent-payable at the network rail level before they can accept FIUSD natively.
- **The friction money is in approval rates, marketplace commissions, and no-shows — not chargebacks.** CNP auth rates run ~10pp below CP (75% vs 85%), CNP fraud rates are ~15x CP (0.93% vs 0.06%), restaurants pay 20–30% to DoorDash/Uber Eats (effective 40%+ all-in), and beauty salons see 10–20% no-show rates costing meaningful revenue. These are the leak points a stablecoin + agent stack can plausibly address.
- **The honest opportunity framing**: FIUSD is a 2027 settlement story for Clover merchants; agentic commerce (via Mastercard Agent Pay rails Fiserv already integrated) is the 2026 story. The two should be sequenced, not bundled.

## 1. Clover CNP competitive position

**Scale.** Clover serves ~700K merchants across 8 countries with $329B annualized 4Q25 GPV. Fiserv guides Clover revenue to $4.5B in 2026 with 10–15% GPV growth. Clover represents ~25% of Fiserv's merchant segment revenue but is expected to drive ~75% of segment growth through 2026. Value-added services hit 27% of Clover revenue (up 5pp YoY).

**Vertical mix.** Restaurants are Clover's largest vertical, followed by retail and services (beauty, home, professional). Fiserv has explicitly targeted restaurants "because of the size and scale of that vertical." Specific vertical % splits are not publicly disclosed.

**CNP/e-comm share.** **Not publicly disclosed.** No Fiserv investor disclosure breaks Clover GPV by CNP vs CP, or by online vs in-person channel. By comparison, Toast and Shopify both openly publish digital-channel metrics. The absence is informative — if Clover had a strong CNP story, it would tell it. Industry estimates from third-party analysts suggest Clover is meaningfully under-indexed on CNP relative to Square (which has been building Square Online for a decade) and Shopify (e-commerce native).

**Product surface.** Clover Online Ordering, Clover Go (mobile/keyed entry), invoicing, and a hosted checkout via Clover Ecommerce Gateway (positioned through Wells Fargo and other bank channels). CNP pricing is 3.5% + $0.15 — high enough that it's a pricing-driven friction in itself for merchants comparing to Stripe (2.9% + $0.30) or Square Online. The Clover developer docs treat e-commerce more as a card-testing-fraud-management problem than as a growth surface — a revealing posture.

**Competitive gaps:**
- **Toast** has built a coherent restaurant-CNP product line: native commission-free Toast Online Ordering, Order with Google, Local by Toast consumer app. Toast pitches a $36K/year savings vs third-party marketplaces — that's the explicit value prop Clover lacks. Toast also has KDS, delivery dispatch, and a vertically-integrated stack Clover answers with apps from third parties.
- **Square** dominates SMB onboarding UX, has Square Online (Weebly-derived), Square Invoices, Cash App pay-link integration, and Afterpay BNPL. Square's CNP product is mature and embedded in seller acquisition.
- **Shopify** is the e-commerce native and has now flipped the script — Shopify POS is going after retail floors, and Shopify is the first commerce platform integrated with the OpenAI/Stripe ACP and is co-developing UCP with Google. Shopify has the cleanest agentic commerce story in the SMB space.

**The strategic bottom line for Clover CNP**: the platform is a card-present POS with bolted-on online tools, in a market where the leader (Toast in restaurants, Shopify in retail) has built CNP as a first-class product category. There's no obvious organic catch-up path through feature parity alone — which is why an agentic-commerce + stablecoin angle is interesting: it lets Clover redefine the field rather than catch up on it.

## 2. FIUSD state of play

**Launch.** Fiserv announced FIUSD on June 23, 2025. Issued via the Paxos and Circle infrastructure, deployed on Solana initially. Positioned as a bank-and-FI digital-asset platform, not a consumer or merchant product.

**Partnership stack:**
- **Paxos & Circle**: reserve and issuance infrastructure
- **PayPal**: announced interoperability with PYUSD — funds can move between FIUSD and PYUSD, and FIUSD is reachable from PayPal user balances
- **Mastercard**: integrating FIUSD across Mastercard's network products, alongside USDG (Paxos), PYUSD, and USDC. Mastercard claims FIUSD will be "available to more than 150 million merchants" — this is the network's framing, not a deliverable date for Clover SMBs
- **USDG consortium**: Mastercard joined the Global Dollar Network alongside FIUSD/PYUSD/USDC support
- **Bank of North Dakota**: first state issuance — Roughrider Coin, available to ND banks/credit unions in 2026

**Regulatory state.** The **GENIUS Act** was signed by President Trump on July 18, 2025 (passed Senate 68–30 June 17, House July 17). It is the first US federal digital-assets law and creates a federal payment-stablecoin issuer regime. Critical points for this workstream:
- Establishes "permitted payment stablecoin issuer" license — issuers must hold 1:1 reserves in cash/Treasuries
- FDIC has issued proposed rules for FDIC-supervised institutions seeking issuer status
- K&L Gates analysis flags that the Act may **preempt state money-transmitter licensing** for compliant federally-licensed issuers — a massive friction reduction if it holds
- **MiCA** in the EU remains the binding constraint on any cross-border story; FIUSD has no public MiCA pathway

**Merchant onboarding readiness — the honest answer.** Today, a Clover merchant cannot accept FIUSD at checkout. The "merchant" in Mastercard's "150 million merchants" framing means *Mastercard's network reach for settlement-side stablecoin handling* — not consumer-pays-FIUSD-at-Clover-terminal. The publicly available paths a Clover merchant could realistically touch FIUSD in the next 12 months are:
1. **Settlement-side**: Fiserv settles a merchant in FIUSD instead of fiat ACH (24/7, programmable, faster cash flow). Plausible for 2026.
2. **B2B / supplier rails**: Clover merchants pay suppliers in FIUSD via a connected business banking surface. Plausible for late 2026.
3. **Consumer-acceptance at checkout**: Requires wallet UX, on-ramp, dispute/chargeback equivalence rules. **Not 2026.** This is 2027+ and requires wallet-side ubiquity Clover does not control.

**Constraints to flag:**
- Bank-sponsorship plumbing for merchant settlement remains the key operational constraint
- Stablecoin chargeback/dispute equivalence is unsolved — if a customer pays in FIUSD and disputes, who unwinds? Card networks have 60+ years of dispute machinery; stablecoin rails do not
- Tax treatment for merchants (cost basis tracking) is friction, though GENIUS Act guidance is expected to address this
- The on-ramp problem: consumers don't hold FIUSD in their phone wallets, so any consumer-facing acceptance flow needs an embedded fiat-to-FIUSD on-ramp at checkout, which adds latency

## 3. Agentic commerce protocol landscape

A scorecard as of April 2026:

| Protocol | Sponsor | Status | Real production volume? |
|---|---|---|---|
| **ACP** | OpenAI + Stripe | Live; Etsy in production in ChatGPT, Shopify rolling out; multiple spec versions through 2026-01-30 | Yes — early but real |
| **AP2** | Google | Spec released Sept 2025, 60+ partners | No public consumer-facing product; spec/sandbox only |
| **UCP** | Shopify + Google | Announced 2026; broader scope than ACP | Pre-production |
| **x402** | Coinbase + Linux Foundation | Foundation formally established April 2, 2026; Stripe, Cloudflare, Shopify, Solana as founding members | ~$28K/day onchain volume; mostly testing/gamed. Demand is not there. |
| **Visa Trusted Agent Protocol / Visa Intelligent Commerce** | Visa | Announced Oct 2025; APAC + Europe pilots early 2026; 100+ ecosystem partners | Pilot only |
| **Mastercard Agent Pay** | Mastercard | Announced April 2025; LatAm launch Dec 2025; ASEAN/Australia live April 2026; US issuers enabled Nov 2025; global rollout in progress | Live in select markets; first authenticated transactions in Australia (Event Cinemas, Thredbo accommodation) |

**The signal that matters for this workstream**: in **December 2025**, **Fiserv announced integration of Mastercard Agent Pay Acceptance Framework into Clover**. Per the announcement, "merchants using Fiserv's acceptance infrastructure, including its Clover point-of-sale and eCommerce platforms, can accept agent-initiated payments without modifying checkout experiences or backend systems." Fiserv is also acting as a network token requestor and integrating Mastercard's Secure Card on File. This is the most important fact in the entire scan.

Fiserv has separately committed to supporting both Visa and Mastercard agentic protocols — making Clover one of the first acquirers to be protocol-multi-homed.

**SMB acquirer/POS integrations:**
- **Shopify** — first POS/commerce platform with ACP (OpenAI/Stripe) live, also co-developing UCP with Google
- **Stripe** — co-author of ACP, deepest production integration
- **Square** — no public ACP/AP2/Agent Pay integration as of April 2026. Notable absence.
- **Toast** — no agentic commerce integration as of April 2026. Also notable.
- **Clover/Fiserv** — Mastercard Agent Pay integration announced, Visa Intelligent Commerce alignment

**This means Clover may genuinely be ahead of Toast and Square on agentic commerce rails**, despite being behind on conventional CNP product. That's the asymmetry to lean into.

**What's vaporware vs real:**
- **Real**: ACP (Etsy live), Mastercard Agent Pay (live in AU/ASEAN), Fiserv-Mastercard Clover integration (announced, plumbing in progress)
- **PR-substantial-but-pre-volume**: Visa Trusted Agent (pilots), x402 (foundation but no demand), AP2 (spec, no live consumer product)
- **Spec-only**: UCP

## 4. SMB CNP friction — where the money leaks

**Approval rate gap:**
- CNP auth rates run roughly 10 percentage points below CP — typical CP ~85%, CNP ~75%
- ~30% of CNP declines are estimated to be false declines on legitimate transactions
- Every percentage point of CNP auth rate improvement is pure-margin recovered revenue

**Fraud and chargebacks:**
- CNP fraud rate ~0.93% of transaction value vs CP ~0.06% — roughly 15x higher
- CNP chargeback rates 0.6–1.0% vs CP ~0.5%
- Global CNP fraud losses projected ~$28.1B by 2026 (40% increase from 2023)
- US merchants lose ~$4.61 for every $1 of actual fraud when including fees, labor, and lost merchandise
- SMBs reportedly spend ~12% of annual e-commerce revenue on managing payment fraud
- Average chargeback cost ~0.47% of total revenue annually

**Cart abandonment:**
- Overall e-commerce cart abandonment ~70.22% in 2026
- Mobile 80.02%, desktop 66.41% — and SMB CNP traffic skews mobile
- Food & beverage specifically ~63.62%
- Top causes: hidden fees, forced account creation, complex checkout

**Restaurant-specific pain:**
- **DoorDash standard commission ~28%, Uber Eats Plus 25% (30% for Uber One subscribers, up from prior 25%), Lite tier moved from 15% to 20% in 2025**
- All-in cost of third-party delivery exceeds 40% of revenue when hidden fees, marketing fees, and indirect costs are factored
- This **eats most or all of restaurant operating margin** on delivered orders — Toast pitches $36K/year per location savings by switching to native online ordering
- Catering and gift cards: high ticket sizes, often manually invoiced or processed off-rails

**Services-specific pain:**
- Beauty salon no-show rates 10–20% industry average; deposit-protected salons reduce no-shows by 29–70%
- UK salons alone reportedly lose £1.6B/year to no-shows; ~£39 average per missed appointment
- Deposits typically 50% of service value or flat $50 — but charging deposits requires CNP infrastructure salons often lack
- Services merchants also struggle with: invoicing latency (Net 30 cash conversion), recurring payment failures, and dispute exposure on appointment-based revenue

## Problem tree (root causes → intervention points)

**Root problem**: Clover merchants under-monetize CNP relative to category leaders.

**Layer 1 — Why is CNP share low?**
- Clover product surface treats e-comm as bolt-on, not core (intervention: product investment in checkout/online ordering)
- Restaurants funnel digital demand through DoorDash/Uber Eats at 25–30% commission, leaving Clover/native channels under-utilized (intervention: agent-and-stablecoin-powered alternative ordering channels)
- Services merchants don't capture deposits and pre-pays because checkout friction exceeds the perceived no-show cost (intervention: one-click agentic deposits)

**Layer 2 — Why is CNP economics worse than CP?**
- 10pp lower auth rates → revenue leak (intervention: network token + Secure Card on File via Mastercard Agent Pay framework Fiserv just integrated)
- 15x higher fraud rates → margin leak (intervention: agent-based authentication binds intent to credential, raising baseline fraud signal quality)
- Chargeback exposure → ops cost (intervention: agentic mandates create cryptographic intent receipts that strengthen dispute defense)
- 70% cart abandonment → conversion leak (intervention: agent-mediated checkout removes hidden-fees / account-creation / form-friction failure modes)

**Layer 3 — Why can't FIUSD fix this directly today?**
- No consumer wallet ubiquity for FIUSD
- No on-ramp at checkout
- No dispute equivalence with cards
- Bank sponsorship plumbing still maturing
- (Intervention: settlement-side and B2B-side first; consumer acceptance is a 2027+ play)

**Layer 4 — Where do FIUSD and agentic commerce *converge*?**
- AP2, ACP, and x402 all explicitly support stablecoin payment rails
- Merchant settlement in FIUSD becomes interesting *because* agentic checkout collapses the consumer-acceptance UX problem — agents can hold and pay in stablecoins where humans can't
- The 2026 wedge: agent-initiated payments funded by cards but settled to merchants in FIUSD, giving Clover merchants 24/7 programmable settlement without forcing consumer-side wallet adoption

## Implications for the Clover-CNP workstream

**Sequence the bets.** Treat agentic commerce and FIUSD as two distinct timelines that converge, not as a single bundled story. The agentic commerce wedge is 2026 — Fiserv has already integrated Mastercard Agent Pay into Clover, making Clover meaningfully ahead of Square and Toast on this rail. The FIUSD merchant-acceptance story is 2027+ on the consumer side, but **2026-actionable on the settlement side**: a Clover merchant settling in FIUSD instead of T+1 ACH gets 24/7 programmable cash flow, which is a tangible SMB benefit even if no consumer ever touches FIUSD. Phase 2/3 should explore both threads but should not pretend they ship together.

**Lean into the asymmetry.** Clover is behind on conventional CNP product (Toast owns restaurants, Shopify owns retail e-commerce), and trying to feature-match Toast on online ordering is a losing move. But Clover/Fiserv is **ahead on agent-initiated commerce rails** — the Mastercard Agent Pay integration is a real plumbing advantage neither Toast nor Square has publicly matched. The strategy should be to skip the catch-up generation and define the next one. Position Clover as the first SMB acquirer where merchants can accept payments from any agent (ChatGPT, Gemini, Claude, Perplexity Shopping, the new Apple Intelligence agent surfaces) without changing checkout. That is the sharpest available story.

**Restaurants: attack the marketplace tax.** Toast's $36K/year savings pitch against DoorDash/Uber Eats is the clearest existing wedge in the restaurant CNP space, and Clover currently has nothing equivalent. A "Clover Direct" product — agentic-commerce-enabled native ordering with ChatGPT/Gemini channels, FIUSD-settled to the merchant, dispute-protected via Mastercard Agent Pay tokenization — could leapfrog Toast's narrative because Toast doesn't have stablecoin or agentic rails today. The economics work even at 8–10% effective take-rate vs DoorDash's 28%+. This is the most concrete, revenue-quantifiable opportunity in the scan.

**Services: deposits and no-shows are the wedge.** Beauty/home/professional services merchants on Clover lose 10–20% of bookings to no-shows. A frictionless deposit primitive — request a deposit by text or via an agent, customer pays in one tap (card today, FIUSD-settled tomorrow), agentic protocol creates a cryptographic mandate that doubles as dispute defense — converts no-show losses directly to revenue. This is the highest-margin, fastest-to-prototype angle and should be a serious Phase 2 candidate. It also has the cleanest data story: "Clover merchants who turn on Smart Deposits see X% no-show reduction" is testable.

**Don't oversell FIUSD-at-checkout in the customer narrative.** The consumer-acceptance story for FIUSD is genuinely not ready, and pitching it to merchants in 2026 will create a credibility hole when the wallets aren't there. The credible 2026 FIUSD narrative is: (a) faster, programmable settlement for the merchant; (b) cheaper cross-border for merchants with international suppliers; (c) the rail that powers agent-to-merchant payment finality once agentic volumes ramp. Lead with agentic, treat FIUSD as the rail underneath.

**Open data gaps to plug in Phase 2.** The biggest research gap is Clover's actual CNP/e-comm share — Fiserv doesn't publish it and analyst estimates are imprecise. Phase 2 should try to triangulate via merchant surveys, channel-mix analysis from Clover app marketplace data, and direct internal data if available. A second gap is ACP/Agent Pay actual transaction volumes — public numbers are still PR-grade, and any business case will need real conversion lift evidence rather than projected.

## Sources

**Clover/Fiserv competitive position**
- [Fiserv Q3 2025 earnings release (SEC)](https://www.sec.gov/Archives/edgar/data/798354/000079835425000168/fiq325earningsrelease.htm)
- [Fiserv Q4 2025 financial results (Feb 2026)](https://investors.fiserv.com/node/52111/pdf)
- [Fiserv has ambitious goals for Clover — Payments Dive](https://www.paymentsdive.com/news/fiserv-clover-growth-goals-square-jack-dorsey-smb-merchant-pos-software-services/711202/)
- [Fiserv doubles down on Clover growth — Payments Dive](https://www.paymentsdive.com/news/fiserv-clover-ceo-frank-bisignano-growth-smb-pos-square-toast-payments/700160/)
- [Is Clover gaining share for Fiserv? — Payments in Full](https://paymentsinfull.substack.com/p/is-clover-gaining-share-for-fiserv)
- [Clover vs Square vs Toast — Payments in Full](https://paymentsinfull.substack.com/p/clover-vs-square-vs-toast)
- [Clover Ecommerce Gateway via Wells Fargo](https://www.wellsfargo.com/biz/merchant/payment-processing-options/clover-gateway-ecommerce/)
- [Toast Online Ordering product page](https://pos.toasttab.com/products/online-ordering)
- [Toast Digital Ordering solutions](https://pos.toasttab.com/solutions/digital-ordering)

**FIUSD and stablecoin regulation**
- [Fiserv launches FIUSD stablecoin — investor release](https://investors.fiserv.com/newsroom/detail/2848/fiserv-launches-new-fiusd-stablecoin-for-financial-institutions)
- [Fiserv FIUSD platform page](https://www.fiserv.com/en/solutions/embedded-finance/fiusd-stablecoin.html)
- [Fiserv launches new stablecoin — Payments Dive](https://www.paymentsdive.com/news/fiserv-launches-new-stablecoin-crypto-genius-act-trump-bitcoins/751317/)
- [Bank of North Dakota / Roughrider Coin](https://investors.fiserv.com/newsroom/detail/2868/bank-of-north-dakota-and-fiserv-partner-to-launch-roughrider-coin-north-dakotas-first-stablecoin)
- [Mastercard partners with Fiserv to accelerate stablecoin adoption](https://www.mastercard.com/us/en/news-and-trends/press/2025/june/mastercard-fiserv-stablecoin-adoption.html)
- [Mastercard joins USDG, supports PYUSD and FIUSD — Fortune Crypto](https://fortune.com/crypto/2025/06/24/mastercard-usdg-stablecoin-pyusd-fiused-paypal-fiserv/)
- [Mastercard expands stablecoin push — Coindesk](https://www.coindesk.com/business/2025/06/24/mastercard-expands-stablecoin-push-with-paxos-fiserv-and-paypal-integrations)
- [Payment fintechs push stablecoin tech for 2026 — American Banker](https://www.americanbanker.com/news/payment-fintechs-push-stablecoin-tech-for-2026)
- [GENIUS Act of 2025 — Latham & Watkins](https://www.lw.com/en/insights/the-genius-act-of-2025-stablecoin-legislation-adopted-in-the-us)
- [GENIUS Act — Wikipedia](https://en.wikipedia.org/wiki/GENIUS_Act)
- [GENIUS Act and state money-transmitter preemption — K&L Gates](https://www.klgates.com/The-GENIUS-Act-and-Stablecoins-Could-This-Replace-State-Money-Transmitter-Licensing-10-6-2025)
- [FDIC proposed rule for stablecoin issuance](https://www.fdic.gov/news/press-releases/2025/fdic-approves-proposal-establish-genius-act-application-procedures-fdic)

**Agentic commerce protocols**
- [ACP GitHub spec](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol)
- [Stripe ACP open standard blog](https://stripe.com/blog/developing-an-open-standard-for-agentic-commerce)
- [OpenAI Buy it in ChatGPT / Instant Checkout](https://openai.com/index/buy-it-in-chatgpt/)
- [Google AP2 announcement](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol)
- [AP2 GitHub](https://github.com/google-agentic-commerce/AP2)
- [Shopify Universal Commerce Protocol](https://shopify.engineering/ucp)
- [Coinbase x402 GitHub](https://github.com/coinbase/x402)
- [x402 Foundation launch — Cloudflare blog](https://blog.cloudflare.com/x402/)
- [Coinbase x402 demand not there yet — Coindesk](https://www.coindesk.com/markets/2026/03/11/coinbase-backed-ai-payments-protocol-wants-to-fix-micropayment-but-demand-is-just-not-there-yet)
- [Visa Trusted Agent Protocol developer page](https://developer.visa.com/capabilities/trusted-agent-protocol)
- [Visa Intelligent Commerce 2026 mainstream adoption](https://investor.visa.com/news/news-details/2025/Visa-and-Partners-Complete-Secure-AI-Transactions-Setting-the-Stage-for-Mainstream-Adoption-in-2026/default.aspx)
- [Visa expands Visa Intelligent Commerce across APAC](https://www.visa.com.sg/about-visa/newsroom/press-releases/visa-expands-visa-intelligent-commerce-across-asia-pacific-prepares-for-ai-commerce-pilot-by-early-2026.html)
- [Mastercard Agent Pay launch global](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html)
- [Mastercard Agent Pay live in Australia/ASEAN](https://www.mastercard.com/news/ap/en/newsroom/press-releases/en/2026/mastercard-accelerates-ai-powered-commerce-with-australia-s-first-authenticated-agentic-transactions-using-agent-pay/)
- [Fiserv integrates Mastercard Agent Pay — PYMNTS](https://www.pymnts.com/artificial-intelligence-2/2026/fiserv-mastercard-expand-partnership-to-enable-ai-initiated-commerce/)
- [Fiserv-Mastercard agentic commerce — BusinessWire](https://www.businesswire.com/news/home/20251222291522/en/Fiserv-and-Mastercard-Partner-to-Advance-Trusted-Agentic-Commerce-For-Merchants)
- [Fiserv adopts agentic protocols from Visa and Mastercard — Digital Transactions](https://www.digitaltransactions.net/fiserv-adopts-agentic-commerce-protocols-from-visa-and-mastercard/)

**SMB CNP friction data**
- [Chargeback statistics 2025 — Chargeflow](https://www.chargeflow.io/blog/chargeback-statistics-trends-costs-solutions)
- [Sift Q4 2025 Digital Trust Index](https://sift.com/index-reports-disputes-q4-2025/)
- [Approval vs authorization — Signifyd](https://www.signifyd.com/blog/approval-vs-authorization-transactions/)
- [Improving CNP approval rates — Mastercard Gateway](https://www.mastercard.com/gateway/expertise/insights/improving-cnp-approval-rates.html)
- [Cart abandonment 2026 — Baymard](https://baymard.com/lists/cart-abandonment-rate)
- [Hidden costs of third-party delivery — ActiveMenus](https://activemenus.com/the-hidden-costs-of-third-party-delivery-what-restaurant-owners-really-pay-and-how-to-calculate-your-true-roi/)
- [Uber Eats commission breakdown — UpMenu](https://www.upmenu.com/blog/uber-eats-commission/)
- [Salon no-show statistics — Shortcuts](https://shortcutssoftware.com/the-1-way-to-cut-salon-no-shows-by-up-to-70/)
- [Salon deposit policy — GlossGenius](https://glossgenius.com/blog/salon-deposit-policy)
