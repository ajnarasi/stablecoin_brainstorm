"""Pydantic schemas for cross-border instant settlement prototype."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ---------- Enums ----------

class RoutingMethod(str, Enum):
    CARD = "CARD"
    STABLECOIN = "STABLECOIN"


class TransactionStatus(str, Enum):
    PENDING = "PENDING"
    DETECTING = "DETECTING"
    FX_LOCKING = "FX_LOCKING"
    CONVERTING = "CONVERTING"
    SETTLING = "SETTLING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class SettlementMethod(str, Enum):
    CARD = "CARD"
    FIUSD_INDX = "FIUSD_INDX"


# ---------- Cross-Border Detection ----------

class CardRouteEstimate(BaseModel):
    processing_pct: Decimal
    fx_markup_pct: Decimal
    total_fee_pct: Decimal
    settlement_days: int
    intermediary_count: int = 3


class CrossBorderResult(BaseModel):
    is_cross_border: bool
    corridor: Optional[str] = None
    buyer_country: str
    merchant_country: str
    buyer_currency: str
    merchant_currency: str
    card_route_estimate: Optional[CardRouteEstimate] = None
    stablecoin_route_available: bool = False


# ---------- FX Engine ----------

class FXRate(BaseModel):
    from_currency: str
    to_currency: str
    mid_rate: Decimal
    bid_rate: Decimal
    ask_rate: Decimal
    spread_pct: Decimal
    timestamp: datetime


class RateLock(BaseModel):
    lock_id: str
    from_currency: str
    to_currency: str
    rate: Decimal
    amount_local: Decimal
    fiusd_amount: Decimal
    locked_at: datetime
    expiry: datetime


class ConversionResult(BaseModel):
    lock_id: str
    from_currency: str
    to_currency: str
    rate: Decimal
    amount_local: Decimal
    fiusd_amount: Decimal
    status: str
    converted_at: datetime


# ---------- Compliance ----------

class ComplianceResult(BaseModel):
    status: str
    screening_type: str
    buyer_name: str
    buyer_country: str
    timestamp: datetime
    note: str


# ---------- Settlement ----------

class SettlementResult(BaseModel):
    transaction_id: str
    method: SettlementMethod
    amount_usd: Decimal
    fee_amount: Decimal
    fee_pct: Decimal
    settlement_time_seconds: int
    indx_settlement_id: Optional[str] = None
    compliance: ComplianceResult
    fx_conversion: Optional[ConversionResult] = None
    status: str
    completed_at: datetime


class RouteComparisonSchema(BaseModel):
    transaction_id: str
    card_fee: Decimal
    card_fee_pct: Decimal
    card_settlement_days: int
    card_intermediaries: int = 3
    stablecoin_fee: Decimal
    stablecoin_fee_pct: Decimal
    stablecoin_settlement_seconds: int
    savings_amount: Decimal
    savings_pct: Decimal


# ---------- Analytics ----------

class CorridorStats(BaseModel):
    corridor: str
    transaction_count: int
    total_volume_usd: Decimal
    total_savings: Decimal
    avg_savings_pct: Decimal
    avg_settlement_seconds: int
    avg_card_settlement_days: int


class CorridorAnalytics(BaseModel):
    merchant_id: str
    period_days: int
    corridors: list[CorridorStats]
    total_cross_border_volume: Decimal
    total_savings: Decimal
    avg_savings_pct: Decimal
    total_transactions: int
    cross_border_transactions: int
    cross_border_pct: Decimal


# ---------- API Request/Response ----------

class PaymentRequest(BaseModel):
    buyer_id: str
    amount_local: Decimal = Field(gt=0)
    buyer_currency: str = Field(min_length=3, max_length=3)
    description: Optional[str] = None


class LiveTransactionRequest(BaseModel):
    buyer_id: str
    amount_local: Decimal = Field(gt=0)


class RateLockRequest(BaseModel):
    from_currency: str = Field(min_length=3, max_length=3)
    to_currency: str = Field(min_length=3, max_length=3)
    amount_local: Decimal = Field(gt=0)
    ttl_seconds: int = Field(default=30, ge=10, le=120)


class TransactionResponse(BaseModel):
    id: str
    merchant_id: str
    buyer_id: str
    buyer_name: Optional[str] = None
    amount_local: Decimal
    amount_usd: Optional[Decimal] = None
    buyer_currency: str
    merchant_currency: str
    is_cross_border: bool
    routing: Optional[str] = None
    status: str
    compliance_status: str
    created_at: datetime
    settlement: Optional[SettlementResult] = None
    route_comparison: Optional[RouteComparisonSchema] = None


class DashboardResponse(BaseModel):
    merchant_id: str
    merchant_name: str
    analytics: CorridorAnalytics
    recent_cross_border: list[TransactionResponse]
    fx_rates: list[FXRate]
    headline_stats: dict


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    demo_mode: bool
    timestamp: datetime
