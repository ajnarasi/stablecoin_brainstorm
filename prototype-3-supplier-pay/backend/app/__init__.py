"""Prototype 3: Instant Supplier Pay -- FastAPI application.

AI procurement agent that monitors restaurant ingredient usage,
auto-generates purchase orders, and pays suppliers instantly in FIUSD.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as main_router
from app.api.supplier_mock import router as supplier_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-30s | %(levelname)-7s | %(message)s",
)

app = FastAPI(
    title="Instant Supplier Pay",
    description=(
        "AI procurement agent for restaurants. Monitors ingredient depletion, "
        "auto-generates purchase orders, and pays suppliers instantly in FIUSD."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(main_router)
app.include_router(supplier_router)
