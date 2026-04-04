"""
Decision gate: independent validation layer for sweep decisions.

Validates proposed sweep amounts against safeguards before execution,
ensuring merchant balances never drop below critical thresholds.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Sequence

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Tenure-based ramp schedule
# ---------------------------------------------------------------------------

# Max percentage of excess that can be swept, by months of tenure
_RAMP_SCHEDULE: list[tuple[int, Decimal]] = [
    (1, Decimal("0.05")),    # Month 1: max 5% of excess
    (2, Decimal("0.10")),    # Month 2: max 10%
    (3, Decimal("0.20")),    # Month 3: max 20%
    (6, Decimal("0.40")),    # Months 4-6: max 40%
    (12, Decimal("0.60")),   # Months 7-12: max 60%
    (999, Decimal("0.80")),  # 12+ months: max 80%
]


def _get_ramp_pct(tenure_months: int) -> Decimal:
    """Get the maximum sweep percentage for a given tenure."""
    for threshold, pct in _RAMP_SCHEDULE:
        if tenure_months <= threshold:
            return pct
    return Decimal("0.80")


# ---------------------------------------------------------------------------
# Gate result
# ---------------------------------------------------------------------------

@dataclass
class GateResult:
    """Result of a decision gate validation."""

    approved: bool
    reason: str
    adjusted_amount: Decimal
    checks: dict[str, bool]

    @property
    def summary(self) -> str:
        passed = sum(1 for v in self.checks.values() if v)
        total = len(self.checks)
        status = "PASS" if self.approved else "FAIL"
        return f"{status} ({passed}/{total} checks passed): {self.reason}"


# ---------------------------------------------------------------------------
# DecisionGate
# ---------------------------------------------------------------------------

class DecisionGate:
    """
    Validates sweep decisions against safeguards before execution.

    Implements four independent checks:
    1. Hard floor - never below highest historical daily obligation + 20%
    2. Gradual ramp - max sweep % based on merchant tenure
    3. Override check - is merchant override (pause) active?
    4. Depeg check - is FIUSD within 0.5% of peg?
    """

    def __init__(
        self,
        yield_manager=None,
        hard_floor_buffer: Decimal = Decimal("0.20"),
        depeg_tolerance: Decimal = Decimal("0.005"),
    ):
        self._yield_mgr = yield_manager
        self._hard_floor_buffer = hard_floor_buffer
        self._depeg_tolerance = depeg_tolerance

    async def validate(
        self,
        merchant_id: str,
        proposed_amount: Decimal,
        current_balance: Decimal,
        tenure_months: int = 0,
        override_active: bool = False,
        historical_max_daily_outflow: Decimal = Decimal("0"),
        custom_hard_floor: Decimal | None = None,
    ) -> GateResult:
        """
        Run all safeguard checks against a proposed sweep amount.

        Args:
            merchant_id: Merchant identifier for logging.
            proposed_amount: Amount proposed to sweep into yield.
            current_balance: Current available balance.
            tenure_months: How long the merchant has been enrolled.
            override_active: Whether merchant has paused sweeping.
            historical_max_daily_outflow: Highest single-day outflow in history.
            custom_hard_floor: Merchant-configured absolute floor (overrides auto).

        Returns:
            GateResult with approval status and potentially adjusted amount.
        """
        checks: dict[str, bool] = {}
        adjusted = proposed_amount
        reasons: list[str] = []

        # ---- Check 1: Override ----
        if override_active:
            checks["override_check"] = False
            return GateResult(
                approved=False,
                reason="Merchant override is active; all sweeps paused.",
                adjusted_amount=Decimal("0"),
                checks=checks,
            )
        checks["override_check"] = True

        # ---- Check 2: Depeg ----
        if self._yield_mgr is not None:
            within_peg = self._yield_mgr.is_within_peg_tolerance(self._depeg_tolerance)
            checks["depeg_check"] = within_peg
            if not within_peg:
                peg = self._yield_mgr.peg_ratio
                return GateResult(
                    approved=False,
                    reason=(
                        f"FIUSD depeg detected (ratio={peg}). "
                        f"Sweeps suspended until peg restored within "
                        f"{self._depeg_tolerance * 100}%."
                    ),
                    adjusted_amount=Decimal("0"),
                    checks=checks,
                )
        else:
            checks["depeg_check"] = True

        # ---- Check 3: Hard floor ----
        if custom_hard_floor is not None:
            hard_floor = custom_hard_floor
        else:
            # Auto-calculate: highest daily obligation + buffer
            hard_floor = (
                historical_max_daily_outflow
                * (Decimal("1") + self._hard_floor_buffer)
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        post_sweep_balance = current_balance - adjusted
        if post_sweep_balance < hard_floor:
            max_possible = current_balance - hard_floor
            if max_possible > 0:
                adjusted = max_possible.quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )
                checks["hard_floor_check"] = True
                reasons.append(
                    f"Amount reduced from {proposed_amount} to {adjusted} "
                    f"to maintain hard floor of {hard_floor}."
                )
            else:
                checks["hard_floor_check"] = False
                return GateResult(
                    approved=False,
                    reason=(
                        f"Balance {current_balance} is at or below hard floor "
                        f"{hard_floor}. No sweep possible."
                    ),
                    adjusted_amount=Decimal("0"),
                    checks=checks,
                )
        else:
            checks["hard_floor_check"] = True

        # ---- Check 4: Gradual ramp ----
        ramp_pct = _get_ramp_pct(tenure_months)
        # "excess" is what's above the hard floor
        excess = current_balance - hard_floor
        max_by_ramp = (excess * ramp_pct).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        if adjusted > max_by_ramp:
            adjusted = max_by_ramp
            reasons.append(
                f"Amount capped to {adjusted} by gradual ramp "
                f"({ramp_pct * 100}% for {tenure_months}-month tenure)."
            )
        checks["ramp_check"] = True

        # ---- Minimum sweep check ----
        min_sweep = Decimal("100.00")
        if adjusted < min_sweep:
            checks["min_sweep_check"] = False
            return GateResult(
                approved=False,
                reason=(
                    f"Adjusted sweep amount {adjusted} is below minimum "
                    f"threshold of {min_sweep}."
                ),
                adjusted_amount=Decimal("0"),
                checks=checks,
            )
        checks["min_sweep_check"] = True

        # ---- All checks passed ----
        reason = "; ".join(reasons) if reasons else "All safeguards passed."
        logger.info(
            "Gate APPROVED for merchant %s: proposed=%s, adjusted=%s, reason=%s",
            merchant_id, proposed_amount, adjusted, reason,
        )

        return GateResult(
            approved=True,
            reason=reason,
            adjusted_amount=adjusted,
            checks=checks,
        )
