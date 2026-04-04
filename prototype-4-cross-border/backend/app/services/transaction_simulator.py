"""Transaction simulator for demo data generation.

Generates realistic mixed domestic and cross-border transaction
histories for demonstration purposes.
"""

from __future__ import annotations

import random
import uuid
from datetime import datetime, timedelta, timezone
from decimal import ROUND_HALF_UP, Decimal
from typing import Optional


class TransactionSimulator:
    """Generates simulated cross-border transactions for demo."""

    DEMO_BUYERS: list[dict] = [
        {
            "id": "BUYER_MX_001",
            "name": "Carlos Rodriguez",
            "country": "MX",
            "currency": "MXN",
        },
        {
            "id": "BUYER_MX_002",
            "name": "Maria Garcia",
            "country": "MX",
            "currency": "MXN",
        },
        {
            "id": "BUYER_EU_001",
            "name": "Hans Mueller",
            "country": "DE",
            "currency": "EUR",
        },
        {
            "id": "BUYER_EU_002",
            "name": "Sophie Dubois",
            "country": "FR",
            "currency": "EUR",
        },
        {
            "id": "BUYER_UK_001",
            "name": "James Wilson",
            "country": "GB",
            "currency": "GBP",
        },
        {
            "id": "BUYER_UK_002",
            "name": "Emma Thompson",
            "country": "GB",
            "currency": "GBP",
        },
        {
            "id": "BUYER_US_001",
            "name": "John Smith",
            "country": "US",
            "currency": "USD",
        },
        {
            "id": "BUYER_US_002",
            "name": "Sarah Johnson",
            "country": "US",
            "currency": "USD",
        },
    ]

    # Amount ranges in local currency for each buyer currency
    AMOUNT_RANGES: dict[str, tuple[float, float]] = {
        "MXN": (900.0, 35000.0),     # ~$50-$2000 USD
        "EUR": (45.0, 1850.0),       # ~$50-$2000 USD
        "GBP": (40.0, 1580.0),       # ~$50-$2000 USD
        "USD": (50.0, 2000.0),       # $50-$2000 USD
    }

    # FX rates for converting local amounts to USD (for historical records)
    FX_TO_USD: dict[str, Decimal] = {
        "MXN": Decimal("0.0571"),
        "EUR": Decimal("1.0850"),
        "GBP": Decimal("1.2650"),
        "USD": Decimal("1.0000"),
    }

    def __init__(self, merchant_currency: str = "USD") -> None:
        self.merchant_currency = merchant_currency

    def get_demo_buyers(self) -> list[dict]:
        """Return the list of demo buyers for seeding."""
        return self.DEMO_BUYERS

    def generate_history(
        self,
        merchant_id: str,
        days: int = 30,
        transactions_per_day: tuple[int, int] = (8, 20),
    ) -> list[dict]:
        """Generate mixed domestic + cross-border transaction history.

        Distribution: ~70% domestic, ~30% cross-border
        Cross-border breakdown: ~10% MXN, ~12% EUR, ~8% GBP

        Args:
            merchant_id: The merchant identifier.
            days: Number of days of history to generate.
            transactions_per_day: Min/max transactions per day.

        Returns:
            List of transaction dictionaries ready for database insertion.
        """
        transactions = []
        now = datetime.now(timezone.utc)

        # Buyer selection weights: 70% domestic, 30% cross-border
        # Cross-border: MXN 10%, EUR 12%, GBP 8%
        buyer_weights = {
            "BUYER_US_001": 35,
            "BUYER_US_002": 35,
            "BUYER_MX_001": 5,
            "BUYER_MX_002": 5,
            "BUYER_EU_001": 6,
            "BUYER_EU_002": 6,
            "BUYER_UK_001": 4,
            "BUYER_UK_002": 4,
        }
        buyer_ids = list(buyer_weights.keys())
        weights = list(buyer_weights.values())

        buyer_lookup = {b["id"]: b for b in self.DEMO_BUYERS}

        for day_offset in range(days, 0, -1):
            base_time = now - timedelta(days=day_offset)
            num_txns = random.randint(*transactions_per_day)

            for i in range(num_txns):
                txn_time = base_time + timedelta(
                    hours=random.randint(8, 22),
                    minutes=random.randint(0, 59),
                    seconds=random.randint(0, 59),
                )

                buyer_id = random.choices(buyer_ids, weights=weights, k=1)[0]
                buyer = buyer_lookup[buyer_id]
                buyer_currency = buyer["currency"]

                # Generate amount in local currency
                min_amt, max_amt = self.AMOUNT_RANGES[buyer_currency]
                amount_local = Decimal(str(round(random.uniform(min_amt, max_amt), 2)))

                # Convert to USD
                fx_rate = self.FX_TO_USD[buyer_currency]
                amount_usd = (amount_local * fx_rate).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )

                is_cross_border = buyer_currency != self.merchant_currency
                corridor = (
                    f"{buyer_currency}->{self.merchant_currency}"
                    if is_cross_border
                    else None
                )

                txn_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"

                txn = {
                    "id": txn_id,
                    "merchant_id": merchant_id,
                    "buyer_id": buyer_id,
                    "amount_local": amount_local,
                    "amount_usd": amount_usd,
                    "buyer_currency": buyer_currency,
                    "merchant_currency": self.merchant_currency,
                    "is_cross_border": is_cross_border,
                    "routing": "STABLECOIN" if is_cross_border else "CARD",
                    "status": "COMPLETED",
                    "compliance_status": "PASSED",
                    "created_at": txn_time,
                    "corridor": corridor,
                }
                transactions.append(txn)

        # Sort by creation time
        transactions.sort(key=lambda t: t["created_at"])
        return transactions

    def generate_settlement(
        self,
        txn: dict,
        fx_engine_rates: Optional[dict[str, Decimal]] = None,
    ) -> Optional[dict]:
        """Generate a settlement record for a transaction.

        For cross-border transactions, creates a FIUSD/INDX settlement
        with realistic timing and fees. For domestic, creates a card
        settlement.

        Args:
            txn: Transaction dictionary.
            fx_engine_rates: Optional dict of FX rates to use.

        Returns:
            Settlement dictionary or None if not applicable.
        """
        from app.detection.detector import CrossBorderDetector

        detector = CrossBorderDetector()
        amount_usd = txn["amount_usd"]
        settlement_id = f"STL-{uuid.uuid4().hex[:12].upper()}"

        if txn["is_cross_border"]:
            corridor = txn["corridor"]
            fees = detector.CARD_CROSS_BORDER_FEES.get(
                corridor, detector.DEFAULT_CROSS_BORDER_FEES
            )

            # Stablecoin fee: 0.5% total
            stablecoin_fee_pct = Decimal("0.005")
            fee_amount = (amount_usd * stablecoin_fee_pct).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

            return {
                "id": settlement_id,
                "transaction_id": txn["id"],
                "method": "FIUSD_INDX",
                "amount_usd": amount_usd,
                "fee_amount": fee_amount,
                "fee_pct": stablecoin_fee_pct,
                "settlement_time_seconds": random.randint(3, 12),
                "indx_settlement_id": f"INDX-{uuid.uuid4().hex[:8].upper()}",
                "status": "COMPLETED",
                "completed_at": txn["created_at"] + timedelta(seconds=random.randint(3, 12)),
            }
        else:
            # Domestic card settlement
            fee_pct = Decimal("0.029")  # Standard 2.9%
            fee_amount = (amount_usd * fee_pct).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            return {
                "id": settlement_id,
                "transaction_id": txn["id"],
                "method": "CARD",
                "amount_usd": amount_usd,
                "fee_amount": fee_amount,
                "fee_pct": fee_pct,
                "settlement_time_seconds": 86400 * 2,  # 2 days in seconds
                "indx_settlement_id": None,
                "status": "COMPLETED",
                "completed_at": txn["created_at"] + timedelta(days=2),
            }

    def generate_route_comparison(self, txn: dict) -> Optional[dict]:
        """Generate a route comparison for a cross-border transaction.

        Shows the side-by-side cost comparison between card and stablecoin
        routing for investor demonstration.

        Args:
            txn: Transaction dictionary (must be cross-border).

        Returns:
            Route comparison dictionary or None if domestic.
        """
        if not txn["is_cross_border"]:
            return None

        from app.detection.detector import CrossBorderDetector

        detector = CrossBorderDetector()
        corridor = txn["corridor"]
        amount_usd = txn["amount_usd"]

        fees = detector.CARD_CROSS_BORDER_FEES.get(
            corridor, detector.DEFAULT_CROSS_BORDER_FEES
        )

        card_fee_pct = fees["processing_pct"] + fees["fx_markup_pct"]
        card_fee = (amount_usd * card_fee_pct).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        card_settlement_days = fees["settlement_days"]

        stablecoin_fee_pct = Decimal("0.005")
        stablecoin_fee = (amount_usd * stablecoin_fee_pct).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        stablecoin_settlement_seconds = random.randint(3, 12)

        savings_amount = card_fee - stablecoin_fee
        savings_pct = (
            ((card_fee_pct - stablecoin_fee_pct) / card_fee_pct * Decimal("100"))
            .quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        )

        return {
            "id": f"CMP-{uuid.uuid4().hex[:12].upper()}",
            "transaction_id": txn["id"],
            "card_fee": card_fee,
            "card_fee_pct": card_fee_pct,
            "card_settlement_days": card_settlement_days,
            "stablecoin_fee": stablecoin_fee,
            "stablecoin_fee_pct": stablecoin_fee_pct,
            "stablecoin_settlement_seconds": stablecoin_settlement_seconds,
            "savings_amount": savings_amount,
            "savings_pct": savings_pct,
        }

    def generate_fx_conversion(self, txn: dict) -> Optional[dict]:
        """Generate an FX conversion record for a cross-border transaction.

        Args:
            txn: Transaction dictionary (must be cross-border).

        Returns:
            FX conversion dictionary or None if domestic.
        """
        if not txn["is_cross_border"]:
            return None

        buyer_currency = txn["buyer_currency"]
        fx_rate = self.FX_TO_USD.get(buyer_currency, Decimal("1.0"))

        return {
            "id": f"FXC-{uuid.uuid4().hex[:12].upper()}",
            "transaction_id": txn["id"],
            "from_currency": buyer_currency,
            "to_currency": "USD",
            "rate": fx_rate,
            "rate_locked_at": txn["created_at"],
            "rate_expiry": txn["created_at"] + timedelta(seconds=30),
            "fiusd_amount": txn["amount_usd"],
            "status": "COMPLETED",
            "completed_at": txn["created_at"] + timedelta(seconds=random.randint(1, 3)),
        }
