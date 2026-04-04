"""Cross-border transaction detection engine.

Detects cross-border transactions based on buyer vs merchant currency/country
and provides routing estimates for card vs stablecoin paths.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Optional

from app.models.schemas import CardRouteEstimate, CrossBorderResult


class CrossBorderDetector:
    """Detects cross-border transactions based on buyer vs merchant currency."""

    # Card network cross-border fee schedules by corridor.
    # These are realistic representations of total costs including
    # processing fees, FX markups, and settlement timelines.
    CARD_CROSS_BORDER_FEES: dict[str, dict] = {
        "MXN->USD": {
            "processing_pct": Decimal("0.035"),
            "fx_markup_pct": Decimal("0.025"),
            "settlement_days": 3,
            "intermediary_count": 4,
        },
        "EUR->USD": {
            "processing_pct": Decimal("0.030"),
            "fx_markup_pct": Decimal("0.020"),
            "settlement_days": 2,
            "intermediary_count": 3,
        },
        "GBP->USD": {
            "processing_pct": Decimal("0.030"),
            "fx_markup_pct": Decimal("0.020"),
            "settlement_days": 2,
            "intermediary_count": 3,
        },
        "BRL->USD": {
            "processing_pct": Decimal("0.040"),
            "fx_markup_pct": Decimal("0.030"),
            "settlement_days": 4,
            "intermediary_count": 5,
        },
        "INR->USD": {
            "processing_pct": Decimal("0.038"),
            "fx_markup_pct": Decimal("0.028"),
            "settlement_days": 4,
            "intermediary_count": 5,
        },
    }

    # Default fees for corridors not explicitly mapped
    DEFAULT_CROSS_BORDER_FEES = {
        "processing_pct": Decimal("0.035"),
        "fx_markup_pct": Decimal("0.025"),
        "settlement_days": 3,
        "intermediary_count": 4,
    }

    # Supported stablecoin corridors
    STABLECOIN_CORRIDORS: set[str] = {
        "MXN->USD",
        "EUR->USD",
        "GBP->USD",
        "BRL->USD",
        "INR->USD",
    }

    def detect(
        self,
        buyer_currency: str,
        merchant_currency: str,
        buyer_country: str,
        merchant_country: str,
    ) -> CrossBorderResult:
        """Detect whether a transaction is cross-border and estimate costs.

        A transaction is cross-border when the buyer and merchant operate
        in different currencies. Same-currency transactions between
        different countries (e.g., EUR zone) are treated as domestic.

        Args:
            buyer_currency: ISO 4217 currency code of the buyer.
            merchant_currency: ISO 4217 currency code of the merchant.
            buyer_country: ISO 3166-1 alpha-2 country code of the buyer.
            merchant_country: ISO 3166-1 alpha-2 country code of the merchant.

        Returns:
            CrossBorderResult with detection outcome and route estimates.
        """
        buyer_currency = buyer_currency.upper()
        merchant_currency = merchant_currency.upper()
        buyer_country = buyer_country.upper()
        merchant_country = merchant_country.upper()

        is_cross_border = buyer_currency != merchant_currency

        if not is_cross_border:
            return CrossBorderResult(
                is_cross_border=False,
                corridor=None,
                buyer_country=buyer_country,
                merchant_country=merchant_country,
                buyer_currency=buyer_currency,
                merchant_currency=merchant_currency,
                card_route_estimate=None,
                stablecoin_route_available=False,
            )

        corridor = f"{buyer_currency}->{merchant_currency}"
        card_estimate = self._get_card_estimate(corridor)
        stablecoin_available = corridor in self.STABLECOIN_CORRIDORS

        return CrossBorderResult(
            is_cross_border=True,
            corridor=corridor,
            buyer_country=buyer_country,
            merchant_country=merchant_country,
            buyer_currency=buyer_currency,
            merchant_currency=merchant_currency,
            card_route_estimate=card_estimate,
            stablecoin_route_available=stablecoin_available,
        )

    def _get_card_estimate(self, corridor: str) -> CardRouteEstimate:
        """Build a card route cost estimate for a given corridor."""
        fees = self.CARD_CROSS_BORDER_FEES.get(
            corridor, self.DEFAULT_CROSS_BORDER_FEES
        )
        processing = fees["processing_pct"]
        fx_markup = fees["fx_markup_pct"]

        return CardRouteEstimate(
            processing_pct=processing,
            fx_markup_pct=fx_markup,
            total_fee_pct=processing + fx_markup,
            settlement_days=fees["settlement_days"],
            intermediary_count=fees.get("intermediary_count", 3),
        )

    def get_supported_corridors(self) -> list[dict]:
        """Return all supported corridors with their fee structures."""
        corridors = []
        for corridor, fees in self.CARD_CROSS_BORDER_FEES.items():
            card_estimate = self._get_card_estimate(corridor)
            corridors.append(
                {
                    "corridor": corridor,
                    "card_fees": card_estimate.model_dump(),
                    "stablecoin_available": corridor in self.STABLECOIN_CORRIDORS,
                }
            )
        return corridors
