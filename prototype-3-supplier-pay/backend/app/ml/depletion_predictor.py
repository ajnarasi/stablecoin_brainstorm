"""Ingredient depletion prediction using gradient boosting.

Trains a per-ingredient model on historical daily usage derived from
sales data + bill of materials.  Predicts when each ingredient will
hit its reorder point and generates ordering recommendations.
"""

from __future__ import annotations

import logging
import math
from datetime import datetime, timedelta
from typing import Any

import numpy as np
from sklearn.ensemble import GradientBoostingRegressor

from app.suppliers.bom import DEMO_BOM
from app.suppliers.catalog import find_supplier_for_ingredient

logger = logging.getLogger(__name__)


class IngredientDepletionPredictor:
    """Predicts when each ingredient will hit reorder point based on sales patterns."""

    def __init__(self) -> None:
        self._models: dict[str, GradientBoostingRegressor] = {}
        self._daily_usage: dict[str, list[float]] = {}  # ingredient -> [daily totals]
        self._trained = False

    # ------------------------------------------------------------------ #
    # Training
    # ------------------------------------------------------------------ #

    def train(self, sales: list[dict[str, Any]], bom: dict[str, dict[str, float]] | None = None) -> None:
        """Train depletion model from sales history + BOM.

        Args:
            sales: list of dicts with keys {menu_item_name, quantity, timestamp}.
            bom: override BOM mapping; defaults to DEMO_BOM.
        """
        if bom is None:
            bom = DEMO_BOM

        # Build daily ingredient usage from sales
        ingredient_daily: dict[str, dict[str, float]] = {}  # ing -> {date_str: total_qty}

        for sale in sales:
            item = sale["menu_item_name"]
            qty = sale["quantity"]
            ts: datetime = sale["timestamp"]
            date_key = ts.strftime("%Y-%m-%d")

            ingredients = bom.get(item, {})
            for ing_name, per_unit in ingredients.items():
                usage = per_unit * qty
                ingredient_daily.setdefault(ing_name, {})
                ingredient_daily[ing_name][date_key] = (
                    ingredient_daily[ing_name].get(date_key, 0.0) + usage
                )

        # Train a GBR for each ingredient
        for ing_name, daily_map in ingredient_daily.items():
            if not daily_map:
                continue

            sorted_dates = sorted(daily_map.keys())
            daily_values = [daily_map[d] for d in sorted_dates]
            self._daily_usage[ing_name] = daily_values

            if len(daily_values) < 5:
                # Not enough data -- store average and skip model
                continue

            # Feature engineering: day_index, day_of_week, is_weekend
            X = []
            y = []
            base_date = datetime.strptime(sorted_dates[0], "%Y-%m-%d")
            for i, date_str in enumerate(sorted_dates):
                dt = datetime.strptime(date_str, "%Y-%m-%d")
                dow = dt.weekday()
                X.append([
                    i,                      # trend index
                    dow,                    # day of week (0=Mon)
                    1 if dow >= 5 else 0,   # is_weekend
                    math.sin(2 * math.pi * dow / 7),  # cyclic dow
                    math.cos(2 * math.pi * dow / 7),
                ])
                y.append(daily_map[date_str])

            X_arr = np.array(X)
            y_arr = np.array(y)

            model = GradientBoostingRegressor(
                n_estimators=80,
                max_depth=3,
                learning_rate=0.1,
                random_state=42,
            )
            model.fit(X_arr, y_arr)
            self._models[ing_name] = model

        self._trained = True
        logger.info("Trained depletion models for %d ingredients", len(self._models))

    # ------------------------------------------------------------------ #
    # Prediction
    # ------------------------------------------------------------------ #

    def predict_daily_usage(self, ingredient_name: str, days_ahead: int = 7) -> list[float]:
        """Predict daily usage for an ingredient over the next N days."""
        if ingredient_name in self._models:
            model = self._models[ingredient_name]
            n_hist = len(self._daily_usage.get(ingredient_name, []))
            today = datetime.utcnow()
            preds = []
            for d in range(days_ahead):
                future = today + timedelta(days=d)
                dow = future.weekday()
                features = np.array([[
                    n_hist + d,
                    dow,
                    1 if dow >= 5 else 0,
                    math.sin(2 * math.pi * dow / 7),
                    math.cos(2 * math.pi * dow / 7),
                ]])
                pred = max(0.0, float(model.predict(features)[0]))
                preds.append(pred)
            return preds

        # Fallback: use historical average
        history = self._daily_usage.get(ingredient_name, [])
        if history:
            avg = sum(history) / len(history)
            return [avg] * days_ahead
        return [0.0] * days_ahead

    def predict_depletion(
        self,
        ingredient_name: str,
        current_stock: float,
        reorder_point: float,
        days_ahead: int = 14,
    ) -> dict[str, Any]:
        """Predict when stock hits reorder point.

        Returns dict with: estimated_depletion_date, daily_usage_rate, confidence, days_until_depletion.
        """
        daily_preds = self.predict_daily_usage(ingredient_name, days_ahead)
        avg_daily = sum(daily_preds) / len(daily_preds) if daily_preds else 0.0

        if avg_daily <= 0:
            return {
                "ingredient_name": ingredient_name,
                "current_stock": current_stock,
                "reorder_point": reorder_point,
                "daily_usage_rate": 0.0,
                "estimated_depletion_date": None,
                "days_until_depletion": None,
                "confidence": 0.0,
            }

        stock_above_reorder = current_stock - reorder_point
        if stock_above_reorder <= 0:
            days_left = 0.0
        else:
            # Walk through daily predictions to find depletion day
            remaining = current_stock
            days_left = None
            for i, usage in enumerate(daily_preds):
                remaining -= usage
                if remaining <= reorder_point:
                    days_left = float(i + 1)
                    break
            if days_left is None:
                # Extrapolate beyond prediction window
                remaining_after = current_stock - sum(daily_preds)
                if avg_daily > 0 and remaining_after > reorder_point:
                    extra_days = (remaining_after - reorder_point) / avg_daily
                    days_left = float(days_ahead) + extra_days
                else:
                    days_left = float(days_ahead)

        depletion_date = datetime.utcnow() + timedelta(days=days_left)

        # Confidence based on model availability and data quality
        history = self._daily_usage.get(ingredient_name, [])
        if ingredient_name in self._models and len(history) >= 14:
            confidence = 0.85
        elif ingredient_name in self._models:
            confidence = 0.70
        elif history:
            confidence = 0.50
        else:
            confidence = 0.20

        return {
            "ingredient_name": ingredient_name,
            "current_stock": current_stock,
            "reorder_point": reorder_point,
            "daily_usage_rate": round(avg_daily, 4),
            "estimated_depletion_date": depletion_date,
            "days_until_depletion": round(days_left, 1),
            "confidence": confidence,
        }

    def get_reorder_recommendations(
        self,
        ingredients: list[dict[str, Any]],
        threshold_days: float = 3.0,
    ) -> list[dict[str, Any]]:
        """Get all ingredients that need reordering within threshold_days.

        Args:
            ingredients: list of dicts with {id, name, current_stock, reorder_point, unit}.
            threshold_days: order if depletion is within this many days.

        Returns list of recommendation dicts.
        """
        recommendations: list[dict[str, Any]] = []

        for ing in ingredients:
            prediction = self.predict_depletion(
                ingredient_name=ing["name"],
                current_stock=ing["current_stock"],
                reorder_point=ing["reorder_point"],
            )

            days_left = prediction["days_until_depletion"]
            if days_left is None:
                continue

            daily_usage = prediction["daily_usage_rate"]
            if daily_usage <= 0:
                continue

            # Determine urgency
            if days_left <= 1:
                urgency = "IMMEDIATE"
            elif days_left <= threshold_days:
                urgency = "SOON"
            elif days_left <= 7:
                urgency = "PLANNED"
            else:
                continue  # no need to reorder yet

            # Find supplier for this ingredient
            supplier_match = find_supplier_for_ingredient(ing["name"])
            if supplier_match is None:
                continue

            supplier, sup_ing = supplier_match

            # Calculate recommended quantity: cover 7 days + buffer, respect MOQ
            target_stock = daily_usage * 10  # 10-day supply target
            needed = max(0, target_stock - ing["current_stock"] + ing["reorder_point"])
            order_qty = max(needed, float(sup_ing["moq"]))
            # Round up to MOQ multiples
            moq = sup_ing["moq"]
            order_qty = math.ceil(order_qty / moq) * moq

            recommendations.append({
                "ingredient_id": ing["id"],
                "ingredient_name": ing["name"],
                "current_stock": ing["current_stock"],
                "reorder_point": ing["reorder_point"],
                "daily_usage_rate": daily_usage,
                "days_until_depletion": days_left,
                "recommended_quantity": float(order_qty),
                "supplier_id": supplier["id"],
                "supplier_name": supplier["name"],
                "unit_price": sup_ing["price_per_unit"],
                "total_cost": round(order_qty * sup_ing["price_per_unit"], 2),
                "lead_time_days": sup_ing["lead_time"],
                "urgency": urgency,
            })

        # Sort by urgency (IMMEDIATE first)
        urgency_order = {"IMMEDIATE": 0, "SOON": 1, "PLANNED": 2}
        recommendations.sort(key=lambda r: urgency_order.get(r["urgency"], 3))

        return recommendations
