"""Entry point for Cross-Border Instant Settlement prototype.

Starts the FastAPI server on port 8004, seeds demo data on startup,
and serves the API for the cross-border settlement dashboard.
"""

import asyncio
import os
import sys
from pathlib import Path

import httpx
import uvicorn

# Ensure the backend directory is on the path
sys.path.insert(0, str(Path(__file__).parent))


async def seed_on_startup() -> None:
    """Seed demo data after the server is ready."""
    # Wait briefly for the server to be fully up
    await asyncio.sleep(1.5)

    async with httpx.AsyncClient(base_url=f"http://localhost:{os.environ.get('PORT', '8004')}") as client:
        try:
            # Check health
            health = await client.get("/api/health", timeout=5.0)
            if health.status_code != 200:
                print("[SEED] Server not ready, skipping auto-seed")
                return

            # Seed demo data
            print("[SEED] Seeding 30 days of demo transaction data...")
            resp = await client.post("/api/demo/seed", timeout=30.0)
            if resp.status_code == 200:
                data = resp.json()
                print(f"[SEED] Done: {data['total_transactions']} transactions")
                print(f"[SEED]   Domestic: {data['domestic_transactions']}")
                print(f"[SEED]   Cross-border: {data['cross_border_transactions']} ({data['cross_border_pct']}%)")
                print(f"[SEED]   Buyers: {data['buyers']}")
                print(f"[SEED]   Merchant: {data['merchant']['name']}")
            else:
                print(f"[SEED] Seed failed: {resp.status_code} {resp.text}")
        except Exception as e:
            print(f"[SEED] Auto-seed error: {e}")
            print("[SEED] You can manually seed via POST /api/demo/seed")


def main() -> None:
    """Start the server and seed demo data."""
    print("=" * 60)
    print("  Cross-Border Instant Settlement - Prototype 4")
    print("  CommerceHub + FIUSD/INDX Settlement")
    print("=" * 60)
    print()
    print("  API:  http://localhost:8004")
    print("  Docs: http://localhost:8004/docs")
    print()
    print("  Endpoints:")
    print("    GET  /api/health")
    print("    GET  /api/merchants/{id}/dashboard")
    print("    GET  /api/merchants/{id}/transactions")
    print("    GET  /api/merchants/{id}/cross-border")
    print("    POST /api/merchants/{id}/payment")
    print("    GET  /api/merchants/{id}/comparisons")
    print("    GET  /api/merchants/{id}/analytics")
    print("    GET  /api/fx/rates")
    print("    POST /api/fx/lock")
    print("    POST /api/demo/seed")
    print("    POST /api/demo/live-transaction")
    print()
    print("=" * 60)

    # Schedule seed task
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    config = uvicorn.Config(
        "app:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "8004")),
        reload=False,
        log_level="info",
    )
    server = uvicorn.Server(config)

    async def run_with_seed():
        seed_task = asyncio.create_task(seed_on_startup())
        await server.serve()
        seed_task.cancel()

    loop.run_until_complete(run_with_seed())


if __name__ == "__main__":
    main()
