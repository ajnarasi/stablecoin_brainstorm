# Agent Order Translation Layer — Spec

*The load-bearing component of Clover Direct. Translates agent intent payloads from ACP, AP2, and Mastercard Agent Pay into Clover Platform API order structures with correct line items, modifiers, tip, delivery metadata, and totals.*

## Why this exists

Phase 4 research (V2) established that the Fiserv-Mastercard Agent Pay integration announced December 2025 operates at the **acceptance / tokenization layer**, not at the **order-context layer**. The integration makes every Clover merchant tokenized-card-payable by an AI agent — but it does not create a corresponding Clover order with line items, modifiers, tip, or delivery details. Something has to sit between the agent-layer protocols (which carry rich purchase intent) and the Clover Platform API (which can receive rich orders), and that something is this spec.

Without this component, Clover Direct is just "tokenized card acceptance from an agent" — indistinguishable from any other card-on-file transaction. With it, Clover Direct becomes "every Clover merchant receives agent orders as normal POS tickets, with the same modifiers and tip structure a walk-in would have."

## Inputs

### 1. ACP (OpenAI Agentic Commerce Protocol) payload — shape

```json
{
  "protocol": "acp",
  "protocol_version": "2026-01-30",
  "agent": { "id": "chatgpt://openai/plus-user-abc", "user_verified": true },
  "merchant_id": "clover_merchant_luigis_pizzeria_1",
  "intent": "purchase",
  "items": [
    {
      "sku": "LGI-PEPPERONI-LG",
      "title": "Large Pepperoni Pizza",
      "quantity": 1,
      "unit_price_cents": 1799,
      "modifiers": [
        { "id": "EXTRA-CHEESE", "title": "Extra cheese", "price_cents": 200 },
        { "id": "THIN-CRUST", "title": "Thin crust", "price_cents": 0 }
      ]
    },
    { "sku": "LGI-GARLIC-KNOTS", "title": "Garlic knots (6)", "quantity": 1, "unit_price_cents": 599, "modifiers": [] }
  ],
  "fulfillment": {
    "type": "delivery",
    "address": { "line1": "221 Baker St", "city": "New York", "state": "NY", "zip": "10014" },
    "requested_time": "2026-04-09T19:30:00-04:00"
  },
  "tip": { "percent": 18, "amount_cents": 432 },
  "payment": {
    "method": "mastercard_agent_pay_token",
    "token": "ntk_xxx_tokenized",
    "authorized_amount_cents": 3030
  }
}
```

### 2. AP2 (Google) payload — shape

Same semantic structure with AP2's field naming. Converted to a normalized internal form before translation.

### 3. Mastercard Agent Pay payload — shape

Mastercard Agent Pay's payload is **tokenization-forward** — it carries the authenticated agent identity, the tokenized credential, and a purchase-intent blob. The items list in the Mastercard payload may be sparser than ACP/AP2 — in which case the translation layer either (a) requests enrichment from the agent via a callback, or (b) falls back to a single line-item order with a total only. Fallback case should be rare but the layer must handle it gracefully.

## Output — normalized Clover Platform API order

The Clover Platform API supports single-call order creation with line items, modifiers, discounts, and service charges. See Clover developer docs at `https://docs.clover.com/dev/docs/working-with-orders`.

The translation layer's job is to produce a single JSON payload matching Clover's `POST /v3/merchants/{mId}/orders` request body with all sub-resources populated:

```json
{
  "state": "open",
  "title": "Agent order — ChatGPT",
  "note": "Placed via AI agent (ACP 2026-01-30). Delivery requested 7:30pm.",
  "lineItems": [
    {
      "item": { "id": "LGI-PEPPERONI-LG" },
      "name": "Large Pepperoni Pizza",
      "price": 1799,
      "modifications": [
        { "modifier": { "id": "EXTRA-CHEESE" }, "name": "Extra cheese", "amount": 200 }
      ]
    },
    {
      "item": { "id": "LGI-GARLIC-KNOTS" },
      "name": "Garlic knots (6)",
      "price": 599
    }
  ],
  "serviceCharges": [
    { "name": "Delivery fee", "amount": 299 }
  ],
  "discounts": [],
  "orderType": { "taxable": true, "isDefault": false, "label": "Delivery", "id": "DELIVERY" },
  "tip": { "amount": 432 },
  "customers": [
    { "firstName": "ChatGPT User", "note": "Agent-authenticated via Mastercard Agent Pay token ntk_xxx" }
  ],
  "total": 3329
}
```

The layer also issues a secondary call to attach the tokenized payment:

```
POST /v3/merchants/{mId}/orders/{orderId}/payments
{
  "amount": 3329,
  "tipAmount": 432,
  "external_payment_id": "mastercard_agent_pay::ntk_xxx",
  "metadata": {
    "agent_protocol": "acp",
    "agent_id": "chatgpt://openai/plus-user-abc",
    "mandate_ref": "mdr_abc123"
  }
}
```

## Translation logic

### 1. Protocol normalization

```
acp_payload | ap2_payload | mc_agent_pay_payload
          ↓          ↓              ↓
       NormalizedAgentIntent  (internal struct)
          ↓
     clover_order_payload
```

Normalize first, translate second. Every new agentic protocol is one adapter on the input side; the core translation logic does not change.

### 2. Line item mapping

- Match `sku` / `product_id` against the merchant's Clover catalog via `GET /v3/merchants/{mId}/items?filter=sku={sku}`.
- On match: use the Clover item ID, apply modifiers by matching modifier `id`/`title` against `GET /v3/merchants/{mId}/items/{itemId}/modifier_groups`.
- On partial match: use the matched item with a translation-confidence score; log the mismatch.
- On no match: fallback to a line item with just `name` and `price`, flagged with `translation_confidence: "low"` — the order is created but marked for merchant review.

### 3. Modifier and option handling

- Clover's modifier model is hierarchical: modifier groups contain modifiers. Translation must pick the correct group for each modifier (e.g., "crust type" group for "thin crust").
- Agent payloads from ACP may reference modifiers by title alone; AP2 may include a modifier ID. Normalize to title+price match.
- Merchants who have custom modifier groups (most do) need a merchant-specific mapping cache to avoid repeated Platform API lookups per order. Cache invalidates on catalog updates.

### 4. Tip handling

- Agent payloads may specify tip as percent, amount, or both. Always resolve to `amount_cents`.
- Clover stores tip on the order's payment, not on the order header. Translation splits into (a) order creation with `tip.amount` on the header for display, (b) payment attachment with `tipAmount`.

### 5. Fulfillment / delivery metadata

- Delivery type: maps to Clover `orderType.label = "Delivery"` with a reference ID that the merchant has configured for their delivery order type.
- Delivery address: stored in `customers[].addresses` and `order.note`.
- Requested time: stored in `note` at MVP; promoted to a structured field if Clover adds one.
- Pickup/dine-in: map to the equivalent `orderType` the merchant has configured.

### 6. Tax

- Clover calculates tax on the order based on the merchant's tax rules. The translation layer submits prices without tax and lets Clover compute. Translation must reconcile the agent's `authorized_amount_cents` against Clover's computed total; if they mismatch by more than a few cents, the layer can (a) accept the smaller amount and absorb the rounding delta, or (b) reject the order for manual review. Default: accept up to $0.10 delta, reject above.

### 7. Totals validation

- Translation layer re-computes: `sum(line items) + sum(modifiers) + sum(service charges) + tax + tip = total`.
- Cross-checks against the agent's declared `authorized_amount_cents`.
- Mismatch > tolerance → reject with clear error.

## Failure modes

| Failure | Detection | Response |
|---|---|---|
| SKU not found in merchant catalog | Catalog query returns empty | Create order with fallback line item; flag `translation_confidence: low` |
| Modifier not found | Modifier group query returns empty | Attach modifier by name only; flag; merchant reviews |
| Tax mismatch beyond tolerance | Total comparison | Reject order, return error to agent with reason |
| Merchant catalog cache stale | Repeated mismatches on common SKUs | Force cache refresh, retry once |
| Clover Platform API 5xx | HTTP status | Retry with exponential backoff (max 3 tries); if still failing, surface to Fiserv ops and return "order unavailable" to agent |
| Mastercard Agent Pay token invalid | Payment attach returns failure | Reject order, return error to agent, flag for fraud review |
| Tip amount > authorized amount | Total comparison | Reject order |

## Instrumentation

Every translation attempt logs:

- `translation_id`, `agent_protocol`, `agent_id`, `merchant_id`
- `input_payload_hash`, `normalized_intent_hash`
- `clover_order_id` (if successful), `clover_payment_id` (if successful)
- `translation_confidence` (high / medium / low)
- `total_validation_result` (match / within_tolerance / mismatch)
- `latency_ms` (target: <500ms for the translation itself; total order-to-POS latency <10s including Clover API round-trip)
- `failure_reason` (if applicable)

Dashboard views (Fiserv ops):
- Translation success rate by protocol, by merchant vertical
- Mean and p99 translation latency
- Confidence distribution
- Top 10 merchants with low-confidence translation (catalog quality signal)

## Demo fixtures

The prototype-5 backend ships with fixture payloads for three scenarios:

1. **`fixtures/acp_luigis_pepperoni.json`** — ACP payload for a large pepperoni pizza order with modifiers, delivery, and tip. Used in the Clover Direct cinematic showcase scene.
2. **`fixtures/ap2_blue_orchid_massage.json`** — AP2 payload for a booking with deposit. Used in the SmartDeposit cinematic showcase scene.
3. **`fixtures/mc_luigis_fallback.json`** — Mastercard Agent Pay payload with a sparse items list, triggering the fallback path and demonstrating the graceful degradation.

## Phase 5 build checklist

- [ ] Protocol adapters: ACP, AP2, Mastercard Agent Pay (3 adapters, 1 shared normalized type)
- [ ] Clover catalog + modifier cache
- [ ] Core translation function
- [ ] Totals validation
- [ ] Failure-mode handling for all cases above
- [ ] Order creation via Clover Platform API (demo mode with `shared/finxact-client`-style fallback)
- [ ] Payment attachment via Clover Platform API
- [ ] Instrumentation and dashboard stubs
- [ ] Fixture test suite covering the three demo scenarios plus edge cases
- [ ] Integration with Clover Agent Checkout backbone (reshaped prototype-2) Gateway

## Dependencies

- **Clover Platform API access** (existing)
- **Reshaped prototype-2 Gateway** as the ingress for all agent payloads
- **Mastercard Agent Pay tokenization payload documentation** — Fiserv-internal, not public
- **Merchant catalog completeness** — merchants with sparse or unstructured catalogs will get more low-confidence translations; Phase 5 must not block on perfect catalogs but should instrument the quality
