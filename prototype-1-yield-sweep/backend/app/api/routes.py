"""
FastAPI routes for the Yield Sweep prototype.

Provides merchant balance, prediction, sweep, and earnings endpoints.
"""

import logging
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import (
    Merchant,
    Prediction,
    SweepDecision,
    SweepExecution,
    Transaction,
    get_session,
)
from app.models.schemas import (
    DashboardResponse,
    EarningsReport,
    HealthResponse,
    MerchantConfigUpdate,
    MerchantResponse,
    PredictionResponse,
    SweepDecisionResponse,
    SweepEvaluationResult,
    SweepExecutionResponse,
    TransactionResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["yield-sweep"])


def _get_sweep_service():
    """Retrieve the sweep service from app state (set during lifespan)."""
    from app import get_app_state
    return get_app_state().sweep_service


def _get_finxact_client():
    from app import get_app_state
    return get_app_state().finxact_client


def _get_yield_manager():
    from app import get_app_state
    return get_app_state().yield_manager


def _get_predictor():
    from app import get_app_state
    return get_app_state().predictor


def _get_demo_mode():
    from app import get_app_state
    return get_app_state().demo_mode


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Check API and dependency health."""
    demo = _get_demo_mode()
    return HealthResponse(
        status="healthy",
        demo_mode=demo,
        finxact_status="demo" if demo else "live",
        indx_status="simulator" if demo else "live",
    )


# ---------------------------------------------------------------------------
# Merchant balance
# ---------------------------------------------------------------------------

@router.get("/merchants/{merchant_id}/balance")
async def get_merchant_balance(merchant_id: str):
    """Get current merchant balance from Finxact."""
    finxact = _get_finxact_client()
    yield_mgr = _get_yield_manager()

    account_id = f"ACCT_{merchant_id}"
    try:
        balance = await finxact.get_balance(account_id)
    except Exception as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    position = await yield_mgr.get_position(merchant_id)

    return {
        "merchant_id": merchant_id,
        "finxact_account_id": account_id,
        "available_balance": str(balance.available),
        "yield_allocated": str(balance.yield_allocated),
        "total_balance": str(balance.total),
        "fiusd_principal": str(position.principal),
        "fiusd_accrued_yield": str(position.accrued_yield),
        "fiusd_total_value": str(position.total_value),
    }


# ---------------------------------------------------------------------------
# Predictions
# ---------------------------------------------------------------------------

@router.get(
    "/merchants/{merchant_id}/predictions",
    response_model=list[PredictionResponse],
)
async def get_predictions(
    merchant_id: str,
    limit: int = 10,
    session: AsyncSession = Depends(get_session),
):
    """Get recent predictions for a merchant."""
    result = await session.execute(
        select(Prediction)
        .where(Prediction.merchant_id == merchant_id)
        .order_by(desc(Prediction.created_at))
        .limit(limit)
    )
    predictions = result.scalars().all()
    return [PredictionResponse.model_validate(p) for p in predictions]


# ---------------------------------------------------------------------------
# Sweeps
# ---------------------------------------------------------------------------

@router.get(
    "/merchants/{merchant_id}/sweeps",
    response_model=list[SweepDecisionResponse],
)
async def get_sweep_decisions(
    merchant_id: str,
    limit: int = 20,
    session: AsyncSession = Depends(get_session),
):
    """Get recent sweep decisions for a merchant."""
    result = await session.execute(
        select(SweepDecision)
        .where(SweepDecision.merchant_id == merchant_id)
        .order_by(desc(SweepDecision.created_at))
        .limit(limit)
    )
    decisions = result.scalars().all()
    return [SweepDecisionResponse.model_validate(d) for d in decisions]


@router.post(
    "/merchants/{merchant_id}/sweeps/evaluate",
    response_model=SweepEvaluationResult,
)
async def evaluate_sweep(
    merchant_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Trigger an immediate sweep evaluation for a merchant."""
    service = _get_sweep_service()
    try:
        result = await service.evaluate_sweep(merchant_id, session)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    # If approved, auto-execute
    if result.decision.decision.value == "APPROVED" and result.decision.proposed_amount > 0:
        try:
            execution = await service.execute_sweep(
                result.decision.id, session
            )
            logger.info(
                "Auto-executed sweep %d: %s",
                execution.id, execution.status,
            )
        except Exception as exc:
            logger.error("Auto-execute failed: %s", exc)

    return result


# ---------------------------------------------------------------------------
# Emergency unsweep
# ---------------------------------------------------------------------------

@router.post(
    "/merchants/{merchant_id}/unsweep",
    response_model=SweepExecutionResponse,
)
async def emergency_unsweep(
    merchant_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Emergency unsweep: return all FIUSD to USD immediately."""
    service = _get_sweep_service()
    try:
        return await service.emergency_unsweep(merchant_id, session)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# ---------------------------------------------------------------------------
# Earnings
# ---------------------------------------------------------------------------

@router.get(
    "/merchants/{merchant_id}/earnings",
    response_model=EarningsReport,
)
async def get_earnings(
    merchant_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Get earnings report for a merchant."""
    service = _get_sweep_service()
    try:
        return await service.calculate_earnings(merchant_id, session)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


# ---------------------------------------------------------------------------
# Merchant config
# ---------------------------------------------------------------------------

@router.put(
    "/merchants/{merchant_id}/config",
    response_model=MerchantResponse,
)
async def update_config(
    merchant_id: str,
    update: MerchantConfigUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Update merchant sweep configuration."""
    result = await session.execute(
        select(Merchant).where(Merchant.id == merchant_id)
    )
    merchant = result.scalar_one_or_none()
    if merchant is None:
        raise HTTPException(status_code=404, detail="Merchant not found")

    if update.sweep_config is not None:
        merchant.sweep_config = update.sweep_config.model_dump(mode="json")

    if update.risk_tolerance is not None:
        merchant.risk_tolerance = update.risk_tolerance.value

    if update.override_active is not None:
        merchant.override_active = update.override_active

    await session.flush()
    return MerchantResponse.model_validate(merchant)


# ---------------------------------------------------------------------------
# Dashboard (combined response)
# ---------------------------------------------------------------------------

@router.get(
    "/merchants/{merchant_id}/dashboard",
    response_model=DashboardResponse,
)
async def get_dashboard(
    merchant_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Get all dashboard data in one call."""
    # Merchant
    result = await session.execute(
        select(Merchant).where(Merchant.id == merchant_id)
    )
    merchant = result.scalar_one_or_none()
    if merchant is None:
        raise HTTPException(status_code=404, detail="Merchant not found")

    # Balance
    finxact = _get_finxact_client()
    yield_mgr = _get_yield_manager()
    account_id = merchant.finxact_account_id or f"ACCT_{merchant_id}"

    balance = await finxact.get_balance(account_id)
    position = await yield_mgr.get_position(merchant_id)

    # Latest prediction
    pred_result = await session.execute(
        select(Prediction)
        .where(Prediction.merchant_id == merchant_id)
        .order_by(desc(Prediction.created_at))
        .limit(1)
    )
    latest_pred = pred_result.scalar_one_or_none()

    # Recent sweeps
    sweep_result = await session.execute(
        select(SweepDecision)
        .where(SweepDecision.merchant_id == merchant_id)
        .order_by(desc(SweepDecision.created_at))
        .limit(10)
    )
    recent_sweeps = sweep_result.scalars().all()

    # Earnings
    service = _get_sweep_service()
    earnings = await service.calculate_earnings(merchant_id, session)

    # Seasonal patterns
    predictor = _get_predictor()
    seasonal = None
    if predictor.is_trained:
        try:
            txn_result = await session.execute(
                select(Transaction)
                .where(Transaction.merchant_id == merchant_id)
                .order_by(Transaction.timestamp.asc())
            )
            txns = txn_result.scalars().all()
            if txns:
                txn_dicts = [
                    {
                        "amount": float(t.amount),
                        "type": t.type.value,
                        "timestamp": t.timestamp,
                    }
                    for t in txns
                ]
                from app.models.schemas import SeasonalPatternResponse
                pattern = predictor.detect_seasonal_patterns(txn_dicts)
                seasonal = SeasonalPatternResponse(
                    weekday_avg=pattern.weekday_avg,
                    monthly_avg=pattern.monthly_avg,
                    peak_day=pattern.peak_day,
                    trough_day=pattern.trough_day,
                )
        except Exception as exc:
            logger.warning("Failed to compute seasonal patterns: %s", exc)

    return DashboardResponse(
        merchant=MerchantResponse.model_validate(merchant),
        current_balance=balance.available,
        fiusd_position=position.principal,
        total_value=balance.total + position.accrued_yield,
        latest_prediction=(
            PredictionResponse.model_validate(latest_pred)
            if latest_pred else None
        ),
        recent_sweeps=[
            SweepDecisionResponse.model_validate(s) for s in recent_sweeps
        ],
        earnings=earnings,
        seasonal_patterns=seasonal,
    )
