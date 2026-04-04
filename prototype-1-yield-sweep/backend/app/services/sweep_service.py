"""
Core sweep service: evaluates, executes, and tracks yield sweep operations.

Orchestrates the ML predictor, decision gate, Finxact client, and INDX
simulator to safely move idle merchant balances into yield-bearing positions.
"""

import logging
import sys
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Any

from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import (
    Merchant,
    Prediction,
    SweepDecision,
    SweepDecisionStatus,
    SweepDirection,
    SweepExecution,
    SweepExecutionStatus,
    Transaction,
    TransactionType,
    YieldAccrual,
)
from app.models.schemas import (
    DailyAccrualResponse,
    EarningsReport,
    PredictionResponse,
    SweepDecisionResponse,
    SweepEvaluationResult,
    SweepExecutionResponse,
)
from app.ml.predictor import CashFlowPredictor
from app.services.decision_gate import DecisionGate

# Add shared modules to path
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parents[4]))

logger = logging.getLogger(__name__)


class SweepService:
    """
    Main service for evaluating and executing yield sweeps.

    Workflow:
    1. Get current balance from Finxact
    2. Predict outflows for next N days using ML model
    3. Calculate excess = balance - predicted_outflows - safety_buffer
    4. Apply gradual ramp (% of excess based on merchant tenure)
    5. Validate against safeguards (hard floor, override status)
    6. Execute sweep via Finxact if approved
    """

    INFLOW_TYPES = {TransactionType.SETTLEMENT}

    def __init__(
        self,
        finxact_client,
        yield_manager,
        predictor: CashFlowPredictor,
        decision_gate: DecisionGate,
        demo_mode: bool = True,
    ):
        self._finxact = finxact_client
        self._yield_mgr = yield_manager
        self._predictor = predictor
        self._gate = decision_gate
        self._demo_mode = demo_mode

    async def evaluate_sweep(
        self, merchant_id: str, session: AsyncSession
    ) -> SweepEvaluationResult:
        """
        Evaluate whether a sweep should occur for the given merchant.

        Returns full context including the decision, prediction, and balances.
        """
        # 1. Load merchant
        merchant = await self._get_merchant(merchant_id, session)
        if merchant is None:
            raise ValueError(f"Merchant {merchant_id} not found")

        finxact_account = merchant.finxact_account_id or f"ACCT_{merchant_id}"

        # 2. Get current balance from Finxact
        balance_obj = await self._finxact.get_balance(finxact_account)
        current_balance = balance_obj.available

        # 3. Get FIUSD position
        position = await self._yield_mgr.get_position(merchant_id)
        fiusd_principal = position.principal

        # 4. Predict outflows
        if not self._predictor.is_trained:
            raise RuntimeError(
                "Predictor not trained. Seed data and train before evaluating."
            )

        prediction_result = self._predictor.predict_outflows(
            merchant_id, days_ahead=3
        )

        # 5. Parse sweep config
        config = merchant.sweep_config or {}
        safety_buffer_pct = Decimal(str(config.get("safety_buffer_pct", "0.20")))
        min_sweep = Decimal(str(config.get("min_sweep_amount", "500")))
        custom_hard_floor = (
            Decimal(str(config["hard_floor"]))
            if config.get("hard_floor") is not None
            else None
        )

        # 6. Calculate excess
        predicted_outflows = prediction_result.predicted_outflows
        safety_buffer = (predicted_outflows * safety_buffer_pct).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        required_reserve = predicted_outflows + safety_buffer
        excess = current_balance - required_reserve

        # 7. Get historical max daily outflow for hard floor
        max_daily_outflow = await self._get_max_daily_outflow(merchant_id, session)

        # 8. Calculate hard floor
        if custom_hard_floor is not None:
            hard_floor = custom_hard_floor
        else:
            hard_floor = (max_daily_outflow * Decimal("1.20")).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

        # 9. Save prediction to DB
        db_prediction = Prediction(
            merchant_id=merchant_id,
            predicted_balance=current_balance,
            predicted_outflows=predicted_outflows,
            confidence=prediction_result.confidence,
            horizon_days=prediction_result.horizon_days,
        )
        session.add(db_prediction)
        await session.flush()

        # 10. Check if sweep is enabled and amount is viable
        if not config.get("enabled", True):
            decision = await self._save_decision(
                session, merchant_id, db_prediction.id,
                Decimal("0"), SweepDecisionStatus.DENIED,
                "Sweeping is disabled for this merchant.",
            )
            return self._build_result(
                decision, current_balance, predicted_outflows,
                safety_buffer, hard_floor, Decimal("0"),
                Decimal("0"), fiusd_principal,
            )

        if excess <= min_sweep:
            decision = await self._save_decision(
                session, merchant_id, db_prediction.id,
                Decimal("0"), SweepDecisionStatus.DENIED,
                f"Excess {excess} below minimum sweep {min_sweep}.",
            )
            return self._build_result(
                decision, current_balance, predicted_outflows,
                safety_buffer, hard_floor, excess,
                Decimal("0"), fiusd_principal,
            )

        # 11. Run decision gate
        gate_result = await self._gate.validate(
            merchant_id=merchant_id,
            proposed_amount=excess,
            current_balance=current_balance,
            tenure_months=merchant.tenure_months,
            override_active=merchant.override_active,
            historical_max_daily_outflow=max_daily_outflow,
            custom_hard_floor=custom_hard_floor,
        )

        if not gate_result.approved:
            decision = await self._save_decision(
                session, merchant_id, db_prediction.id,
                Decimal("0"), SweepDecisionStatus.DENIED,
                gate_result.reason,
            )
        else:
            decision = await self._save_decision(
                session, merchant_id, db_prediction.id,
                gate_result.adjusted_amount, SweepDecisionStatus.APPROVED,
                gate_result.reason,
            )

        ramp_pct = (
            gate_result.adjusted_amount / excess
            if excess > 0 and gate_result.approved
            else Decimal("0")
        )

        return self._build_result(
            decision, current_balance, predicted_outflows,
            safety_buffer, hard_floor, excess,
            ramp_pct, fiusd_principal,
        )

    async def execute_sweep(
        self, decision_id: int, session: AsyncSession
    ) -> SweepExecutionResponse:
        """Execute an approved sweep decision."""
        # Load decision
        result = await session.execute(
            select(SweepDecision).where(SweepDecision.id == decision_id)
        )
        decision = result.scalar_one_or_none()
        if decision is None:
            raise ValueError(f"Decision {decision_id} not found")
        if decision.decision != SweepDecisionStatus.APPROVED:
            raise ValueError(f"Decision {decision_id} is not APPROVED")

        merchant = await self._get_merchant(decision.merchant_id, session)
        finxact_account = merchant.finxact_account_id or f"ACCT_{decision.merchant_id}"

        try:
            # Execute sweep via Finxact (move to yield)
            sweep_result = await self._finxact.sweep_to_yield(
                finxact_account, decision.proposed_amount
            )

            # Mint FIUSD via INDX
            await self._yield_mgr.mint(decision.merchant_id, decision.proposed_amount)

            execution = SweepExecution(
                decision_id=decision_id,
                finxact_txn_id=sweep_result.sweep_id,
                amount=decision.proposed_amount,
                direction=SweepDirection.SWEEP,
                status=SweepExecutionStatus.COMPLETED,
            )
        except Exception as exc:
            logger.error(
                "Sweep execution failed for decision %d: %s",
                decision_id, exc,
            )
            execution = SweepExecution(
                decision_id=decision_id,
                finxact_txn_id=None,
                amount=decision.proposed_amount,
                direction=SweepDirection.SWEEP,
                status=SweepExecutionStatus.FAILED,
            )

        session.add(execution)
        await session.flush()

        return SweepExecutionResponse.model_validate(execution)

    async def emergency_unsweep(
        self, merchant_id: str, session: AsyncSession
    ) -> SweepExecutionResponse:
        """
        Instant full unsweep for merchant override.
        Burns all FIUSD and returns funds to demand position.
        """
        position = await self._yield_mgr.get_position(merchant_id)
        if position.principal <= 0:
            raise ValueError("No FIUSD position to unsweep")

        amount = position.principal
        merchant = await self._get_merchant(merchant_id, session)
        finxact_account = merchant.finxact_account_id or f"ACCT_{merchant_id}"

        # Create a decision record for the unsweep
        decision = SweepDecision(
            merchant_id=merchant_id,
            prediction_id=None,
            proposed_amount=amount,
            decision=SweepDecisionStatus.APPROVED,
            reason="Emergency unsweep triggered by merchant.",
        )
        session.add(decision)
        await session.flush()

        try:
            # Unsweep via Finxact
            sweep_result = await self._finxact.unsweep_from_yield(
                finxact_account, amount
            )
            # Burn FIUSD
            await self._yield_mgr.burn(merchant_id, amount)

            execution = SweepExecution(
                decision_id=decision.id,
                finxact_txn_id=sweep_result.sweep_id,
                amount=amount,
                direction=SweepDirection.UNSWEEP,
                status=SweepExecutionStatus.COMPLETED,
            )
        except Exception as exc:
            logger.error("Emergency unsweep failed: %s", exc)
            execution = SweepExecution(
                decision_id=decision.id,
                finxact_txn_id=None,
                amount=amount,
                direction=SweepDirection.UNSWEEP,
                status=SweepExecutionStatus.FAILED,
            )

        session.add(execution)
        await session.flush()

        # Activate merchant override
        merchant.override_active = True
        await session.flush()

        return SweepExecutionResponse.model_validate(execution)

    async def calculate_earnings(
        self, merchant_id: str, session: AsyncSession
    ) -> EarningsReport:
        """Calculate yield accrual for dashboard display."""
        position = await self._yield_mgr.get_position(merchant_id)
        apy = position.apy

        # Load accrual history from DB
        result = await session.execute(
            select(YieldAccrual)
            .where(YieldAccrual.merchant_id == merchant_id)
            .order_by(YieldAccrual.date.asc())
        )
        accruals = result.scalars().all()

        history = [
            DailyAccrualResponse.model_validate(a) for a in accruals
        ]

        total_accrued = position.accrued_yield
        total_value = position.total_value

        # Projections
        daily_rate = apy / Decimal("365")
        daily_earnings = (position.principal * daily_rate).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        projected_30d = (daily_earnings * 30).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        projected_annual = (position.principal * apy).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        return EarningsReport(
            merchant_id=merchant_id,
            current_principal=position.principal,
            total_accrued=total_accrued,
            total_value=total_value,
            current_apy=apy,
            daily_earnings_rate=daily_earnings,
            accrual_history=history,
            projected_30d=projected_30d,
            projected_annual=projected_annual,
        )

    async def accrue_yield_for_date(
        self, merchant_id: str, for_date: date, session: AsyncSession
    ) -> Decimal:
        """
        Accrue one day of yield and persist the record.
        Called during data seeding and by the daily cron.
        """
        daily_yield = self._yield_mgr.accrue_daily_yield(merchant_id, for_date)
        position = await self._yield_mgr.get_position(merchant_id)

        # Get current cumulative from DB
        result = await session.execute(
            select(func.coalesce(func.sum(YieldAccrual.accrued), Decimal("0")))
            .where(YieldAccrual.merchant_id == merchant_id)
        )
        prev_cumulative = result.scalar() or Decimal("0")
        new_cumulative = prev_cumulative + daily_yield

        accrual = YieldAccrual(
            merchant_id=merchant_id,
            date=for_date,
            principal=position.principal,
            rate=position.apy / Decimal("365"),
            accrued=daily_yield,
            cumulative=new_cumulative,
        )
        session.add(accrual)

        return daily_yield

    # -----------------------------------------------------------------------
    # Private helpers
    # -----------------------------------------------------------------------

    async def _get_merchant(
        self, merchant_id: str, session: AsyncSession
    ) -> Merchant:
        result = await session.execute(
            select(Merchant).where(Merchant.id == merchant_id)
        )
        merchant = result.scalar_one_or_none()
        if merchant is None:
            raise ValueError(f"Merchant {merchant_id} not found")
        return merchant

    async def _get_max_daily_outflow(
        self, merchant_id: str, session: AsyncSession
    ) -> Decimal:
        """Find the highest single-day total outflow in transaction history."""
        outflow_types = [t for t in TransactionType if t != TransactionType.SETTLEMENT]

        result = await session.execute(
            select(
                func.date(Transaction.timestamp).label("txn_date"),
                func.sum(Transaction.amount).label("daily_total"),
            )
            .where(
                Transaction.merchant_id == merchant_id,
                Transaction.type.in_(outflow_types),
            )
            .group_by(func.date(Transaction.timestamp))
            .order_by(desc("daily_total"))
            .limit(1)
        )
        row = result.first()
        if row is None:
            return Decimal("5000.00")  # Default floor if no history
        return Decimal(str(row.daily_total))

    async def _save_decision(
        self,
        session: AsyncSession,
        merchant_id: str,
        prediction_id: int,
        amount: Decimal,
        status: SweepDecisionStatus,
        reason: str,
    ) -> SweepDecisionResponse:
        decision = SweepDecision(
            merchant_id=merchant_id,
            prediction_id=prediction_id,
            proposed_amount=amount,
            decision=status,
            reason=reason,
        )
        session.add(decision)
        await session.flush()
        return SweepDecisionResponse.model_validate(decision)

    def _build_result(
        self,
        decision: SweepDecisionResponse,
        current_balance: Decimal,
        predicted_outflows: Decimal,
        safety_buffer: Decimal,
        hard_floor: Decimal,
        excess: Decimal,
        ramp_pct: Decimal,
        fiusd_position: Decimal,
    ) -> SweepEvaluationResult:
        return SweepEvaluationResult(
            decision=decision,
            current_balance=current_balance,
            predicted_outflows=predicted_outflows,
            safety_buffer=safety_buffer,
            hard_floor=hard_floor,
            excess_available=excess,
            ramp_pct=ramp_pct,
            fiusd_position=fiusd_position,
        )
