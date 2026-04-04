"""Cross-Border Instant Settlement Prototype.

Demonstrates how CommerceHub detects cross-border transactions
and settles them via FIUSD/INDX at 90% lower cost in seconds
instead of days.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="Cross-Border Instant Settlement",
        description=(
            "Prototype 4: Demonstrates how CommerceHub detects cross-border "
            "transactions and settles them via FIUSD/INDX at ~90% lower cost "
            "and in seconds instead of days."
        ),
        version="0.4.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router, prefix="/api")

    return app


app = create_app()
