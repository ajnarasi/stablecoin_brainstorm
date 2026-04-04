"""
Pydantic schemas for API request/response serialization.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, ConfigDict


# ---------------------------------------------------------------------------
# Enums (mirror DB enums for API layer)
# ---------------------------------------------------------------------------

class RiskToleranceSchema(str, Enum):
    CONSERVATIVE = "CONSERVATIVE"
    MODERATE = "MODERATE"
    AGGRESSIVE = "AGGRESSIVE"


class SweepDecisionStatusSchema(str, Enum):
    APPROVED = "APPROVED"
    DENIED = "DENIED"


class SweepDirectionSchema(str, Enum):
    SWEEP = "SWEEP"
    UNSWEEP = "UNSWEEP"


class SweepExecutionStatusSchema(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class TransactionTypeSchema(str, Enum):
    SETTLEMENT = "SETTLEMENT"
    PAYOUT = "PAYOUT"
    PAYROLL = "PAYROLL"
    RENT = "RENT"
    SUPPLIER = "SUPPLIER"
    TAX = "TAX"
    OTHER_OUTFLOW = "OTHER_OUTFLOW"


# ---------------------------------------------------------------------------
# Merchant
# ---------------------------------------------------------------------------

class SweepConfig(BaseModel):
    """Merchant sweep configuration."""

    enabled: bool = True
    min_sweep_amount: Decimal = Field(default=Decimal("500.00"), ge=0)
    safety_buffer_pct: Decimal = Field(
        default=Decimal("0.20"),
        ge=0,
        le=1,
        description="Safety buffer as fraction of predicted outflows",
    )
    hard_floor: Decimal | None = Field(
        default=None,
        description="Absolute minimum balance to maintain. Auto-calculated if None.",
    )
    max_sweep_pct: Decimal | None = Field(
        default=None,
        description="Max % of excess to sweep. Auto-calculated from tenure if None.",
    )


class MerchantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    clover_id: str | None
    sweep_config: dict[str, Any]
    risk_tolerance: RiskToleranceSchema
    override_active: bool
    tenure_months: int
    created_at: datetime


class MerchantConfigUpdate(BaseModel):
    """Update merchant sweep configuration."""

    sweep_config: SweepConfig | None = None
    risk_tolerance: RiskToleranceSchema | None = None
    override_active: bool | None = None


# ---------------------------------------------------------------------------
# Predictions
# ---------------------------------------------------------------------------

class PredictionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    merchant_id: str
    predicted_balance: Decimal
    predicted_outflows: Decimal
    confidence: Decimal
    horizon_days: int
    created_at: datetime


class SeasonalPatternResponse(BaseModel):
    weekday_avg: dict[str, Decimal]  # "Monday" -> avg
    monthly_avg: dict[int, Decimal]  # day_of_month -> avg
    peak_day: str
    trough_day: str


# ---------------------------------------------------------------------------
# Sweep Decisions
# ---------------------------------------------------------------------------

class SweepDecisionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    merchant_id: str
    prediction_id: int | None
    proposed_amount: Decimal
    decision: SweepDecisionStatusSchema
    reason: str | None
    created_at: datetime


class SweepEvaluationResult(BaseModel):
    """Full result of a sweep evaluation including decision and context."""

    decision: SweepDecisionResponse
    current_balance: Decimal
    predicted_outflows: Decimal
    safety_buffer: Decimal
    hard_floor: Decimal
    excess_available: Decimal
    ramp_pct: Decimal
    fiusd_position: Decimal


# ---------------------------------------------------------------------------
# Sweep Executions
# ---------------------------------------------------------------------------

class SweepExecutionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    decision_id: int
    finxact_txn_id: str | None
    amount: Decimal
    direction: SweepDirectionSchema
    status: SweepExecutionStatusSchema
    created_at: datetime


# ---------------------------------------------------------------------------
# Earnings
# ---------------------------------------------------------------------------

class DailyAccrualResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: date
    principal: Decimal
    rate: Decimal
    accrued: Decimal
    cumulative: Decimal


class EarningsReport(BaseModel):
    """Complete earnings data for dashboard."""

    merchant_id: str
    current_principal: Decimal
    total_accrued: Decimal
    total_value: Decimal
    current_apy: Decimal
    daily_earnings_rate: Decimal
    accrual_history: list[DailyAccrualResponse]
    projected_30d: Decimal
    projected_annual: Decimal


# ---------------------------------------------------------------------------
# Dashboard (combined response)
# ---------------------------------------------------------------------------

class DashboardResponse(BaseModel):
    """All dashboard data in one call."""

    merchant: MerchantResponse
    current_balance: Decimal
    fiusd_position: Decimal
    total_value: Decimal
    latest_prediction: PredictionResponse | None
    recent_sweeps: list[SweepDecisionResponse]
    earnings: EarningsReport
    seasonal_patterns: SeasonalPatternResponse | None


# ---------------------------------------------------------------------------
# Transactions
# ---------------------------------------------------------------------------

class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    merchant_id: str
    amount: Decimal
    type: TransactionTypeSchema
    description: str | None
    timestamp: datetime


# ---------------------------------------------------------------------------
# Health / Demo
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str
    demo_mode: bool
    finxact_status: str
    indx_status: str


class DemoSeedResponse(BaseModel):
    merchant_id: str
    transactions_created: int
    days_seeded: int
    model_trained: bool


class DemoScenarioResponse(BaseModel):
    """Pre-built demo scenario data for investor day presentation."""

    merchant: MerchantResponse
    balance_history: list[dict[str, Any]]
    sweep_history: list[SweepDecisionResponse]
    earnings_summary: EarningsReport
    ai_insights: list[str]
