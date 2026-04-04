"""Entry point for Prototype 3: Instant Supplier Pay.

1. Creates database tables
2. Seeds demo merchant "Mario's Pizzeria" with 30 days of sales, BOM, suppliers
3. Trains depletion prediction model
4. Starts FastAPI on port 8003
"""

from __future__ import annotations

import asyncio
import logging
import os
import sys

import httpx
import uvicorn

logger = logging.getLogger(__name__)


async def bootstrap() -> None:
    """Create tables and seed demo data on startup."""
    from app.models.database import create_tables

    logger.info("Creating database tables...")
    await create_tables()
    logger.info("Tables created.")

    # Seed demo data via the API endpoint (server must be running)
    # We do this in a background task after startup instead.


async def seed_after_startup() -> None:
    """Hit the seed endpoint after the server is up."""
    await asyncio.sleep(1.5)  # wait for uvicorn to bind
    try:
        async with httpx.AsyncClient() as client:
            port = int(os.environ.get("PORT", "8003"))
            resp = await client.post(f"http://localhost:{port}/api/demo/seed", timeout=30.0)
            if resp.status_code == 200:
                data = resp.json()
                logger.info("Demo seeded: %s", data.get("message", "OK"))
            else:
                logger.warning("Seed returned %d: %s", resp.status_code, resp.text)
    except Exception as exc:
        logger.error("Failed to auto-seed: %s", exc)


def main() -> None:
    """Run the application."""
    # Create tables synchronously before starting
    asyncio.run(bootstrap())

    # Start uvicorn with a background seed task
    config = uvicorn.Config(
        "app:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "8003")),
        reload=False,
        log_level="info",
    )
    server = uvicorn.Server(config)

    async def run_with_seed() -> None:
        seed_task = asyncio.create_task(seed_after_startup())
        await server.serve()
        seed_task.cancel()

    asyncio.run(run_with_seed())


if __name__ == "__main__":
    main()
