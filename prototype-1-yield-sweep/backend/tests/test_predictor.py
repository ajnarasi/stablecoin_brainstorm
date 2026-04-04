"""
Tests for the cash flow predictor.
"""

from decimal import Decimal

import pytest

from app.ml.predictor import CashFlowPredictor
from app.services.settlement_simulator import SettlementSimulator


class TestCashFlowPredictor:
    """Tests for ML prediction model."""

    def test_train_requires_minimum_data(self):
        predictor = CashFlowPredictor()
        # Too few days
        with pytest.raises(ValueError, match="at least 14 days"):
            predictor.train([
                {"amount": 100.0, "type": "SETTLEMENT", "timestamp": "2024-01-01T12:00:00+00:00"}
            ])

    def test_train_succeeds_with_sufficient_data(self, sample_transactions):
        predictor = CashFlowPredictor()
        metrics = predictor.train(sample_transactions)

        assert predictor.is_trained
        assert "outflow_r2_mean" in metrics
        assert "inflow_r2_mean" in metrics
        assert metrics["training_samples"] > 0

    def test_predict_outflows(self, trained_predictor):
        result = trained_predictor.predict_outflows(
            "DEMO_MERCHANT_001", days_ahead=3
        )

        assert result.merchant_id == "DEMO_MERCHANT_001"
        assert result.predicted_outflows > Decimal("0")
        assert result.predicted_inflows > Decimal("0")
        assert result.horizon_days == 3
        assert Decimal("0") < result.confidence <= Decimal("1")
        assert len(result.feature_importances) > 0

    def test_predict_requires_training(self):
        predictor = CashFlowPredictor()
        with pytest.raises(RuntimeError, match="not trained"):
            predictor.predict_outflows("test", days_ahead=3)

    def test_seasonal_patterns(self, trained_predictor, sample_transactions):
        pattern = trained_predictor.detect_seasonal_patterns(sample_transactions)

        assert len(pattern.weekday_avg) == 7
        assert "Saturday" in pattern.weekday_avg
        assert pattern.peak_day in pattern.weekday_avg
        assert pattern.trough_day in pattern.weekday_avg
        assert pattern.weekend_multiplier > Decimal("0")

    def test_weekend_revenue_higher(self, trained_predictor, sample_transactions):
        """Verify the model detects that weekend revenue is higher."""
        pattern = trained_predictor.detect_seasonal_patterns(sample_transactions)
        weekday_vals = [
            pattern.weekday_avg[d]
            for d in ["Monday", "Tuesday", "Wednesday", "Thursday"]
        ]
        weekend_vals = [
            pattern.weekday_avg[d] for d in ["Saturday", "Sunday"]
        ]
        avg_weekday = sum(weekday_vals) / len(weekday_vals)
        avg_weekend = sum(weekend_vals) / len(weekend_vals)

        assert avg_weekend > avg_weekday
