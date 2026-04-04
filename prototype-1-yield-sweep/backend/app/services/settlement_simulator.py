"""
Settlement simulator for generating realistic merchant transaction data.

Produces 6 months of transaction history for demo merchants, including
card settlements, payroll, rent, supplier payments, and other outflows
with realistic patterns (weekend spikes, seasonal variation, etc.).
"""

from __future__ import annotations

import logging
import random
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Sequence

from app.models.database import TransactionType

logger = logging.getLogger(__name__)

# Reproducible randomness for consistent demos
_RNG = random.Random(42)


# ---------------------------------------------------------------------------
# Configuration for "Mario's Pizzeria" (mid-market restaurant)
# ---------------------------------------------------------------------------

# Average daily card settlement revenue by day of week (Mon=0 .. Sun=6)
_WEEKDAY_REVENUE = {
    0: Decimal("2800"),   # Monday  - slower
    1: Decimal("3100"),   # Tuesday
    2: Decimal("3400"),   # Wednesday
    3: Decimal("3800"),   # Thursday
    4: Decimal("5200"),   # Friday  - busy
    5: Decimal("6100"),   # Saturday - peak
    6: Decimal("4500"),   # Sunday  - brunch + dinner
}

# Monthly multipliers (1-indexed) for seasonal variation
_MONTHLY_MULTIPLIER = {
    1: Decimal("0.85"),   # January - post-holiday slump
    2: Decimal("0.90"),   # February - Valentine's bump
    3: Decimal("0.95"),   # March
    4: Decimal("1.00"),   # April
    5: Decimal("1.05"),   # May
    6: Decimal("1.10"),   # June - summer
    7: Decimal("1.15"),   # July - peak summer
    8: Decimal("1.10"),   # August
    9: Decimal("1.00"),   # September
    10: Decimal("1.05"),  # October
    11: Decimal("1.15"),  # November - Thanksgiving
    12: Decimal("1.25"),  # December - holidays
}

# Recurring outflows
_PAYROLL_AMOUNT = Decimal("8500.00")     # Bi-weekly payroll
_RENT_AMOUNT = Decimal("4200.00")         # Monthly rent (1st of month)
_SUPPLIER_WEEKLY = Decimal("3200.00")     # Weekly supplier order (Tuesdays)
_TAX_QUARTERLY = Decimal("6800.00")       # Quarterly tax estimate


class SettlementSimulator:
    """
    Generates simulated CommerceHub settlement events for demo.

    Produces realistic transaction patterns for a mid-market restaurant:
    - Card settlements daily with weekend peaks
    - Bi-weekly payroll
    - Monthly rent
    - Weekly supplier payments
    - Quarterly tax estimates
    """

    def __init__(self, seed: int = 42):
        self._rng = random.Random(seed)

    def generate_history(
        self, merchant_id: str, days: int = 180
    ) -> list[dict]:
        """
        Generate N days of realistic restaurant transaction data.

        Returns list of dicts compatible with the predictor and DB insertion:
            {merchant_id, amount, type, description, timestamp}
        """
        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        all_transactions: list[dict] = []
        current = start_date

        while current <= end_date:
            day_txns = self.generate_day(merchant_id, current)
            all_transactions.extend(day_txns)
            current += timedelta(days=1)

        logger.info(
            "Generated %d transactions for merchant %s over %d days",
            len(all_transactions), merchant_id, days,
        )
        return all_transactions

    def generate_day(
        self, merchant_id: str, for_date: date
    ) -> list[dict]:
        """Generate one day of transactions for a merchant."""
        txns: list[dict] = []
        dow = for_date.weekday()
        month = for_date.month
        dom = for_date.day

        # --- Card Settlement (inflow) ---
        base_revenue = _WEEKDAY_REVENUE[dow]
        seasonal = _MONTHLY_MULTIPLIER[month]
        # Add noise: +/- 15%
        noise = Decimal(str(self._rng.uniform(0.85, 1.15)))
        daily_revenue = (base_revenue * seasonal * noise).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        # Settlement arrives in 1-3 batches throughout the day
        num_batches = self._rng.choice([1, 2, 2, 3])
        batch_amounts = self._split_amount(daily_revenue, num_batches)

        for i, batch_amount in enumerate(batch_amounts):
            hour = self._rng.choice([10, 14, 18, 20]) + i
            txns.append({
                "merchant_id": merchant_id,
                "amount": float(batch_amount),
                "type": TransactionType.SETTLEMENT.value,
                "description": f"CommerceHub settlement batch {i + 1}",
                "timestamp": datetime(
                    for_date.year, for_date.month, for_date.day,
                    min(hour, 23), self._rng.randint(0, 59),
                    tzinfo=timezone.utc,
                ),
            })

        # --- Payroll (bi-weekly, every other Friday) ---
        if dow == 4 and self._is_payroll_friday(for_date):
            payroll_noise = Decimal(str(self._rng.uniform(0.98, 1.02)))
            amount = (_PAYROLL_AMOUNT * payroll_noise).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            txns.append({
                "merchant_id": merchant_id,
                "amount": float(amount),
                "type": TransactionType.PAYROLL.value,
                "description": "Bi-weekly payroll disbursement",
                "timestamp": datetime(
                    for_date.year, for_date.month, for_date.day,
                    8, 0, tzinfo=timezone.utc,
                ),
            })

        # --- Rent (1st of month) ---
        if dom == 1:
            txns.append({
                "merchant_id": merchant_id,
                "amount": float(_RENT_AMOUNT),
                "type": TransactionType.RENT.value,
                "description": "Monthly lease payment",
                "timestamp": datetime(
                    for_date.year, for_date.month, for_date.day,
                    9, 0, tzinfo=timezone.utc,
                ),
            })

        # --- Supplier payment (Tuesdays) ---
        if dow == 1:  # Tuesday
            supplier_noise = Decimal(str(self._rng.uniform(0.90, 1.10)))
            amount = (_SUPPLIER_WEEKLY * supplier_noise).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            txns.append({
                "merchant_id": merchant_id,
                "amount": float(amount),
                "type": TransactionType.SUPPLIER.value,
                "description": "Weekly food supplier order",
                "timestamp": datetime(
                    for_date.year, for_date.month, for_date.day,
                    7, 30, tzinfo=timezone.utc,
                ),
            })

        # --- Quarterly tax (15th of Jan, Apr, Jul, Oct) ---
        if dom == 15 and month in (1, 4, 7, 10):
            txns.append({
                "merchant_id": merchant_id,
                "amount": float(_TAX_QUARTERLY),
                "type": TransactionType.TAX.value,
                "description": "Quarterly estimated tax payment",
                "timestamp": datetime(
                    for_date.year, for_date.month, for_date.day,
                    10, 0, tzinfo=timezone.utc,
                ),
            })

        # --- Random small outflows (supplies, misc) ---
        if self._rng.random() < 0.3:  # 30% chance on any day
            misc_amount = Decimal(
                str(self._rng.uniform(50, 500))
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            txns.append({
                "merchant_id": merchant_id,
                "amount": float(misc_amount),
                "type": TransactionType.OTHER_OUTFLOW.value,
                "description": self._rng.choice([
                    "Kitchen equipment repair",
                    "Cleaning supplies",
                    "POS system subscription",
                    "Insurance premium",
                    "Marketing - local ads",
                    "Utility payment",
                ]),
                "timestamp": datetime(
                    for_date.year, for_date.month, for_date.day,
                    self._rng.randint(9, 17), self._rng.randint(0, 59),
                    tzinfo=timezone.utc,
                ),
            })

        return txns

    def _split_amount(self, total: Decimal, n: int) -> list[Decimal]:
        """Split a total amount into n roughly-equal parts."""
        if n == 1:
            return [total]
        parts: list[Decimal] = []
        remaining = total
        for i in range(n - 1):
            fraction = Decimal(str(self._rng.uniform(0.2, 0.5)))
            part = (remaining * fraction).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            parts.append(part)
            remaining -= part
        parts.append(remaining)
        return parts

    def _is_payroll_friday(self, d: date) -> bool:
        """Determine if this Friday is a payroll Friday (every other)."""
        # Use a fixed reference: first payroll Friday after epoch
        reference = date(2024, 1, 5)  # A known Friday
        days_diff = (d - reference).days
        weeks_diff = days_diff // 7
        return weeks_diff % 2 == 0

    def compute_running_balance(
        self, transactions: list[dict], starting_balance: float = 25000.0
    ) -> list[dict]:
        """
        Compute a daily running balance from transaction history.
        Returns list of {date, balance, inflows, outflows}.
        """
        from collections import defaultdict

        daily: dict[date, dict] = defaultdict(
            lambda: {"inflows": 0.0, "outflows": 0.0}
        )

        inflow_types = {TransactionType.SETTLEMENT.value, "SETTLEMENT"}

        for txn in transactions:
            ts = txn["timestamp"]
            d = ts.date() if isinstance(ts, datetime) else ts
            amount = float(txn["amount"])
            if txn["type"] in inflow_types:
                daily[d]["inflows"] += amount
            else:
                daily[d]["outflows"] += amount

        sorted_dates = sorted(daily.keys())
        balance = starting_balance
        result: list[dict] = []

        for d in sorted_dates:
            net = daily[d]["inflows"] - daily[d]["outflows"]
            balance += net
            result.append({
                "date": d.isoformat(),
                "balance": round(balance, 2),
                "inflows": round(daily[d]["inflows"], 2),
                "outflows": round(daily[d]["outflows"], 2),
            })

        return result
