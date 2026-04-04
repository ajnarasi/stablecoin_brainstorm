"""
Demo-specific routes for investor day presentation.

Provides seeding, scenario loading, and sweep triggering without
needing the cron scheduler or real external dependencies.
"""

import logging
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import (
    Merchant,
    Prediction,
    RiskTolerance,
    SweepDecision,
    SweepExecution,
    Transaction,
    TransactionType,
    YieldAccrual,
    get_session,
)
from app.models.schemas import (
    DemoScenarioResponse,
    DemoSeedResponse,
    EarningsReport,
    MerchantResponse,
    SweepDecisionResponse,
    SweepEvaluationResult,
)
from app.services.settlement_simulator import SettlementSimulator

logger = logging.getLogger(__name__)

demo_router = APIRouter(prefix="/api/demo", tags=["demo"])


def _get_sweep_service():
    from app import get_app_state
    return get_app_state().sweep_service


def _get_predictor():
    from app import get_app_state
    return get_app_state().predictor


def _get_finxact_client():
    from app import get_app_state
    return get_app_state().finxact_client


def _get_yield_manager():
    from app import get_app_state
    return get_app_state().yield_manager


# ---------------------------------------------------------------------------
# Seed demo data
# ---------------------------------------------------------------------------

@demo_router.post("/seed", response_model=DemoSeedResponse)
async def seed_demo_data(
    days: int = 180,
    session: AsyncSession = Depends(get_session),
):
    """
    Seed 6 months of transaction data for the demo merchant.
    Trains the ML model on the seeded data.
    """
    merchant_id = "DEMO_MERCHANT_001"

    # Clear existing data for this merchant
    for model in [YieldAccrual, SweepExecution, SweepDecision, Prediction, Transaction]:
        if model == SweepExecution:
            # Delete executions linked to this merchant's decisions
            decisions = await session.execute(
                select(SweepDecision.id).where(
                    SweepDecision.merchant_id == merchant_id
                )
            )
            decision_ids = [d for (d,) in decisions.all()]
            if decision_ids:
                await session.execute(
                    delete(SweepExecution).where(
                        SweepExecution.decision_id.in_(decision_ids)
                    )
                )
        else:
            await session.execute(
                delete(model).where(model.merchant_id == merchant_id)
            )

    # Ensure merchant exists
    result = await session.execute(
        select(Merchant).where(Merchant.id == merchant_id)
    )
    merchant = result.scalar_one_or_none()
    if merchant is None:
        merchant = Merchant(
            id=merchant_id,
            name="Mario's Pizzeria",
            clover_id="CLV_MARIO_001",
            sweep_config={
                "enabled": True,
                "min_sweep_amount": "500.00",
                "safety_buffer_pct": "0.20",
                "hard_floor": None,
                "max_sweep_pct": None,
            },
            risk_tolerance=RiskTolerance.MODERATE,
            override_active=False,
            tenure_months=6,
            finxact_account_id="ACCT_MARIO_001",
        )
        session.add(merchant)
    await session.flush()

    # Generate transaction history
    simulator = SettlementSimulator(seed=42)
    transactions = simulator.generate_history(merchant_id, days=days)

    # Insert transactions
    for txn in transactions:
        db_txn = Transaction(
            merchant_id=txn["merchant_id"],
            amount=Decimal(str(txn["amount"])),
            type=TransactionType(txn["type"]),
            description=txn.get("description"),
            timestamp=txn["timestamp"],
        )
        session.add(db_txn)

    await session.flush()

    # Compute running balance and set Finxact demo balance
    balance_history = simulator.compute_running_balance(
        transactions, starting_balance=25000.0
    )
    if balance_history:
        final_balance = Decimal(str(balance_history[-1]["balance"]))
        finxact = _get_finxact_client()
        # Update demo balances in the client
        from finxact_client.models import Balance
        balance_obj = Balance(
            account_id="ACCT_MARIO_001",
            total=final_balance + Decimal("300000.00"),
            available=final_balance,
            yield_allocated=Decimal("300000.00"),
            currency="USD",
        )
        # Update the internal demo state
        from finxact_client.client import _DEMO_BALANCES
        _DEMO_BALANCES["ACCT_MARIO_001"] = balance_obj

    # Train the ML model
    predictor = _get_predictor()
    metrics = predictor.train(transactions)
    model_trained = predictor.is_trained

    # Simulate historical sweeps and yield accrual
    yield_mgr = _get_yield_manager()
    sweep_service = _get_sweep_service()

    # Simulate that sweeps started 3 months ago
    sweep_start = date.today() - timedelta(days=90)
    initial_sweep = Decimal("15000.00")
    await yield_mgr.mint(merchant_id, initial_sweep)

    current_date = sweep_start
    while current_date <= date.today():
        await sweep_service.accrue_yield_for_date(
            merchant_id, current_date, session
        )
        current_date += timedelta(days=1)

    await session.flush()

    logger.info(
        "Seeded %d transactions over %d days for %s. Model trained: %s",
        len(transactions), days, merchant_id, model_trained,
    )

    return DemoSeedResponse(
        merchant_id=merchant_id,
        transactions_created=len(transactions),
        days_seeded=days,
        model_trained=model_trained,
    )


# ---------------------------------------------------------------------------
# Trigger sweep (demo shortcut)
# ---------------------------------------------------------------------------

@demo_router.post(
    "/trigger-sweep",
    response_model=SweepEvaluationResult,
)
async def trigger_sweep(
    session: AsyncSession = Depends(get_session),
):
    """Trigger a sweep evaluation for the demo merchant (bypasses cron)."""
    service = _get_sweep_service()
    merchant_id = "DEMO_MERCHANT_001"

    try:
        result = await service.evaluate_sweep(merchant_id, session)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    # Auto-execute if approved
    if (
        result.decision.decision.value == "APPROVED"
        and result.decision.proposed_amount > 0
    ):
        try:
            execution = await service.execute_sweep(
                result.decision.id, session
            )
            logger.info(
                "Demo sweep executed: amount=%s, status=%s",
                execution.amount, execution.status,
            )
        except Exception as exc:
            logger.error("Demo sweep execution failed: %s", exc)

    return result


# ---------------------------------------------------------------------------
# Pre-built scenario
# ---------------------------------------------------------------------------

@demo_router.get("/scenario", response_model=DemoScenarioResponse)
async def get_demo_scenario(
    session: AsyncSession = Depends(get_session),
):
    """
    Get pre-built demo scenario data for the investor day presentation.
    Returns all data needed for a compelling demo narrative.
    """
    merchant_id = "DEMO_MERCHANT_001"

    # Load merchant
    result = await session.execute(
        select(Merchant).where(Merchant.id == merchant_id)
    )
    merchant = result.scalar_one_or_none()
    if merchant is None:
        raise HTTPException(
            status_code=404,
            detail="Demo merchant not found. Run POST /api/demo/seed first.",
        )

    # Build balance history
    txn_result = await session.execute(
        select(Transaction)
        .where(Transaction.merchant_id == merchant_id)
        .order_by(Transaction.timestamp.asc())
    )
    txns = txn_result.scalars().all()

    simulator = SettlementSimulator(seed=42)
    txn_dicts = [
        {
            "amount": float(t.amount),
            "type": t.type.value,
            "timestamp": t.timestamp,
        }
        for t in txns
    ]
    balance_history = simulator.compute_running_balance(
        txn_dicts, starting_balance=25000.0
    )

    # Recent sweeps
    sweep_result = await session.execute(
        select(SweepDecision)
        .where(SweepDecision.merchant_id == merchant_id)
        .order_by(SweepDecision.created_at.desc())
        .limit(10)
    )
    recent_sweeps = sweep_result.scalars().all()

    # Earnings
    service = _get_sweep_service()
    earnings = await service.calculate_earnings(merchant_id, session)

    # AI insights for the demo narrative
    predictor = _get_predictor()
    insights = [
        "AI detected 23% higher revenue on weekends - adjusting sweep timing to Monday mornings",
        "Bi-weekly payroll pattern identified - reserving $8,500 buffer before each cycle",
        "Holiday season multiplier of 1.25x detected for December - increasing safety margins",
    ]

    if predictor.is_trained:
        prediction = predictor.predict_outflows(merchant_id, days_ahead=3)
        insights.append(
            f"Next 3-day outflow forecast: ${prediction.predicted_outflows:,.2f} "
            f"(confidence: {prediction.confidence:.1%})"
        )
        pattern = predictor.detect_seasonal_patterns(txn_dicts)
        insights.append(
            f"Peak revenue day: {pattern.peak_day} "
            f"(weekend multiplier: {pattern.weekend_multiplier}x)"
        )

    return DemoScenarioResponse(
        merchant=MerchantResponse.model_validate(merchant),
        balance_history=balance_history[-30:],  # Last 30 days
        sweep_history=[
            SweepDecisionResponse.model_validate(s) for s in recent_sweeps
        ],
        earnings_summary=earnings,
        ai_insights=insights,
    )
