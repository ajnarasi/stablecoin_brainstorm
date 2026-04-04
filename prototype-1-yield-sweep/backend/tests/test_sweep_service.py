"""
Tests for the sweep service integration.
"""

from decimal import Decimal

import pytest
import pytest_asyncio

from app.models.database import (
    Merchant,
    RiskTolerance,
    Transaction,
    TransactionType,
)
from app.services.decision_gate import DecisionGate
from app.services.settlement_simulator import SettlementSimulator
from app.services.sweep_service import SweepService
from app.ml.predictor import CashFlowPredictor


class TestSweepService:
    """Integration tests for the sweep service."""

    @pytest_asyncio.fixture
    async def sweep_service(
        self, finxact_client, yield_manager, db_session, demo_merchant
    ):
        """Set up sweep service with seeded data."""
        # Seed transactions
        simulator = SettlementSimulator(seed=42)
        transactions = simulator.generate_history("DEMO_MERCHANT_001", days=90)

        for txn in transactions:
            db_txn = Transaction(
                merchant_id=txn["merchant_id"],
                amount=Decimal(str(txn["amount"])),
                type=TransactionType(txn["type"]),
                description=txn.get("description"),
                timestamp=txn["timestamp"],
            )
            db_session.add(db_txn)
        await db_session.flush()

        # Train predictor
        predictor = CashFlowPredictor()
        predictor.train(transactions)

        # Create service
        gate = DecisionGate(yield_manager=yield_manager)
        service = SweepService(
            finxact_client=finxact_client,
            yield_manager=yield_manager,
            predictor=predictor,
            decision_gate=gate,
            demo_mode=True,
        )

        return service

    @pytest.mark.asyncio
    async def test_evaluate_sweep(self, sweep_service, db_session):
        result = await sweep_service.evaluate_sweep(
            "DEMO_MERCHANT_001", db_session
        )

        assert result.current_balance > Decimal("0")
        assert result.predicted_outflows > Decimal("0")
        assert result.decision is not None
        assert result.decision.merchant_id == "DEMO_MERCHANT_001"

    @pytest.mark.asyncio
    async def test_evaluate_nonexistent_merchant(
        self, sweep_service, db_session
    ):
        with pytest.raises(ValueError, match="not found"):
            await sweep_service.evaluate_sweep("NONEXISTENT", db_session)

    @pytest.mark.asyncio
    async def test_emergency_unsweep(
        self, sweep_service, yield_manager, db_session
    ):
        # First, mint some FIUSD
        await yield_manager.mint("DEMO_MERCHANT_001", Decimal("5000"))

        result = await sweep_service.emergency_unsweep(
            "DEMO_MERCHANT_001", db_session
        )

        assert result.direction.value == "UNSWEEP"
        assert result.amount == Decimal("5000")

    @pytest.mark.asyncio
    async def test_emergency_unsweep_no_position(
        self, sweep_service, db_session
    ):
        with pytest.raises(ValueError, match="No FIUSD position"):
            await sweep_service.emergency_unsweep(
                "DEMO_MERCHANT_001", db_session
            )

    @pytest.mark.asyncio
    async def test_calculate_earnings(
        self, sweep_service, yield_manager, db_session
    ):
        # Mint and accrue some yield
        await yield_manager.mint("DEMO_MERCHANT_001", Decimal("10000"))

        from datetime import date, timedelta
        for i in range(7):
            d = date.today() - timedelta(days=6 - i)
            await sweep_service.accrue_yield_for_date(
                "DEMO_MERCHANT_001", d, db_session
            )

        earnings = await sweep_service.calculate_earnings(
            "DEMO_MERCHANT_001", db_session
        )

        assert earnings.current_principal == Decimal("10000")
        assert earnings.total_accrued > Decimal("0")
        assert earnings.current_apy == Decimal("0.042")
        assert earnings.projected_30d > Decimal("0")
        assert earnings.projected_annual > Decimal("0")
        assert len(earnings.accrual_history) == 7
