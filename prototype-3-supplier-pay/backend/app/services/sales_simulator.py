"""Generate realistic restaurant sales data for the demo.

Simulates 30 days of sales for Mario's Pizzeria with realistic
time-of-day and day-of-week patterns targeting ~$50K/month revenue.
"""

from __future__ import annotations

import random
from datetime import datetime, timedelta
from typing import Any

from app.suppliers.bom import DEMO_BOM, MENU_PRICES, ORDER_WEIGHTS


class SalesSimulator:
    """Generates realistic restaurant sales data for demo."""

    def __init__(self, seed: int = 42) -> None:
        self._rng = random.Random(seed)

    def generate_history(
        self,
        merchant_id: str,
        days: int = 30,
        end_date: datetime | None = None,
    ) -> list[dict[str, Any]]:
        """Generate sales history with realistic restaurant patterns.

        Target: ~$50K/month (~$1,667/day average).
        With avg ticket ~$15, that is ~110 items/day.
        """
        if end_date is None:
            end_date = datetime.utcnow()

        start_date = end_date - timedelta(days=days)

        menu_items = list(ORDER_WEIGHTS.keys())
        weights = [ORDER_WEIGHTS[item] for item in menu_items]

        sales: list[dict[str, Any]] = []

        for day_offset in range(days):
            current_date = start_date + timedelta(days=day_offset)
            dow = current_date.weekday()
            is_weekend = dow >= 5

            # Base items per day: ~110 weekday, ~143 weekend
            base_items = 110
            if is_weekend:
                base_items = int(base_items * 1.3)

            # Add some randomness (+/- 15%)
            daily_items = int(base_items * (0.85 + self._rng.random() * 0.30))

            # Distribute across time slots
            slots = self._generate_time_slots(daily_items, current_date, is_weekend)

            for timestamp, count in slots:
                # Pick menu items according to weights
                chosen_items = self._rng.choices(menu_items, weights=weights, k=count)
                for item_name in chosen_items:
                    sales.append({
                        "merchant_id": merchant_id,
                        "menu_item_name": item_name,
                        "quantity": 1,
                        "timestamp": timestamp,
                        "price": MENU_PRICES.get(item_name, 12.00),
                    })

        return sales

    def _generate_time_slots(
        self,
        total_items: int,
        date: datetime,
        is_weekend: bool,
    ) -> list[tuple[datetime, int]]:
        """Distribute orders across realistic time slots.

        Lunch rush (11am-2pm):  40% of daily sales
        Dinner rush (5pm-9pm):  45% of daily sales
        Off-peak:               15% of daily sales
        """
        slots: list[tuple[datetime, int]] = []

        # Lunch rush: 40%
        lunch_items = int(total_items * 0.40)
        lunch_slots = self._distribute_to_hours(date, 11, 14, lunch_items)
        slots.extend(lunch_slots)

        # Dinner rush: 45%
        dinner_items = int(total_items * 0.45)
        dinner_slots = self._distribute_to_hours(date, 17, 21, dinner_items)
        slots.extend(dinner_slots)

        # Off-peak: remaining
        offpeak_items = total_items - lunch_items - dinner_items
        # Split between morning (10-11) and afternoon (2-5)
        morning = int(offpeak_items * 0.3)
        afternoon = offpeak_items - morning
        slots.extend(self._distribute_to_hours(date, 10, 11, morning))
        slots.extend(self._distribute_to_hours(date, 14, 17, afternoon))

        return slots

    def _distribute_to_hours(
        self,
        date: datetime,
        start_hour: int,
        end_hour: int,
        total_items: int,
    ) -> list[tuple[datetime, int]]:
        """Spread items across 15-minute intervals within the hour range."""
        if total_items <= 0:
            return []

        intervals = (end_hour - start_hour) * 4  # 15-min intervals
        if intervals <= 0:
            intervals = 1

        result: list[tuple[datetime, int]] = []
        remaining = total_items

        for i in range(intervals):
            if remaining <= 0:
                break
            hour = start_hour + i // 4
            minute = (i % 4) * 15 + self._rng.randint(0, 14)
            ts = date.replace(hour=hour, minute=minute, second=self._rng.randint(0, 59))

            # Cluster orders: peak in middle of rush
            mid = intervals / 2
            distance = abs(i - mid) / mid
            weight = 1.0 - 0.5 * distance
            batch = max(1, int(remaining / max(1, intervals - i) * weight * (0.8 + self._rng.random() * 0.4)))
            batch = min(batch, remaining)

            result.append((ts, batch))
            remaining -= batch

        # Distribute any leftover
        if remaining > 0 and result:
            ts = result[-1][0] + timedelta(minutes=self._rng.randint(1, 5))
            result.append((ts, remaining))

        return result

    def calculate_ingredient_usage(
        self,
        sales: list[dict[str, Any]],
        bom: dict[str, dict[str, float]] | None = None,
    ) -> dict[str, float]:
        """Calculate total ingredient consumption from sales via BOM."""
        if bom is None:
            bom = DEMO_BOM

        usage: dict[str, float] = {}
        for sale in sales:
            item_name = sale["menu_item_name"]
            qty = sale["quantity"]
            ingredients = bom.get(item_name, {})
            for ing_name, per_unit in ingredients.items():
                usage[ing_name] = usage.get(ing_name, 0.0) + per_unit * qty

        return usage

    def calculate_daily_revenue(self, sales: list[dict[str, Any]]) -> dict[str, float]:
        """Aggregate revenue by date."""
        daily: dict[str, float] = {}
        for sale in sales:
            date_key = sale["timestamp"].strftime("%Y-%m-%d")
            daily[date_key] = daily.get(date_key, 0.0) + sale["price"] * sale["quantity"]
        return daily
