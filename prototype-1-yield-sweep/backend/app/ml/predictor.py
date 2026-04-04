"""
Cash flow prediction model using GradientBoostingRegressor.

Predicts merchant outflows based on historical transaction patterns,
enabling the sweep engine to determine safe amounts to allocate to yield.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Sequence

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import cross_val_score

logger = logging.getLogger(__name__)

# Holiday seasons (US): approximate date ranges with higher spending
HOLIDAY_RANGES = [
    (11, 20, 12, 31),  # Thanksgiving through New Year
    (2, 10, 2, 16),    # Valentine's week
    (5, 20, 5, 31),    # Memorial Day
    (7, 1, 7, 7),      # Independence Day
    (9, 1, 9, 7),      # Labor Day
]


@dataclass
class PredictionResult:
    """Result of an outflow prediction."""

    merchant_id: str
    predicted_outflows: Decimal
    predicted_inflows: Decimal
    predicted_net: Decimal
    confidence: Decimal
    horizon_days: int
    feature_importances: dict[str, float]


@dataclass
class SeasonalPattern:
    """Detected seasonal patterns in transaction data."""

    weekday_avg: dict[str, Decimal]   # "Monday" -> average daily amount
    monthly_avg: dict[int, Decimal]   # day_of_month -> average daily amount
    peak_day: str
    trough_day: str
    weekend_multiplier: Decimal
    holiday_multiplier: Decimal


def _is_holiday_season(month: int, day: int) -> bool:
    """Check if a date falls within a holiday spending season."""
    for start_m, start_d, end_m, end_d in HOLIDAY_RANGES:
        if start_m == end_m:
            if month == start_m and start_d <= day <= end_d:
                return True
        elif start_m < end_m:
            if (month == start_m and day >= start_d) or (
                month == end_m and day <= end_d
            ) or (start_m < month < end_m):
                return True
    return False


class CashFlowPredictor:
    """
    ML-based cash flow predictor for merchant settlement balances.

    Uses GradientBoostingRegressor trained on historical transaction data
    with engineered features for day-of-week, seasonality, and rolling averages.
    """

    FEATURE_NAMES = [
        "day_of_week",
        "day_of_month",
        "month",
        "is_weekend",
        "is_holiday_season",
        "hour_of_day",
        "rolling_7d_avg_inflow",
        "rolling_7d_avg_outflow",
        "rolling_30d_avg_inflow",
        "rolling_30d_avg_outflow",
        "prev_day_inflow",
        "prev_day_outflow",
        "week_of_year",
    ]

    def __init__(self):
        self._outflow_model: GradientBoostingRegressor | None = None
        self._inflow_model: GradientBoostingRegressor | None = None
        self._is_trained: bool = False
        self._training_score: float = 0.0

    @property
    def is_trained(self) -> bool:
        return self._is_trained

    def _build_daily_aggregates(
        self, transactions: list[dict]
    ) -> pd.DataFrame:
        """
        Aggregate transactions into daily inflow/outflow totals.
        Each transaction dict has: amount (float), type (str), timestamp (datetime).
        """
        df = pd.DataFrame(transactions)
        if df.empty:
            return pd.DataFrame()

        df["date"] = pd.to_datetime(df["timestamp"]).dt.date
        df["amount"] = df["amount"].astype(float)

        # Classify as inflow or outflow
        inflow_types = {"SETTLEMENT"}
        df["is_inflow"] = df["type"].isin(inflow_types)

        daily = df.groupby("date").agg(
            inflow=("amount", lambda x: x[df.loc[x.index, "is_inflow"]].sum()),
            outflow=(
                "amount",
                lambda x: x[~df.loc[x.index, "is_inflow"]].sum(),
            ),
        ).reset_index()

        daily["date"] = pd.to_datetime(daily["date"])
        daily = daily.sort_values("date").reset_index(drop=True)

        return daily

    def _engineer_features(self, daily: pd.DataFrame) -> pd.DataFrame:
        """Build feature matrix from daily aggregates."""
        df = daily.copy()

        df["day_of_week"] = df["date"].dt.dayofweek
        df["day_of_month"] = df["date"].dt.day
        df["month"] = df["date"].dt.month
        df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
        df["is_holiday_season"] = df.apply(
            lambda row: int(
                _is_holiday_season(
                    row["date"].month, row["date"].day
                )
            ),
            axis=1,
        )
        df["hour_of_day"] = 12  # Daily aggregates; placeholder
        df["week_of_year"] = df["date"].dt.isocalendar().week.astype(int)

        # Rolling averages
        df["rolling_7d_avg_inflow"] = (
            df["inflow"].rolling(window=7, min_periods=1).mean()
        )
        df["rolling_7d_avg_outflow"] = (
            df["outflow"].rolling(window=7, min_periods=1).mean()
        )
        df["rolling_30d_avg_inflow"] = (
            df["inflow"].rolling(window=30, min_periods=1).mean()
        )
        df["rolling_30d_avg_outflow"] = (
            df["outflow"].rolling(window=30, min_periods=1).mean()
        )

        # Previous day values
        df["prev_day_inflow"] = df["inflow"].shift(1).fillna(0)
        df["prev_day_outflow"] = df["outflow"].shift(1).fillna(0)

        return df

    def train(self, transactions: list[dict]) -> dict[str, float]:
        """
        Train on merchant transaction history.

        Args:
            transactions: list of dicts with keys:
                amount (float/Decimal), type (str), timestamp (datetime)

        Returns:
            Training metrics dict.
        """
        daily = self._build_daily_aggregates(transactions)
        if len(daily) < 14:
            raise ValueError(
                f"Need at least 14 days of data to train; got {len(daily)}"
            )

        featured = self._engineer_features(daily)

        X = featured[self.FEATURE_NAMES].values
        y_outflow = featured["outflow"].values
        y_inflow = featured["inflow"].values

        # Train outflow model
        self._outflow_model = GradientBoostingRegressor(
            n_estimators=200,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            random_state=42,
        )
        self._outflow_model.fit(X, y_outflow)

        # Train inflow model
        self._inflow_model = GradientBoostingRegressor(
            n_estimators=200,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            random_state=42,
        )
        self._inflow_model.fit(X, y_inflow)

        # Cross-validation scores
        cv_outflow = cross_val_score(
            self._outflow_model, X, y_outflow, cv=min(5, len(X) // 3), scoring="r2"
        )
        cv_inflow = cross_val_score(
            self._inflow_model, X, y_inflow, cv=min(5, len(X) // 3), scoring="r2"
        )

        self._is_trained = True
        self._training_score = float(cv_outflow.mean())
        self._last_daily = featured

        metrics = {
            "outflow_r2_mean": float(cv_outflow.mean()),
            "outflow_r2_std": float(cv_outflow.std()),
            "inflow_r2_mean": float(cv_inflow.mean()),
            "inflow_r2_std": float(cv_inflow.std()),
            "training_samples": len(X),
        }
        logger.info("Model trained: %s", metrics)
        return metrics

    def predict_outflows(
        self, merchant_id: str, days_ahead: int = 3
    ) -> PredictionResult:
        """
        Predict total outflows and inflows for the next N days.
        """
        if not self._is_trained:
            raise RuntimeError("Model not trained. Call train() first.")

        last_row = self._last_daily.iloc[-1]
        last_date = last_row["date"]

        total_outflow = 0.0
        total_inflow = 0.0

        for day_offset in range(1, days_ahead + 1):
            future_date = last_date + timedelta(days=day_offset)
            features = self._build_future_features(future_date, last_row)
            feature_array = np.array([features])

            pred_outflow = max(0.0, float(self._outflow_model.predict(feature_array)[0]))
            pred_inflow = max(0.0, float(self._inflow_model.predict(feature_array)[0]))

            total_outflow += pred_outflow
            total_inflow += pred_inflow

        # Build feature importances
        importances = dict(
            zip(
                self.FEATURE_NAMES,
                self._outflow_model.feature_importances_.tolist(),
            )
        )
        # Sort by importance
        importances = dict(
            sorted(importances.items(), key=lambda x: x[1], reverse=True)
        )

        # Confidence based on training R^2 score, clamped
        confidence = max(0.5, min(0.99, self._training_score))

        return PredictionResult(
            merchant_id=merchant_id,
            predicted_outflows=Decimal(str(round(total_outflow, 2))),
            predicted_inflows=Decimal(str(round(total_inflow, 2))),
            predicted_net=Decimal(str(round(total_inflow - total_outflow, 2))),
            confidence=Decimal(str(round(confidence, 4))),
            horizon_days=days_ahead,
            feature_importances=importances,
        )

    def _build_future_features(
        self, future_date: datetime, last_row: pd.Series
    ) -> list[float]:
        """Build feature vector for a future date using last known data."""
        day_of_week = future_date.weekday()
        day_of_month = future_date.day
        month = future_date.month
        is_weekend = 1 if day_of_week >= 5 else 0
        is_holiday = 1 if _is_holiday_season(month, day_of_month) else 0
        hour_of_day = 12
        week_of_year = future_date.isocalendar()[1]

        return [
            day_of_week,
            day_of_month,
            month,
            is_weekend,
            is_holiday,
            hour_of_day,
            float(last_row.get("rolling_7d_avg_inflow", 0)),
            float(last_row.get("rolling_7d_avg_outflow", 0)),
            float(last_row.get("rolling_30d_avg_inflow", 0)),
            float(last_row.get("rolling_30d_avg_outflow", 0)),
            float(last_row.get("inflow", 0)),
            float(last_row.get("outflow", 0)),
            week_of_year,
        ]

    def detect_seasonal_patterns(
        self, transactions: list[dict]
    ) -> SeasonalPattern:
        """Detect weekly and monthly patterns from transaction history."""
        daily = self._build_daily_aggregates(transactions)
        if daily.empty:
            raise ValueError("No transaction data to analyze")

        featured = self._engineer_features(daily)

        # Weekly pattern
        day_names = [
            "Monday", "Tuesday", "Wednesday", "Thursday",
            "Friday", "Saturday", "Sunday",
        ]
        weekday_totals = featured.groupby("day_of_week")["inflow"].mean()
        weekday_avg = {}
        for dow, name in enumerate(day_names):
            val = weekday_totals.get(dow, 0.0)
            weekday_avg[name] = Decimal(str(round(val, 2)))

        peak_day = max(weekday_avg, key=weekday_avg.get)
        trough_day = min(weekday_avg, key=weekday_avg.get)

        # Monthly pattern
        monthly_totals = featured.groupby("day_of_month")["inflow"].mean()
        monthly_avg = {
            int(k): Decimal(str(round(v, 2)))
            for k, v in monthly_totals.items()
        }

        # Weekend multiplier
        weekend_avg = featured[featured["is_weekend"] == 1]["inflow"].mean()
        weekday_avg_val = featured[featured["is_weekend"] == 0]["inflow"].mean()
        weekend_mult = (
            Decimal(str(round(weekend_avg / weekday_avg_val, 3)))
            if weekday_avg_val > 0
            else Decimal("1.0")
        )

        # Holiday multiplier
        holiday_rows = featured[featured["is_holiday_season"] == 1]["inflow"]
        non_holiday_rows = featured[featured["is_holiday_season"] == 0]["inflow"]
        if len(holiday_rows) > 0 and non_holiday_rows.mean() > 0:
            holiday_mult = Decimal(
                str(round(holiday_rows.mean() / non_holiday_rows.mean(), 3))
            )
        else:
            holiday_mult = Decimal("1.0")

        return SeasonalPattern(
            weekday_avg=weekday_avg,
            monthly_avg=monthly_avg,
            peak_day=peak_day,
            trough_day=trough_day,
            weekend_multiplier=weekend_mult,
            holiday_multiplier=holiday_mult,
        )
