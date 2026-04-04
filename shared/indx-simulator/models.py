"""Pydantic models for the INDX settlement simulator.

Defines settlement results, status tracking, FDIC coverage information,
and bank routing details used by the USD off-ramp flow.
"""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
try:
    from enum import StrEnum
except ImportError:  # Python < 3.11
    from enum import Enum

    class StrEnum(str, Enum):
        """Back-port of enum.StrEnum for Python 3.9/3.10."""
from typing import Any

from pydantic import BaseModel, Field, field_validator


class SettlementState(StrEnum):
    """Lifecycle states for an INDX settlement."""

    INITIATED = "initiated"
    FIUSD_LOCKED = "fiusd_locked"
    USD_RELEASING = "usd_releasing"
    USD_SETTLED = "usd_settled"
    COMPLETED = "completed"
    FAILED = "failed"
    REVERSED = "reversed"


class FDICStatus(StrEnum):
    """FDIC insurance coverage status."""

    FULLY_COVERED = "fully_covered"
    PARTIALLY_COVERED = "partially_covered"
    EXCEEDS_LIMIT = "exceeds_limit"


class BankDetails(BaseModel):
    """Recipient bank routing information for USD settlement."""

    bank_name: str = Field(..., description="Receiving bank name")
    routing_number: str = Field(..., description="ABA routing number")
    account_number_masked: str = Field(
        ..., description="Last 4 digits of account (masked)",
    )
    account_type: str = Field(default="checking", description="checking or savings")
    swift_code: str | None = Field(
        default=None, description="SWIFT/BIC for international wires",
    )


class FDICCoverage(BaseModel):
    """FDIC insurance coverage details for a settlement amount."""

    amount: Decimal = Field(..., description="Amount being evaluated")
    fdic_limit: Decimal = Field(
        default=Decimal("25000000"),
        description="FDIC coverage limit ($25M for FIUSD program)",
    )
    covered_amount: Decimal = Field(
        ..., description="Amount covered by FDIC insurance",
    )
    uncovered_amount: Decimal = Field(
        default=Decimal("0"),
        description="Amount exceeding FDIC coverage",
    )
    status: FDICStatus = Field(
        default=FDICStatus.FULLY_COVERED,
        description="Overall coverage status",
    )
    custodian_banks: list[str] = Field(
        default_factory=lambda: [
            "JPMorgan Chase",
            "Bank of New York Mellon",
        ],
        description="Partner banks providing FDIC coverage",
    )
    coverage_ratio: Decimal = Field(
        default=Decimal("1.0"),
        description="Ratio of covered to total amount",
    )

    @field_validator("amount", "fdic_limit", "covered_amount", "uncovered_amount", mode="before")
    @classmethod
    def coerce_decimal(cls, v: Any) -> Decimal:
        if isinstance(v, float):
            return Decimal(str(v))
        return Decimal(v) if not isinstance(v, Decimal) else v


class SettlementResult(BaseModel):
    """Result of an INDX FIUSD-to-USD settlement operation."""

    settlement_id: str = Field(..., description="Unique settlement reference")
    fiusd_amount: Decimal = Field(..., description="FIUSD amount burned")
    usd_amount: Decimal = Field(
        ..., description="USD amount settled (after any fees)",
    )
    fee: Decimal = Field(default=Decimal("0"), description="Settlement fee")
    state: SettlementState = Field(default=SettlementState.COMPLETED)
    recipient_bank: BankDetails
    fdic_coverage: FDICCoverage
    initiated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: datetime | None = Field(default=None)
    settlement_time_ms: int = Field(
        default=0,
        description="End-to-end settlement latency in milliseconds",
    )
    network_confirmations: int = Field(
        default=1,
        description="Number of network confirmations received",
    )
    metadata: dict[str, Any] = Field(default_factory=dict)


class SettlementStatus(BaseModel):
    """Current status of an in-flight or completed settlement."""

    settlement_id: str
    state: SettlementState
    fiusd_amount: Decimal
    usd_amount: Decimal
    progress_pct: int = Field(
        default=100,
        ge=0,
        le=100,
        description="Settlement progress percentage",
    )
    state_history: list[dict[str, Any]] = Field(
        default_factory=list,
        description="Ordered list of state transitions with timestamps",
    )
    estimated_completion: datetime | None = Field(default=None)
    error_message: str | None = Field(default=None)
