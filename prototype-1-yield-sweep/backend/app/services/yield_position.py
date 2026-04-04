"""
Local yield position manager for the Yield Sweep prototype.

Manages FIUSD yield positions (mint/burn/accrual) for merchants.
The shared INDXSimulator handles settlement to USD; this module
handles the yield-bearing position lifecycle specific to Prototype 1.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import date, timezone
from decimal import Decimal, ROUND_HALF_UP
from uuid import uuid4

logger = logging.getLogger(__name__)


@dataclass
class FIUSDPosition:
    """Represents a merchant's FIUSD stablecoin yield position."""

    merchant_id: str
    principal: Decimal = Decimal("0.00")
    accrued_yield: Decimal = Decimal("0.00")
    total_value: Decimal = Decimal("0.00")
    apy: Decimal = Decimal("0.042")
    last_accrual_date: date | None = None


@dataclass
class MintBurnResult:
    """Result of a mint or burn operation."""

    txn_id: str
    merchant_id: str
    direction: str  # MINT or BURN
    amount: Decimal
    new_principal: Decimal


class YieldPositionManager:
    """
    Manages FIUSD yield positions for merchants in this prototype.

    Tracks principal, accrued yield, and provides mint/burn/accrual
    operations. Works alongside the shared FinxactClient for balance
    management and the shared INDXSimulator for USD settlement.
    """

    def __init__(self, apy: Decimal = Decimal("0.042")):
        self.apy = apy
        self._positions: dict[str, FIUSDPosition] = {}
        self._peg_ratio = Decimal("1.000")

    def _get_or_create_position(self, merchant_id: str) -> FIUSDPosition:
        if merchant_id not in self._positions:
            self._positions[merchant_id] = FIUSDPosition(
                merchant_id=merchant_id, apy=self.apy
            )
        return self._positions[merchant_id]

    async def mint(self, merchant_id: str, amount: Decimal) -> MintBurnResult:
        """Mint FIUSD by depositing USD into the yield position."""
        if amount <= 0:
            raise ValueError("Mint amount must be positive")

        position = self._get_or_create_position(merchant_id)
        position.principal += amount
        position.total_value = position.principal + position.accrued_yield

        txn_id = f"MINT-{uuid4().hex[:12].upper()}"
        logger.info(
            "FIUSD mint: merchant=%s, amount=%s, new_principal=%s",
            merchant_id, amount, position.principal,
        )
        return MintBurnResult(
            txn_id=txn_id,
            merchant_id=merchant_id,
            direction="MINT",
            amount=amount,
            new_principal=position.principal,
        )

    async def burn(self, merchant_id: str, amount: Decimal) -> MintBurnResult:
        """Burn FIUSD to release USD from the yield position."""
        position = self._get_or_create_position(merchant_id)
        if amount > position.principal:
            raise ValueError(
                f"Burn amount {amount} exceeds principal {position.principal}"
            )

        position.principal -= amount
        position.total_value = position.principal + position.accrued_yield

        txn_id = f"BURN-{uuid4().hex[:12].upper()}"
        logger.info(
            "FIUSD burn: merchant=%s, amount=%s, new_principal=%s",
            merchant_id, amount, position.principal,
        )
        return MintBurnResult(
            txn_id=txn_id,
            merchant_id=merchant_id,
            direction="BURN",
            amount=amount,
            new_principal=position.principal,
        )

    async def get_position(self, merchant_id: str) -> FIUSDPosition:
        """Get current FIUSD position for a merchant."""
        return self._get_or_create_position(merchant_id)

    def accrue_daily_yield(self, merchant_id: str, for_date: date) -> Decimal:
        """
        Calculate and accrue one day of yield on the position.
        daily_rate = APY / 365
        daily_yield = principal * daily_rate
        """
        position = self._get_or_create_position(merchant_id)
        if position.principal <= 0:
            return Decimal("0.00")

        daily_rate = self.apy / Decimal("365")
        daily_yield = (position.principal * daily_rate).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        position.accrued_yield += daily_yield
        position.total_value = position.principal + position.accrued_yield
        position.last_accrual_date = for_date

        return daily_yield

    @property
    def peg_ratio(self) -> Decimal:
        return self._peg_ratio

    def set_peg_ratio(self, ratio: Decimal) -> None:
        self._peg_ratio = ratio

    def is_within_peg_tolerance(
        self, tolerance: Decimal = Decimal("0.005")
    ) -> bool:
        return abs(self._peg_ratio - Decimal("1.0")) <= tolerance

    async def health_check(self) -> dict:
        return {
            "status": "healthy",
            "mode": "local_yield_manager",
            "peg_ratio": str(self._peg_ratio),
            "apy": str(self.apy),
            "active_positions": len(self._positions),
        }
