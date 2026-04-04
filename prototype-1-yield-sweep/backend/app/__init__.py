"""
Main FastAPI application setup for the Yield Sweep prototype.

Configures CORS, lifespan management, database initialization,
and dependency injection for all services.
"""

from __future__ import annotations

import logging
import os
import sys
from contextlib import asynccontextmanager
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add shared modules to path
_SHARED_DIR = str(Path(__file__).resolve().parents[3] / "shared")
if _SHARED_DIR not in sys.path:
    sys.path.insert(0, _SHARED_DIR)

from app.ml.predictor import CashFlowPredictor
from app.services.decision_gate import DecisionGate

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Application state container
# ---------------------------------------------------------------------------

@dataclass
class AppState:
    """Holds all service instances for dependency injection."""

    finxact_client: Any = None
    yield_manager: Any = None
    predictor: CashFlowPredictor | None = None
    decision_gate: DecisionGate | None = None
    sweep_service: Any = None
    demo_mode: bool = True


_app_state = AppState()


def get_app_state() -> AppState:
    """Access the global app state from routes."""
    return _app_state


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup, clean up on shutdown."""
    global _app_state

    logger.info("Starting Yield Sweep prototype...")

    demo_mode = os.getenv("DEMO_MODE", "true").lower() == "true"
    _app_state.demo_mode = demo_mode

    # Initialize database
    from app.models.database import init_db
    await init_db()
    logger.info("Database initialized")

    # Initialize Finxact client
    from finxact_client import FinxactClient
    _app_state.finxact_client = FinxactClient(
        base_url=os.getenv(
            "FINXACT_BASE_URL", "https://sandbox.finxact.com/api/v1"
        ),
        api_key=os.getenv("FINXACT_API_KEY", "demo-key"),
        demo_mode=demo_mode,
    )
    logger.info("Finxact client initialized (demo_mode=%s)", demo_mode)

    # Initialize yield position manager
    from app.services.yield_position import YieldPositionManager
    apy = Decimal(os.getenv("YIELD_APY", "0.042"))
    _app_state.yield_manager = YieldPositionManager(apy=apy)
    logger.info("Yield position manager initialized (APY=%s)", apy)

    # Initialize ML predictor
    _app_state.predictor = CashFlowPredictor()
    logger.info("Cash flow predictor initialized (untrained)")

    # Initialize decision gate
    _app_state.decision_gate = DecisionGate(
        yield_manager=_app_state.yield_manager,
    )

    # Initialize sweep service
    from app.services.sweep_service import SweepService
    _app_state.sweep_service = SweepService(
        finxact_client=_app_state.finxact_client,
        yield_manager=_app_state.yield_manager,
        predictor=_app_state.predictor,
        decision_gate=_app_state.decision_gate,
        demo_mode=demo_mode,
    )
    logger.info("Sweep service initialized")

    yield

    # Shutdown
    logger.info("Shutting down Yield Sweep prototype...")
    if hasattr(_app_state.finxact_client, "close"):
        await _app_state.finxact_client.close()
    logger.info("Shutdown complete")


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="Yield Sweep Prototype",
        description=(
            "AI treasury agent that auto-sweeps idle merchant settlement "
            "balances into yield-bearing FIUSD positions on Finxact."
        ),
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routers
    from app.api.routes import router
    from app.api.demo import demo_router

    app.include_router(router)
    app.include_router(demo_router)

    return app
