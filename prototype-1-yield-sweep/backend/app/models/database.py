"""
SQLAlchemy models and async engine setup for the Yield Sweep prototype.
Uses PostgreSQL via asyncpg in production, SQLite for demo mode.
"""

import enum
import os
from datetime import datetime, timezone
from decimal import Decimal
from typing import AsyncGenerator

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    Date,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, relationship


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class RiskTolerance(str, enum.Enum):
    CONSERVATIVE = "CONSERVATIVE"
    MODERATE = "MODERATE"
    AGGRESSIVE = "AGGRESSIVE"


class TransactionType(str, enum.Enum):
    SETTLEMENT = "SETTLEMENT"       # Incoming card settlement
    PAYOUT = "PAYOUT"               # Merchant payout / withdrawal
    PAYROLL = "PAYROLL"             # Payroll disbursement
    RENT = "RENT"                   # Rent payment
    SUPPLIER = "SUPPLIER"           # Supplier payment
    TAX = "TAX"                     # Tax payment
    OTHER_OUTFLOW = "OTHER_OUTFLOW"


class SweepDecisionStatus(str, enum.Enum):
    APPROVED = "APPROVED"
    DENIED = "DENIED"


class SweepDirection(str, enum.Enum):
    SWEEP = "SWEEP"       # USD -> FIUSD
    UNSWEEP = "UNSWEEP"   # FIUSD -> USD


class SweepExecutionStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------

class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(String(64), primary_key=True)
    name = Column(String(256), nullable=False)
    clover_id = Column(String(64), nullable=True)
    sweep_config = Column(JSON, nullable=False, default=dict)
    risk_tolerance = Column(
        Enum(RiskTolerance), nullable=False, default=RiskTolerance.MODERATE
    )
    override_active = Column(Boolean, nullable=False, default=False)
    tenure_months = Column(Integer, nullable=False, default=0)
    finxact_account_id = Column(String(64), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    transactions = relationship("Transaction", back_populates="merchant")
    predictions = relationship("Prediction", back_populates="merchant")
    sweep_decisions = relationship("SweepDecision", back_populates="merchant")
    yield_accruals = relationship("YieldAccrual", back_populates="merchant")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    merchant_id = Column(
        String(64), ForeignKey("merchants.id"), nullable=False, index=True
    )
    amount = Column(Numeric(14, 2), nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    description = Column(Text, nullable=True)
    timestamp = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    merchant = relationship("Merchant", back_populates="transactions")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    merchant_id = Column(
        String(64), ForeignKey("merchants.id"), nullable=False, index=True
    )
    predicted_balance = Column(Numeric(14, 2), nullable=False)
    predicted_outflows = Column(Numeric(14, 2), nullable=False)
    confidence = Column(Numeric(5, 4), nullable=False)
    horizon_days = Column(Integer, nullable=False, default=3)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    merchant = relationship("Merchant", back_populates="predictions")
    sweep_decisions = relationship("SweepDecision", back_populates="prediction")


class SweepDecision(Base):
    __tablename__ = "sweep_decisions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    merchant_id = Column(
        String(64), ForeignKey("merchants.id"), nullable=False, index=True
    )
    prediction_id = Column(
        Integer, ForeignKey("predictions.id"), nullable=True
    )
    proposed_amount = Column(Numeric(14, 2), nullable=False)
    decision = Column(Enum(SweepDecisionStatus), nullable=False)
    reason = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    merchant = relationship("Merchant", back_populates="sweep_decisions")
    prediction = relationship("Prediction", back_populates="sweep_decisions")
    execution = relationship(
        "SweepExecution", back_populates="decision", uselist=False
    )


class SweepExecution(Base):
    __tablename__ = "sweep_executions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    decision_id = Column(
        Integer, ForeignKey("sweep_decisions.id"), nullable=False, unique=True
    )
    finxact_txn_id = Column(String(64), nullable=True)
    amount = Column(Numeric(14, 2), nullable=False)
    direction = Column(Enum(SweepDirection), nullable=False)
    status = Column(
        Enum(SweepExecutionStatus),
        nullable=False,
        default=SweepExecutionStatus.PENDING,
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    decision = relationship("SweepDecision", back_populates="execution")


class YieldAccrual(Base):
    __tablename__ = "yield_accruals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    merchant_id = Column(
        String(64), ForeignKey("merchants.id"), nullable=False, index=True
    )
    date = Column(Date, nullable=False)
    principal = Column(Numeric(14, 2), nullable=False)
    rate = Column(Numeric(8, 6), nullable=False)
    accrued = Column(Numeric(14, 2), nullable=False)
    cumulative = Column(Numeric(14, 2), nullable=False)

    merchant = relationship("Merchant", back_populates="yield_accruals")


# ---------------------------------------------------------------------------
# Engine / Session factory
# ---------------------------------------------------------------------------

_engine = None
_session_factory = None


def get_database_url() -> str:
    """Resolve database URL, falling back to SQLite for demo mode."""
    url = os.getenv("DATABASE_URL")
    if url:
        return url
    demo_mode = os.getenv("DEMO_MODE", "true").lower() == "true"
    if demo_mode:
        return "sqlite+aiosqlite:///yield_sweep_demo.db"
    raise RuntimeError("DATABASE_URL must be set when DEMO_MODE is not true")


def get_engine():
    global _engine
    if _engine is None:
        url = get_database_url()
        _engine = create_async_engine(
            url,
            echo=os.getenv("SQL_ECHO", "false").lower() == "true",
            pool_pre_ping=True,
        )
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _session_factory


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for FastAPI route injection."""
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db() -> None:
    """Create all tables."""
    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def drop_db() -> None:
    """Drop all tables (for test/demo reset)."""
    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
