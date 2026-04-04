"""INDX settlement simulator for Fiserv crypto prototypes.

Simulates the INDX protocol's real-time FIUSD-to-USD settlement
with realistic latency, FDIC coverage tracking, and bank routing.

Usage::

    from indx_simulator import INDXSimulator

    sim = INDXSimulator(simulated_latency_ms=2500)
    result = await sim.settle_to_usd(
        fiusd_amount=Decimal("50000"),
        recipient_bank="chase",
        recipient_account="****4891",
    )
"""

from .models import (
    BankDetails,
    FDICCoverage,
    FDICStatus,
    SettlementResult,
    SettlementState,
    SettlementStatus,
)
from .simulator import INDXSimulator

__all__ = [
    "INDXSimulator",
    "BankDetails",
    "FDICCoverage",
    "FDICStatus",
    "SettlementResult",
    "SettlementState",
    "SettlementStatus",
]
