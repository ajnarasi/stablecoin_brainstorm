"""
Test fixtures for the Yield Sweep prototype.
"""

import os
import sys
from decimal import Decimal
from pathlib import Path

import pytest
import pytest_asyncio

# Set demo mode and SQLite for tests
os.environ["DEMO_MODE"] = "true"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["DEMO_LATENCY_MS"] = "0"

# Add shared modules to path
_SHARED_DIR = str(Path(__file__).resolve().parents[3] / "shared")
if _SHARED_DIR not in sys.path:
    sys.path.insert(0, _SHARED_DIR)

from app.models.database import (
    Base,
    get_engine,
    get_session_factory,
    Merchant,
    RiskTolerance,
    Transaction,
    TransactionType,
)
from app.ml.predictor import CashFlowPredictor
from app.services.decision_gate import DecisionGate
from app.services.settlement_simulator import SettlementSimulator
from app.services.yield_position import YieldPositionManager

from finxact_client import FinxactClient


@pytest_asyncio.fixture
async def db_session():
    """Provide a fresh in-memory database session for each test."""
    # Reset engine for each test
    import app.models.database as db_mod
    db_mod._engine = None
    db_mod._session_factory = None

    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    factory = get_session_factory()
    async with factory() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def demo_merchant(db_session):
    """Create and return the demo merchant."""
    merchant = Merchant(
        id="DEMO_MERCHANT_001",
        name="Mario's Pizzeria",
        clover_id="CLV_MARIO_001",
        sweep_config={
            "enabled": True,
            "min_sweep_amount": "500.00",
            "safety_buffer_pct": "0.20",
            "hard_floor": None,
            "max_sweep_pct": None,
        },
        risk_tolerance=RiskTolerance.MODERATE,
        override_active=False,
        tenure_months=6,
        finxact_account_id="ACCT_MARIO_001",
    )
    db_session.add(merchant)
    await db_session.flush()
    return merchant


@pytest.fixture
def simulator():
    """Provide a settlement simulator with fixed seed."""
    return SettlementSimulator(seed=42)


@pytest.fixture
def sample_transactions(simulator):
    """Generate 90 days of sample transactions."""
    return simulator.generate_history("DEMO_MERCHANT_001", days=90)


@pytest.fixture
def trained_predictor(sample_transactions):
    """Provide a trained predictor."""
    predictor = CashFlowPredictor()
    predictor.train(sample_transactions)
    return predictor


@pytest.fixture
def finxact_client():
    """Provide a demo-mode Finxact client."""
    return FinxactClient(
        base_url="https://sandbox.finxact.com/api/v1",
        api_key="test-key",
        demo_mode=True,
    )


@pytest.fixture
def yield_manager():
    """Provide a yield position manager."""
    return YieldPositionManager(apy=Decimal("0.042"))


@pytest.fixture
def decision_gate(yield_manager):
    """Provide a decision gate with the yield manager."""
    return DecisionGate(yield_manager=yield_manager)
