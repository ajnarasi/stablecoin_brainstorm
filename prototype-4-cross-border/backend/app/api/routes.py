"""FastAPI routes for cross-border instant settlement prototype."""

import uuid
from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.detection.detector import CrossBorderDetector
from app.fx.engine import FXEngine
from app.models.schemas import (
    CorridorAnalytics,
    DashboardResponse,
    HealthResponse,
    LiveTransactionRequest,
    PaymentRequest,
    RateLockRequest,
    RouteComparisonSchema,
    SettlementResult,
    TransactionResponse,
)
from app.services.compliance_stub import ComplianceStub
from app.services.settlement_service import CrossBorderSettlementService
from app.services.transaction_simulator import TransactionSimulator

router = APIRouter()

# --- In-memory data store (replaces database for standalone demo) ---
_data_store: dict = {
    "merchants": {},
    "buyers": {},
    "transactions": {},
    "settlements": {},
    "fx_conversions": {},
    "route_comparisons": {},
}

# --- Service instances ---
fx_engine = FXEngine()
compliance = ComplianceStub()
detector = CrossBorderDetector()
settlement_service = CrossBorderSettlementService(
    fx_engine=fx_engine,
    compliance=compliance,
    demo_mode=True,
)
simulator = TransactionSimulator(merchant_currency="USD")


def get_data_store() -> dict:
    """Access the in-memory data store."""
    return _data_store


# ---------- Health ----------

@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        service="cross-border-settlement",
        version="0.4.0",
        demo_mode=True,
        timestamp=datetime.now(timezone.utc),
    )


# ---------- Transactions ----------

@router.get("/merchants/{merchant_id}/transactions")
async def get_transactions(
    merchant_id: str,
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
):
    """Get transaction history for a merchant (domestic + cross-border)."""
    store = get_data_store()
    if merchant_id not in store["merchants"]:
        raise HTTPException(status_code=404, detail="Merchant not found")

    txns = [
        t for t in store["transactions"].values()
        if t["merchant_id"] == merchant_id
    ]
    txns.sort(key=lambda t: t["created_at"], reverse=True)

    result = []
    for txn in txns[offset : offset + limit]:
        buyer = store["buyers"].get(txn["buyer_id"], {})
        comparison = store["route_comparisons"].get(txn["id"])
        result.append({
            **txn,
            "buyer_name": buyer.get("name"),
            "route_comparison": comparison,
        })

    return {
        "merchant_id": merchant_id,
        "total": len(txns),
        "offset": offset,
        "limit": limit,
        "transactions": result,
    }


@router.get("/merchants/{merchant_id}/cross-border")
async def get_cross_border_transactions(
    merchant_id: str,
    corridor: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
):
    """Get cross-border transactions only, optionally filtered by corridor."""
    store = get_data_store()
    if merchant_id not in store["merchants"]:
        raise HTTPException(status_code=404, detail="Merchant not found")

    txns = [
        t for t in store["transactions"].values()
        if t["merchant_id"] == merchant_id and t["is_cross_border"]
    ]

    if corridor:
        txns = [t for t in txns if t.get("corridor") == corridor]

    txns.sort(key=lambda t: t["created_at"], reverse=True)

    result = []
    for txn in txns[:limit]:
        buyer = store["buyers"].get(txn["buyer_id"], {})
        comparison = store["route_comparisons"].get(txn["id"])
        settlement = store["settlements"].get(txn["id"])
        result.append({
            **txn,
            "buyer_name": buyer.get("name"),
            "route_comparison": comparison,
            "settlement": settlement,
        })

    return {
        "merchant_id": merchant_id,
        "total_cross_border": len(txns),
        "corridor_filter": corridor,
        "transactions": result,
    }


@router.post("/merchants/{merchant_id}/payment")
async def process_payment(merchant_id: str, request: PaymentRequest):
    """Process a new payment, detecting cross-border and routing accordingly."""
    store = get_data_store()
    merchant = store["merchants"].get(merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    buyer = store["buyers"].get(request.buyer_id)
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")

    # Detect cross-border
    detection = detector.detect(
        buyer_currency=request.buyer_currency,
        merchant_currency=merchant["currency"],
        buyer_country=buyer["country"],
        merchant_country=merchant["country"],
    )

    # Create transaction
    txn_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"
    amount_usd = None

    if detection.is_cross_border and detection.stablecoin_route_available:
        # Process via stablecoin route
        settlement_result = await settlement_service.process_cross_border_payment(
            transaction_id=txn_id,
            buyer_name=buyer["name"],
            buyer_country=buyer["country"],
            buyer_currency=request.buyer_currency,
            merchant_currency=merchant["currency"],
            amount_local=request.amount_local,
        )
        amount_usd = settlement_result.amount_usd
        routing = "STABLECOIN"
        status = "COMPLETED"

        # Store settlement
        store["settlements"][txn_id] = {
            "id": settlement_result.indx_settlement_id,
            "transaction_id": txn_id,
            "method": settlement_result.method,
            "amount_usd": float(settlement_result.amount_usd),
            "fee_amount": float(settlement_result.fee_amount),
            "fee_pct": float(settlement_result.fee_pct),
            "settlement_time_seconds": settlement_result.settlement_time_seconds,
            "indx_settlement_id": settlement_result.indx_settlement_id,
            "status": "COMPLETED",
            "completed_at": settlement_result.completed_at.isoformat(),
        }

        # Generate route comparison
        comparison = await settlement_service.compare_routes(
            buyer_currency=request.buyer_currency,
            merchant_currency=merchant["currency"],
            amount_local=request.amount_local,
        )
        store["route_comparisons"][txn_id] = {
            "transaction_id": txn_id,
            "card_fee": float(comparison.card_fee),
            "card_fee_pct": float(comparison.card_fee_pct),
            "card_settlement_days": comparison.card_settlement_days,
            "stablecoin_fee": float(comparison.stablecoin_fee),
            "stablecoin_fee_pct": float(comparison.stablecoin_fee_pct),
            "stablecoin_settlement_seconds": comparison.stablecoin_settlement_seconds,
            "savings_amount": float(comparison.savings_amount),
            "savings_pct": float(comparison.savings_pct),
        }
    else:
        # Domestic or unsupported corridor -> card route
        fx_rate = simulator.FX_TO_USD.get(request.buyer_currency, Decimal("1.0"))
        amount_usd = (request.amount_local * fx_rate).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        routing = "CARD"
        status = "COMPLETED"

    txn = {
        "id": txn_id,
        "merchant_id": merchant_id,
        "buyer_id": request.buyer_id,
        "amount_local": float(request.amount_local),
        "amount_usd": float(amount_usd) if amount_usd else None,
        "buyer_currency": request.buyer_currency,
        "merchant_currency": merchant["currency"],
        "is_cross_border": detection.is_cross_border,
        "corridor": detection.corridor,
        "routing": routing,
        "status": status,
        "compliance_status": "PASSED",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    store["transactions"][txn_id] = txn

    response = {
        "transaction": txn,
        "detection": detection.model_dump(),
    }

    if detection.is_cross_border:
        response["settlement"] = store["settlements"].get(txn_id)
        response["route_comparison"] = store["route_comparisons"].get(txn_id)

    return response


# ---------- Route Comparisons ----------

@router.get("/merchants/{merchant_id}/comparisons")
async def get_route_comparisons(merchant_id: str):
    """Get route comparisons for all cross-border transactions."""
    store = get_data_store()
    if merchant_id not in store["merchants"]:
        raise HTTPException(status_code=404, detail="Merchant not found")

    cb_txn_ids = {
        t["id"]
        for t in store["transactions"].values()
        if t["merchant_id"] == merchant_id and t["is_cross_border"]
    }

    comparisons = [
        c for c in store["route_comparisons"].values()
        if c["transaction_id"] in cb_txn_ids
    ]

    # Aggregate savings
    total_card_fees = sum(Decimal(str(c["card_fee"])) for c in comparisons)
    total_stablecoin_fees = sum(Decimal(str(c["stablecoin_fee"])) for c in comparisons)
    total_savings = total_card_fees - total_stablecoin_fees

    avg_savings_pct = Decimal("0")
    if total_card_fees > 0:
        avg_savings_pct = (
            total_savings / total_card_fees * Decimal("100")
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return {
        "merchant_id": merchant_id,
        "total_comparisons": len(comparisons),
        "total_card_fees": float(total_card_fees),
        "total_stablecoin_fees": float(total_stablecoin_fees),
        "total_savings": float(total_savings),
        "avg_savings_pct": float(avg_savings_pct),
        "comparisons": comparisons,
    }


# ---------- Analytics ----------

@router.get("/merchants/{merchant_id}/analytics")
async def get_analytics(
    merchant_id: str,
    days: int = Query(default=30, ge=1, le=365),
):
    """Get corridor analytics and savings summary."""
    store = get_data_store()
    if merchant_id not in store["merchants"]:
        raise HTTPException(status_code=404, detail="Merchant not found")

    txns = [
        t for t in store["transactions"].values()
        if t["merchant_id"] == merchant_id
    ]
    comparisons = list(store["route_comparisons"].values())
    settlements = list(store["settlements"].values())

    # Convert float values back to Decimal for analytics calculation
    txns_decimal = []
    for t in txns:
        txn_copy = dict(t)
        txn_copy["amount_usd"] = Decimal(str(t["amount_usd"])) if t["amount_usd"] else Decimal("0")
        txns_decimal.append(txn_copy)

    comparisons_decimal = []
    for c in comparisons:
        comp_copy = dict(c)
        for key in ["card_fee", "card_fee_pct", "stablecoin_fee", "stablecoin_fee_pct", "savings_amount", "savings_pct"]:
            comp_copy[key] = Decimal(str(c[key]))
        comparisons_decimal.append(comp_copy)

    analytics = settlement_service.calculate_corridor_analytics(
        transactions=txns_decimal,
        comparisons=comparisons_decimal,
        settlements=settlements,
        days=days,
        merchant_id=merchant_id,
    )

    return analytics.model_dump()


# ---------- Dashboard ----------

@router.get("/merchants/{merchant_id}/dashboard")
async def get_dashboard(merchant_id: str):
    """Full dashboard data for the merchant."""
    store = get_data_store()
    merchant = store["merchants"].get(merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    # Get analytics
    txns = [
        t for t in store["transactions"].values()
        if t["merchant_id"] == merchant_id
    ]
    comparisons = list(store["route_comparisons"].values())
    settlements = list(store["settlements"].values())

    txns_decimal = []
    for t in txns:
        txn_copy = dict(t)
        txn_copy["amount_usd"] = Decimal(str(t["amount_usd"])) if t["amount_usd"] else Decimal("0")
        txns_decimal.append(txn_copy)

    comparisons_decimal = []
    for c in comparisons:
        comp_copy = dict(c)
        for key in ["card_fee", "card_fee_pct", "stablecoin_fee", "stablecoin_fee_pct", "savings_amount", "savings_pct"]:
            comp_copy[key] = Decimal(str(c[key]))
        comparisons_decimal.append(comp_copy)

    analytics = settlement_service.calculate_corridor_analytics(
        transactions=txns_decimal,
        comparisons=comparisons_decimal,
        settlements=settlements,
        days=30,
        merchant_id=merchant_id,
    )

    # Recent cross-border transactions
    cb_txns = [t for t in txns if t.get("is_cross_border")]
    cb_txns.sort(key=lambda t: t["created_at"], reverse=True)
    recent = cb_txns[:10]

    for txn in recent:
        buyer = store["buyers"].get(txn["buyer_id"], {})
        txn["buyer_name"] = buyer.get("name", "Unknown")
        txn["route_comparison"] = store["route_comparisons"].get(txn["id"])
        txn["settlement"] = store["settlements"].get(txn["id"])

    # FX rates
    rates = await fx_engine.get_all_rates()
    rates_data = [r.model_dump() for r in rates]

    # Headline stats
    total_volume = sum(
        Decimal(str(t["amount_usd"])) for t in txns if t["amount_usd"]
    )
    cb_volume = sum(
        Decimal(str(t["amount_usd"])) for t in cb_txns if t["amount_usd"]
    )
    total_savings = sum(
        Decimal(str(c["savings_amount"])) for c in comparisons
    )

    headline = {
        "total_transactions": len(txns),
        "cross_border_transactions": len(cb_txns),
        "cross_border_pct": float(
            (Decimal(len(cb_txns)) / Decimal(max(len(txns), 1)) * 100)
            .quantize(Decimal("0.1"))
        ),
        "total_volume_usd": float(total_volume.quantize(Decimal("0.01"))),
        "cross_border_volume_usd": float(cb_volume.quantize(Decimal("0.01"))),
        "total_savings_usd": float(total_savings.quantize(Decimal("0.01"))),
        "avg_settlement_seconds": 7,
        "corridors_active": len(analytics.corridors),
    }

    return {
        "merchant_id": merchant_id,
        "merchant_name": merchant["name"],
        "analytics": analytics.model_dump(),
        "recent_cross_border": recent,
        "fx_rates": rates_data,
        "headline_stats": headline,
    }


# ---------- FX Rates ----------

@router.get("/fx/rates")
async def get_fx_rates():
    """Get current FX rates for all supported corridors."""
    rates = await fx_engine.get_all_rates()
    return {
        "rates": [r.model_dump() for r in rates],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "note": "Simulated rates with realistic bid/ask spread",
    }


@router.post("/fx/lock")
async def lock_fx_rate(request: RateLockRequest):
    """Lock an FX rate for a specified TTL."""
    try:
        lock = await fx_engine.lock_rate(
            from_currency=request.from_currency,
            to_currency=request.to_currency,
            amount_local=request.amount_local,
            ttl_seconds=request.ttl_seconds,
        )
        return lock.model_dump()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------- Demo Endpoints ----------

@router.post("/demo/seed")
async def seed_demo_data():
    """Seed 30 days of demo transaction data."""
    store = get_data_store()

    # Create demo merchant
    merchant = {
        "id": "MERCHANT_001",
        "name": "GlobalTech Store",
        "country": "US",
        "currency": "USD",
        "commercehub_id": "CHB-GLOBALTECH-001",
    }
    store["merchants"]["MERCHANT_001"] = merchant

    # Create demo buyers
    for buyer_data in simulator.get_demo_buyers():
        store["buyers"][buyer_data["id"]] = buyer_data

    # Generate 30 days of transactions
    transactions = simulator.generate_history(
        merchant_id="MERCHANT_001",
        days=30,
        transactions_per_day=(10, 18),
    )

    for txn in transactions:
        txn_id = txn["id"]
        # Convert Decimals to float for JSON storage
        txn_store = dict(txn)
        txn_store["amount_local"] = float(txn["amount_local"])
        txn_store["amount_usd"] = float(txn["amount_usd"])
        txn_store["created_at"] = txn["created_at"].isoformat()
        store["transactions"][txn_id] = txn_store

        # Generate settlement
        settlement = simulator.generate_settlement(txn)
        if settlement:
            stl_store = dict(settlement)
            stl_store["amount_usd"] = float(settlement["amount_usd"])
            stl_store["fee_amount"] = float(settlement["fee_amount"])
            stl_store["fee_pct"] = float(settlement["fee_pct"])
            if settlement["completed_at"]:
                stl_store["completed_at"] = settlement["completed_at"].isoformat()
            store["settlements"][txn_id] = stl_store

        # Generate route comparison for cross-border
        comparison = simulator.generate_route_comparison(txn)
        if comparison:
            cmp_store = dict(comparison)
            for key in ["card_fee", "card_fee_pct", "stablecoin_fee", "stablecoin_fee_pct", "savings_amount", "savings_pct"]:
                cmp_store[key] = float(comparison[key])
            store["route_comparisons"][txn_id] = cmp_store

        # Generate FX conversion for cross-border
        fx_conv = simulator.generate_fx_conversion(txn)
        if fx_conv:
            fxc_store = dict(fx_conv)
            fxc_store["rate"] = float(fx_conv["rate"])
            fxc_store["fiusd_amount"] = float(fx_conv["fiusd_amount"])
            fxc_store["rate_locked_at"] = fx_conv["rate_locked_at"].isoformat()
            fxc_store["rate_expiry"] = fx_conv["rate_expiry"].isoformat()
            if fx_conv["completed_at"]:
                fxc_store["completed_at"] = fx_conv["completed_at"].isoformat()
            store["fx_conversions"][txn_id] = fxc_store

    total = len(transactions)
    cross_border = sum(1 for t in transactions if t["is_cross_border"])

    return {
        "status": "seeded",
        "merchant": merchant,
        "total_transactions": total,
        "domestic_transactions": total - cross_border,
        "cross_border_transactions": cross_border,
        "cross_border_pct": round(cross_border / total * 100, 1),
        "buyers": len(simulator.get_demo_buyers()),
        "days": 30,
    }


@router.post("/demo/live-transaction")
async def simulate_live_transaction(request: LiveTransactionRequest):
    """Trigger a live cross-border demo transaction with real-time processing."""
    store = get_data_store()

    buyer = store["buyers"].get(request.buyer_id)
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")

    merchant = store["merchants"].get("MERCHANT_001")
    if not merchant:
        raise HTTPException(
            status_code=400,
            detail="Demo not seeded. Call POST /api/demo/seed first.",
        )

    # Process payment through the full flow
    payment_request = PaymentRequest(
        buyer_id=request.buyer_id,
        amount_local=request.amount_local,
        buyer_currency=buyer["currency"],
    )

    return await process_payment("MERCHANT_001", payment_request)
