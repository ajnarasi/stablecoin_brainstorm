"""INDX real-time USD settlement simulator.

Replicates the INDX protocol's FIUSD-to-USD settlement behavior
with realistic latency, FDIC coverage calculations, and detailed
state tracking. Used for demos and integration testing.
"""

from __future__ import annotations

import asyncio
import logging
import random
import uuid
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Any

from .models import (
    BankDetails,
    FDICCoverage,
    FDICStatus,
    SettlementResult,
    SettlementState,
    SettlementStatus,
)

logger = logging.getLogger(__name__)

# FDIC coverage limit for the FIUSD program (per depositor, per bank)
_FDIC_LIMIT = Decimal("25000000")

# Pre-configured demo bank details
_DEMO_BANKS: dict[str, BankDetails] = {
    "chase": BankDetails(
        bank_name="JPMorgan Chase",
        routing_number="021000021",
        account_number_masked="***4891",
        account_type="checking",
    ),
    "bofa": BankDetails(
        bank_name="Bank of America",
        routing_number="026009593",
        account_number_masked="***7723",
        account_type="checking",
    ),
    "wells": BankDetails(
        bank_name="Wells Fargo",
        routing_number="121000248",
        account_number_masked="***3356",
        account_type="checking",
    ),
    "bnym": BankDetails(
        bank_name="Bank of New York Mellon",
        routing_number="021000018",
        account_number_masked="***9102",
        account_type="checking",
    ),
    "default": BankDetails(
        bank_name="JPMorgan Chase",
        routing_number="021000021",
        account_number_masked="***4891",
        account_type="checking",
    ),
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uid() -> str:
    return f"INDX_{uuid.uuid4().hex[:16].upper()}"


class INDXSimulator:
    """Simulates INDX real-time USD settlement for FIUSD off-ramp.

    Models the full settlement lifecycle:
    1. FIUSD locked in escrow
    2. USD release initiated to recipient bank
    3. USD settled and confirmed

    Provides realistic 1-3 second latency and tracks settlement
    state transitions for demo and integration testing.

    Parameters
    ----------
    simulated_latency_ms:
        Base settlement latency in milliseconds. Actual latency
        varies +/- 30% around this value to simulate real-world
        network conditions. Defaults to 2500ms.
    """

    def __init__(self, simulated_latency_ms: int = 2500) -> None:
        self._base_latency_ms = simulated_latency_ms
        self._settlements: dict[str, SettlementResult] = {}
        self._status_log: dict[str, SettlementStatus] = {}
        self._total_settled = Decimal("0")

    # -- settlement ----------------------------------------------------------

    async def settle_to_usd(
        self,
        fiusd_amount: Decimal,
        recipient_bank: str,
        recipient_account: str,
    ) -> SettlementResult:
        """Settle FIUSD to USD in a recipient bank account.

        Simulates the full INDX settlement flow with realistic latency
        and state transitions. The FIUSD is burned and USD is released
        to the specified bank account.

        Parameters
        ----------
        fiusd_amount:
            Amount of FIUSD to settle (burned in exchange for USD).
        recipient_bank:
            Bank identifier (e.g., ``"chase"``, ``"bofa"``) or bank name.
        recipient_account:
            Masked or full account reference at the recipient bank.

        Returns
        -------
        SettlementResult
            Complete settlement details including FDIC coverage,
            bank routing info, and timing.

        Raises
        ------
        ValueError
            If the amount is non-positive.
        """
        if fiusd_amount <= 0:
            raise ValueError("Settlement amount must be positive")

        settlement_id = _uid()
        initiated_at = _now()
        bank_key = recipient_bank.lower().replace(" ", "")

        # Resolve bank details
        bank = _DEMO_BANKS.get(bank_key)
        if bank is None:
            bank = BankDetails(
                bank_name=recipient_bank,
                routing_number="021000021",
                account_number_masked=f"***{recipient_account[-4:]}",
                account_type="checking",
            )

        # Calculate FDIC coverage
        fdic = self._calculate_fdic_coverage(fiusd_amount)

        # Build state history
        state_history: list[dict[str, Any]] = []

        # Phase 1: Lock FIUSD
        state_history.append({
            "state": SettlementState.INITIATED,
            "timestamp": initiated_at.isoformat(),
        })
        state_history.append({
            "state": SettlementState.FIUSD_LOCKED,
            "timestamp": initiated_at.isoformat(),
        })

        # Phase 2: Simulate network latency for USD release
        jitter = random.uniform(0.7, 1.3)
        actual_latency_ms = int(self._base_latency_ms * jitter)
        await asyncio.sleep(actual_latency_ms / 1000.0)

        usd_releasing_at = _now()
        state_history.append({
            "state": SettlementState.USD_RELEASING,
            "timestamp": usd_releasing_at.isoformat(),
        })

        # Phase 3: Brief confirmation delay
        await asyncio.sleep(random.uniform(0.1, 0.3))

        completed_at = _now()
        state_history.append({
            "state": SettlementState.USD_SETTLED,
            "timestamp": completed_at.isoformat(),
        })
        state_history.append({
            "state": SettlementState.COMPLETED,
            "timestamp": completed_at.isoformat(),
        })

        # 1:1 peg, no fee for on-network settlements
        usd_amount = fiusd_amount
        fee = Decimal("0")

        total_ms = int(
            (completed_at - initiated_at).total_seconds() * 1000
        )

        result = SettlementResult(
            settlement_id=settlement_id,
            fiusd_amount=fiusd_amount,
            usd_amount=usd_amount,
            fee=fee,
            state=SettlementState.COMPLETED,
            recipient_bank=bank,
            fdic_coverage=fdic,
            initiated_at=initiated_at,
            completed_at=completed_at,
            settlement_time_ms=total_ms,
            network_confirmations=1,
            metadata={
                "rail": "INDX_instant",
                "peg_ratio": "1.000",
                "recipient_account_ref": recipient_account,
            },
        )

        # Store for status lookups
        self._settlements[settlement_id] = result
        self._status_log[settlement_id] = SettlementStatus(
            settlement_id=settlement_id,
            state=SettlementState.COMPLETED,
            fiusd_amount=fiusd_amount,
            usd_amount=usd_amount,
            progress_pct=100,
            state_history=state_history,
        )
        self._total_settled += usd_amount

        logger.info(
            "Settlement completed: id=%s, amount=%s FIUSD -> %s USD, "
            "bank=%s, latency=%dms",
            settlement_id,
            fiusd_amount,
            usd_amount,
            bank.bank_name,
            total_ms,
        )

        return result

    # -- status lookup -------------------------------------------------------

    async def get_settlement_status(
        self,
        settlement_id: str,
    ) -> SettlementStatus:
        """Retrieve the current status of a settlement.

        Parameters
        ----------
        settlement_id:
            The unique settlement identifier returned from ``settle_to_usd``.

        Returns
        -------
        SettlementStatus
            Current state, progress, and full state history.

        Raises
        ------
        KeyError
            If the settlement ID is not found.
        """
        status = self._status_log.get(settlement_id)
        if status is None:
            raise KeyError(f"Settlement not found: {settlement_id}")
        return status

    # -- FDIC coverage -------------------------------------------------------

    async def get_fdic_coverage(self, amount: Decimal) -> FDICCoverage:
        """Calculate FDIC insurance coverage for a given amount.

        The FIUSD program provides FDIC coverage up to $25M per
        depositor through partner custodian banks.

        Parameters
        ----------
        amount:
            The USD-equivalent amount to evaluate.

        Returns
        -------
        FDICCoverage
            Coverage details including covered/uncovered amounts
            and custodian bank information.
        """
        return self._calculate_fdic_coverage(amount)

    def _calculate_fdic_coverage(self, amount: Decimal) -> FDICCoverage:
        """Internal FDIC coverage calculation."""
        if amount <= _FDIC_LIMIT:
            return FDICCoverage(
                amount=amount,
                fdic_limit=_FDIC_LIMIT,
                covered_amount=amount,
                uncovered_amount=Decimal("0"),
                status=FDICStatus.FULLY_COVERED,
                coverage_ratio=Decimal("1.0"),
            )

        covered = _FDIC_LIMIT
        uncovered = amount - _FDIC_LIMIT
        ratio = (covered / amount).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)

        return FDICCoverage(
            amount=amount,
            fdic_limit=_FDIC_LIMIT,
            covered_amount=covered,
            uncovered_amount=uncovered,
            status=FDICStatus.EXCEEDS_LIMIT,
            coverage_ratio=ratio,
        )

    # -- diagnostics ---------------------------------------------------------

    async def health_check(self) -> dict[str, Any]:
        """Return simulator health and statistics."""
        return {
            "status": "healthy",
            "mode": "simulator",
            "base_latency_ms": self._base_latency_ms,
            "total_settlements": len(self._settlements),
            "total_settled_usd": str(self._total_settled),
            "fdic_limit": str(_FDIC_LIMIT),
        }
