"""SQLAlchemy models for cross-border instant settlement prototype."""

from datetime import datetime
from decimal import Decimal
from enum import Enum as PyEnum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class RoutingMethod(str, PyEnum):
    CARD = "CARD"
    STABLECOIN = "STABLECOIN"


class TransactionStatus(str, PyEnum):
    PENDING = "PENDING"
    DETECTING = "DETECTING"
    FX_LOCKING = "FX_LOCKING"
    CONVERTING = "CONVERTING"
    SETTLING = "SETTLING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class SettlementMethod(str, PyEnum):
    CARD = "CARD"
    FIUSD_INDX = "FIUSD_INDX"


class FXConversionStatus(str, PyEnum):
    RATE_LOCKED = "RATE_LOCKED"
    CONVERTING = "CONVERTING"
    COMPLETED = "COMPLETED"
    EXPIRED = "EXPIRED"
    FAILED = "FAILED"


class SettlementStatus(str, PyEnum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(String(50), primary_key=True)
    name = Column(String(200), nullable=False)
    country = Column(String(2), nullable=False)
    currency = Column(String(3), nullable=False)
    commercehub_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    transactions = relationship("Transaction", back_populates="merchant")


class Buyer(Base):
    __tablename__ = "buyers"

    id = Column(String(50), primary_key=True)
    name = Column(String(200), nullable=False)
    country = Column(String(2), nullable=False)
    currency = Column(String(3), nullable=False)
    email = Column(String(200), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    transactions = relationship("Transaction", back_populates="buyer")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(50), primary_key=True)
    merchant_id = Column(String(50), ForeignKey("merchants.id"), nullable=False)
    buyer_id = Column(String(50), ForeignKey("buyers.id"), nullable=False)
    amount_local = Column(Numeric(18, 4), nullable=False)
    amount_usd = Column(Numeric(18, 4), nullable=True)
    buyer_currency = Column(String(3), nullable=False)
    merchant_currency = Column(String(3), nullable=False)
    is_cross_border = Column(Boolean, default=False)
    routing = Column(Enum(RoutingMethod), nullable=True)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING)
    compliance_status = Column(String(20), default="PENDING")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    merchant = relationship("Merchant", back_populates="transactions")
    buyer = relationship("Buyer", back_populates="transactions")
    fx_conversion = relationship("FXConversion", back_populates="transaction", uselist=False)
    settlement = relationship("Settlement", back_populates="transaction", uselist=False)
    route_comparison = relationship("RouteComparison", back_populates="transaction", uselist=False)


class FXConversion(Base):
    __tablename__ = "fx_conversions"

    id = Column(String(50), primary_key=True)
    transaction_id = Column(String(50), ForeignKey("transactions.id"), nullable=False, unique=True)
    from_currency = Column(String(3), nullable=False)
    to_currency = Column(String(3), nullable=False)
    rate = Column(Numeric(18, 8), nullable=False)
    rate_locked_at = Column(DateTime, nullable=False)
    rate_expiry = Column(DateTime, nullable=False)
    fiusd_amount = Column(Numeric(18, 4), nullable=False)
    status = Column(Enum(FXConversionStatus), default=FXConversionStatus.RATE_LOCKED)
    completed_at = Column(DateTime, nullable=True)

    transaction = relationship("Transaction", back_populates="fx_conversion")


class Settlement(Base):
    __tablename__ = "settlements"

    id = Column(String(50), primary_key=True)
    transaction_id = Column(String(50), ForeignKey("transactions.id"), nullable=False, unique=True)
    method = Column(Enum(SettlementMethod), nullable=False)
    amount_usd = Column(Numeric(18, 4), nullable=False)
    fee_amount = Column(Numeric(18, 4), nullable=False)
    fee_pct = Column(Numeric(8, 4), nullable=False)
    settlement_time_seconds = Column(Integer, nullable=False)
    indx_settlement_id = Column(String(100), nullable=True)
    status = Column(Enum(SettlementStatus), default=SettlementStatus.PENDING)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    transaction = relationship("Transaction", back_populates="settlement")


class RouteComparison(Base):
    __tablename__ = "route_comparisons"

    id = Column(String(50), primary_key=True)
    transaction_id = Column(String(50), ForeignKey("transactions.id"), nullable=False, unique=True)
    card_fee = Column(Numeric(18, 4), nullable=False)
    card_fee_pct = Column(Numeric(8, 4), nullable=False)
    card_settlement_days = Column(Integer, nullable=False)
    stablecoin_fee = Column(Numeric(18, 4), nullable=False)
    stablecoin_fee_pct = Column(Numeric(8, 4), nullable=False)
    stablecoin_settlement_seconds = Column(Integer, nullable=False)
    savings_amount = Column(Numeric(18, 4), nullable=False)
    savings_pct = Column(Numeric(8, 4), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    transaction = relationship("Transaction", back_populates="route_comparison")
