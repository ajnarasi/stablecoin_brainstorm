"""
Entry point for the Yield Sweep prototype.

1. Creates database tables
2. Seeds demo merchant data (6 months of transactions)
3. Trains the ML model on seeded data
4. Starts FastAPI server on port 8001
"""

import asyncio
import logging
import os
import sys
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path

# Add shared modules to path
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
_SHARED_DIR = str(_PROJECT_ROOT / "shared")
if _SHARED_DIR not in sys.path:
    sys.path.insert(0, _SHARED_DIR)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("yield-sweep")


async def seed_and_train():
    """Seed demo data and train the ML model before starting the server."""
    from app.models.database import (
        get_session_factory,
        init_db,
        Merchant,
        RiskTolerance,
        Transaction,
        TransactionType,
    )
    from app import get_app_state
    from app.services.settlement_simulator import SettlementSimulator

    # Initialize DB
    await init_db()
    logger.info("Database tables created")

    factory = get_session_factory()
    async with factory() as session:
        # Check if demo merchant already exists with data
        from sqlalchemy import select, func
        result = await session.execute(
            select(func.count(Transaction.id)).where(
                Transaction.merchant_id == "DEMO_MERCHANT_001"
            )
        )
        txn_count = result.scalar()

        if txn_count and txn_count > 100:
            logger.info(
                "Demo data already exists (%d transactions). Skipping seed.",
                txn_count,
            )
            # Still need to train the model
            result = await session.execute(
                select(Transaction)
                .where(Transaction.merchant_id == "DEMO_MERCHANT_001")
                .order_by(Transaction.timestamp.asc())
            )
            txns = result.scalars().all()
            txn_dicts = [
                {
                    "amount": float(t.amount),
                    "type": t.type.value,
                    "timestamp": t.timestamp,
                }
                for t in txns
            ]

            state = get_app_state()
            if state.predictor and txn_dicts:
                metrics = state.predictor.train(txn_dicts)
                logger.info("Model re-trained on existing data: %s", metrics)

            await session.commit()
            return

        # Create demo merchant
        merchant_id = "DEMO_MERCHANT_001"

        result = await session.execute(
            select(Merchant).where(Merchant.id == merchant_id)
        )
        merchant = result.scalar_one_or_none()

        if merchant is None:
            merchant = Merchant(
                id=merchant_id,
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
            session.add(merchant)
            logger.info("Created demo merchant: %s", merchant.name)

        # Generate transaction history
        simulator = SettlementSimulator(seed=42)
        days = int(os.getenv("DEMO_SEED_DAYS", "180"))
        transactions = simulator.generate_history(merchant_id, days=days)

        for txn in transactions:
            db_txn = Transaction(
                merchant_id=txn["merchant_id"],
                amount=Decimal(str(txn["amount"])),
                type=TransactionType(txn["type"]),
                description=txn.get("description"),
                timestamp=txn["timestamp"],
            )
            session.add(db_txn)

        await session.flush()
        logger.info("Seeded %d transactions over %d days", len(transactions), days)

        # Set Finxact demo balance based on generated data
        balance_history = simulator.compute_running_balance(
            transactions, starting_balance=25000.0
        )
        if balance_history:
            final_balance = Decimal(str(balance_history[-1]["balance"]))
            state = get_app_state()
            if state.finxact_client:
                from finxact_client.models import Balance
                from finxact_client.client import _DEMO_BALANCES
                _DEMO_BALANCES["ACCT_MARIO_001"] = Balance(
                    account_id="ACCT_MARIO_001",
                    total=final_balance + Decimal("300000.00"),
                    available=final_balance,
                    yield_allocated=Decimal("300000.00"),
                    currency="USD",
                )
                logger.info(
                    "Set demo balance: available=%s, yield=%s",
                    final_balance, Decimal("300000.00"),
                )

        # Train ML model
        state = get_app_state()
        if state.predictor:
            metrics = state.predictor.train(transactions)
            logger.info("ML model trained: %s", metrics)

        # Simulate historical yield accrual (last 90 days)
        if state.yield_manager and state.sweep_service:
            yield_mgr = state.yield_manager
            sweep_svc = state.sweep_service

            initial_sweep = Decimal("15000.00")
            await yield_mgr.mint(merchant_id, initial_sweep)
            logger.info(
                "Initial FIUSD position: %s", initial_sweep
            )

            sweep_start = date.today() - timedelta(days=90)
            current_date = sweep_start
            while current_date <= date.today():
                await sweep_svc.accrue_yield_for_date(
                    merchant_id, current_date, session
                )
                current_date += timedelta(days=1)

            position = await yield_mgr.get_position(merchant_id)
            logger.info(
                "Yield accrual complete: principal=%s, accrued=%s, total=%s",
                position.principal, position.accrued_yield, position.total_value,
            )

        await session.commit()
        logger.info("Demo seed complete")


def main():
    """Start the application."""
    import uvicorn
    from app import create_app

    app = create_app()

    # Register startup event for seeding
    @app.on_event("startup")
    async def on_startup():
        await seed_and_train()

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8001"))

    logger.info("Starting server on %s:%d", host, port)
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info",
        reload=os.getenv("RELOAD", "false").lower() == "true",
    )


if __name__ == "__main__":
    main()
