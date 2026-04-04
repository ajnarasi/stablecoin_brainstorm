"""Tests for cross-border detection engine."""

from decimal import Decimal

import pytest

from app.detection.detector import CrossBorderDetector


@pytest.fixture
def detector() -> CrossBorderDetector:
    return CrossBorderDetector()


class TestCrossBorderDetection:
    def test_domestic_transaction_same_currency(self, detector):
        result = detector.detect(
            buyer_currency="USD",
            merchant_currency="USD",
            buyer_country="US",
            merchant_country="US",
        )
        assert result.is_cross_border is False
        assert result.corridor is None
        assert result.card_route_estimate is None
        assert result.stablecoin_route_available is False

    def test_cross_border_mxn_to_usd(self, detector):
        result = detector.detect(
            buyer_currency="MXN",
            merchant_currency="USD",
            buyer_country="MX",
            merchant_country="US",
        )
        assert result.is_cross_border is True
        assert result.corridor == "MXN->USD"
        assert result.stablecoin_route_available is True
        assert result.card_route_estimate is not None
        assert result.card_route_estimate.processing_pct == Decimal("0.035")
        assert result.card_route_estimate.fx_markup_pct == Decimal("0.025")
        assert result.card_route_estimate.total_fee_pct == Decimal("0.060")
        assert result.card_route_estimate.settlement_days == 3

    def test_cross_border_eur_to_usd(self, detector):
        result = detector.detect(
            buyer_currency="EUR",
            merchant_currency="USD",
            buyer_country="DE",
            merchant_country="US",
        )
        assert result.is_cross_border is True
        assert result.corridor == "EUR->USD"
        assert result.stablecoin_route_available is True
        assert result.card_route_estimate.total_fee_pct == Decimal("0.050")
        assert result.card_route_estimate.settlement_days == 2

    def test_cross_border_gbp_to_usd(self, detector):
        result = detector.detect(
            buyer_currency="GBP",
            merchant_currency="USD",
            buyer_country="GB",
            merchant_country="US",
        )
        assert result.is_cross_border is True
        assert result.corridor == "GBP->USD"
        assert result.stablecoin_route_available is True

    def test_unsupported_corridor_uses_defaults(self, detector):
        result = detector.detect(
            buyer_currency="JPY",
            merchant_currency="USD",
            buyer_country="JP",
            merchant_country="US",
        )
        assert result.is_cross_border is True
        assert result.corridor == "JPY->USD"
        assert result.stablecoin_route_available is False
        assert result.card_route_estimate.total_fee_pct == Decimal("0.060")

    def test_case_insensitive_currencies(self, detector):
        result = detector.detect(
            buyer_currency="mxn",
            merchant_currency="usd",
            buyer_country="mx",
            merchant_country="us",
        )
        assert result.is_cross_border is True
        assert result.corridor == "MXN->USD"

    def test_same_currency_different_countries_is_domestic(self, detector):
        """EUR zone: same currency across borders = domestic."""
        result = detector.detect(
            buyer_currency="EUR",
            merchant_currency="EUR",
            buyer_country="DE",
            merchant_country="FR",
        )
        assert result.is_cross_border is False

    def test_get_supported_corridors(self, detector):
        corridors = detector.get_supported_corridors()
        assert len(corridors) >= 3
        corridor_names = [c["corridor"] for c in corridors]
        assert "MXN->USD" in corridor_names
        assert "EUR->USD" in corridor_names
        assert "GBP->USD" in corridor_names
