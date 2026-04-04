"""Pydantic models for Finxact API entities.

Defines the data structures for accounts, balances, positions,
transfers, and sweep operations used across all prototypes.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
try:
    from enum import StrEnum
except ImportError:  # Python < 3.11
    from enum import Enum

    class StrEnum(str, Enum):
        """Back-port of enum.StrEnum for Python 3.9/3.10."""
from typing import Any

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class AccountStatus(StrEnum):
    """Possible states for a Finxact account."""

    ACTIVE = "active"
    FROZEN = "frozen"
    CLOSED = "closed"
    PENDING = "pending"


class PositionType(StrEnum):
    """Types of positions that can be held on an account."""

    DEMAND = "demand"
    YIELD = "yield"
    RESERVE = "reserve"
    SETTLEMENT = "settlement"


class TransferStatus(StrEnum):
    """Status of a transfer or sweep operation."""

    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REVERSED = "reversed"


class SweepDirection(StrEnum):
    """Direction of a sweep operation."""

    TO_YIELD = "to_yield"
    FROM_YIELD = "from_yield"


# ---------------------------------------------------------------------------
# Core Models
# ---------------------------------------------------------------------------

class Account(BaseModel):
    """Represents a Finxact deposit or stablecoin account."""

    account_id: str = Field(..., description="Unique account identifier")
    account_name: str = Field(..., description="Human-readable account name")
    account_type: str = Field(default="DDA", description="Account type code")
    status: AccountStatus = Field(default=AccountStatus.ACTIVE)
    currency: str = Field(default="USD", description="ISO 4217 currency code")
    asset: str = Field(default="FIUSD", description="Digital asset code")
    owner_id: str = Field(..., description="Account owner (merchant/entity) ID")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = Field(default_factory=dict)

    model_config = {"str_strip_whitespace": True}


class Balance(BaseModel):
    """Account balance breakdown."""

    account_id: str
    total: Decimal = Field(..., description="Total balance across all positions")
    available: Decimal = Field(..., description="Available (demand) balance")
    yield_allocated: Decimal = Field(
        default=Decimal("0"),
        description="Amount allocated to yield positions",
    )
    reserve_held: Decimal = Field(
        default=Decimal("0"),
        description="Amount held in reserve",
    )
    pending_in: Decimal = Field(
        default=Decimal("0"),
        description="Pending incoming transfers",
    )
    pending_out: Decimal = Field(
        default=Decimal("0"),
        description="Pending outgoing transfers",
    )
    currency: str = Field(default="USD")
    as_of: datetime = Field(default_factory=datetime.utcnow)

    @field_validator("total", "available", "yield_allocated", "reserve_held", mode="before")
    @classmethod
    def coerce_decimal(cls, v: Any) -> Decimal:
        """Accept strings and floats, converting to Decimal."""
        if isinstance(v, float):
            return Decimal(str(v))
        return Decimal(v) if not isinstance(v, Decimal) else v


class Position(BaseModel):
    """A sub-account position (demand, yield, reserve, or settlement)."""

    position_id: str = Field(..., description="Unique position identifier")
    account_id: str
    position_type: PositionType
    amount: Decimal
    asset: str = Field(default="FIUSD")
    apy: Decimal | None = Field(
        default=None,
        description="Annual percentage yield (for yield positions)",
    )
    accrued_interest: Decimal = Field(
        default=Decimal("0"),
        description="Interest accrued but not yet paid",
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("amount", "accrued_interest", mode="before")
    @classmethod
    def coerce_decimal(cls, v: Any) -> Decimal:
        if isinstance(v, float):
            return Decimal(str(v))
        return Decimal(v) if not isinstance(v, Decimal) else v


class TransferResult(BaseModel):
    """Result of a transfer or B2B payment operation."""

    transfer_id: str = Field(..., description="Unique transfer reference")
    from_account: str
    to_account: str
    amount: Decimal
    asset: str = Field(default="FIUSD")
    status: TransferStatus = Field(default=TransferStatus.COMPLETED)
    reference: str = Field(default="", description="External payment reference")
    fee: Decimal = Field(default=Decimal("0"), description="Transaction fee")
    executed_at: datetime = Field(default_factory=datetime.utcnow)
    settlement_time_ms: int = Field(
        default=0,
        description="Time taken for settlement in milliseconds",
    )
    metadata: dict[str, Any] = Field(default_factory=dict)


class SweepResult(BaseModel):
    """Result of a sweep-to-yield or unsweep-from-yield operation."""

    sweep_id: str = Field(..., description="Unique sweep operation reference")
    account_id: str
    direction: SweepDirection
    amount: Decimal
    from_position_type: PositionType
    to_position_type: PositionType
    status: TransferStatus = Field(default=TransferStatus.COMPLETED)
    new_yield_balance: Decimal = Field(
        default=Decimal("0"),
        description="Yield position balance after sweep",
    )
    new_demand_balance: Decimal = Field(
        default=Decimal("0"),
        description="Demand position balance after sweep",
    )
    apy: Decimal = Field(
        default=Decimal("4.25"),
        description="Current APY for yield position",
    )
    executed_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = Field(default_factory=dict)
