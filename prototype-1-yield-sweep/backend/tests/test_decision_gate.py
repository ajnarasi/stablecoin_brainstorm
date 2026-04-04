"""
Tests for the decision gate safeguards.
"""

from decimal import Decimal

import pytest

from app.services.decision_gate import DecisionGate, _get_ramp_pct


class TestRampSchedule:
    """Tests for tenure-based ramp percentage."""

    def test_month_1(self):
        assert _get_ramp_pct(1) == Decimal("0.05")

    def test_month_2(self):
        assert _get_ramp_pct(2) == Decimal("0.10")

    def test_month_3(self):
        assert _get_ramp_pct(3) == Decimal("0.20")

    def test_month_6(self):
        assert _get_ramp_pct(6) == Decimal("0.40")

    def test_month_12(self):
        assert _get_ramp_pct(12) == Decimal("0.60")

    def test_month_24(self):
        assert _get_ramp_pct(24) == Decimal("0.80")


class TestDecisionGate:
    """Tests for the decision gate validation."""

    @pytest.mark.asyncio
    async def test_override_blocks_sweep(self, decision_gate):
        result = await decision_gate.validate(
            merchant_id="TEST_001",
            proposed_amount=Decimal("5000"),
            current_balance=Decimal("50000"),
            override_active=True,
        )

        assert not result.approved
        assert "override" in result.reason.lower()
        assert result.adjusted_amount == Decimal("0")

    @pytest.mark.asyncio
    async def test_depeg_blocks_sweep(self, yield_manager):
        yield_manager.set_peg_ratio(Decimal("0.95"))  # 5% depeg
        gate = DecisionGate(yield_manager=yield_manager)

        result = await gate.validate(
            merchant_id="TEST_001",
            proposed_amount=Decimal("5000"),
            current_balance=Decimal("50000"),
        )

        assert not result.approved
        assert "depeg" in result.reason.lower()

    @pytest.mark.asyncio
    async def test_hard_floor_limits_amount(self, decision_gate):
        result = await decision_gate.validate(
            merchant_id="TEST_001",
            proposed_amount=Decimal("45000"),
            current_balance=Decimal("50000"),
            historical_max_daily_outflow=Decimal("10000"),
            tenure_months=24,
        )

        # Hard floor = 10000 * 1.2 = 12000
        # Max sweepable = 50000 - 12000 = 38000
        assert result.approved
        assert result.adjusted_amount <= Decimal("38000")

    @pytest.mark.asyncio
    async def test_balance_below_floor_denied(self, decision_gate):
        result = await decision_gate.validate(
            merchant_id="TEST_001",
            proposed_amount=Decimal("5000"),
            current_balance=Decimal("10000"),
            historical_max_daily_outflow=Decimal("10000"),
        )

        # Hard floor = 10000 * 1.2 = 12000, balance = 10000
        assert not result.approved
        assert "hard floor" in result.reason.lower() or "below" in result.reason.lower()

    @pytest.mark.asyncio
    async def test_ramp_caps_amount(self, decision_gate):
        result = await decision_gate.validate(
            merchant_id="TEST_001",
            proposed_amount=Decimal("40000"),
            current_balance=Decimal("50000"),
            historical_max_daily_outflow=Decimal("5000"),
            tenure_months=1,  # Only 5% ramp
        )

        # Hard floor = 5000 * 1.2 = 6000
        # Excess = 50000 - 6000 = 44000
        # Ramp cap = 44000 * 0.05 = 2200
        assert result.approved
        assert result.adjusted_amount == Decimal("2200.00")

    @pytest.mark.asyncio
    async def test_minimum_sweep_threshold(self, decision_gate):
        result = await decision_gate.validate(
            merchant_id="TEST_001",
            proposed_amount=Decimal("50"),
            current_balance=Decimal("50000"),
            historical_max_daily_outflow=Decimal("49900"),
            tenure_months=1,
        )

        # After adjustments, amount will be very small
        assert not result.approved
        assert "minimum" in result.reason.lower() or "below" in result.reason.lower()

    @pytest.mark.asyncio
    async def test_all_checks_pass(self, decision_gate):
        result = await decision_gate.validate(
            merchant_id="TEST_001",
            proposed_amount=Decimal("5000"),
            current_balance=Decimal("100000"),
            historical_max_daily_outflow=Decimal("5000"),
            tenure_months=12,
        )

        assert result.approved
        assert result.adjusted_amount > Decimal("0")
        assert all(result.checks.values())

    @pytest.mark.asyncio
    async def test_custom_hard_floor(self, decision_gate):
        result = await decision_gate.validate(
            merchant_id="TEST_001",
            proposed_amount=Decimal("80000"),
            current_balance=Decimal("100000"),
            custom_hard_floor=Decimal("50000"),
            tenure_months=24,
        )

        # Custom floor = 50000, excess = 50000
        # Ramp = 80% of 50000 = 40000
        assert result.approved
        assert result.adjusted_amount <= Decimal("40000")
