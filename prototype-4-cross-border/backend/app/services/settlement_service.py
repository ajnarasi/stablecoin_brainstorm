"""Cross-border settlement service.

Orchestrates the full cross-border settlement flow through FIUSD/INDX,
including FX rate locking, conversion, compliance screening, and
settlement with route comparison analytics.
"""

from __future__ import annotations

import random
import uuid
from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal
from typing import Optional

from app.detection.detector import CrossBorderDetector
from app.fx.engine import FXEngine
from app.models.schemas import (
    ComplianceResult,
    CorridorAnalytics,
    CorridorStats,
    RouteComparisonSchema,
    SettlementResult,
)
from app.services.compliance_stub import ComplianceStub


class CrossBorderSettlementService:
    """Orchestrates cross-border settlement via FIUSD/INDX."""

    def __init__(
        self,
        fx_engine: FXEngine,
        compliance: ComplianceStub,
        demo_mode: bool = True,
    ) -> None:
        self.fx_engine = fx_engine
        self.compliance = compliance
        self.detector = CrossBorderDetector()
        self.demo_mode = demo_mode

    async def process_cross_border_payment(
        self,
        transaction_id: str,
        buyer_name: str,
        buyer_country: str,
        buyer_currency: str,
        merchant_currency: str,
        amount_local: Decimal,
    ) -> SettlementResult:
        """Full cross-border settlement flow.

        Steps:
            1. Compliance screening (OFAC/sanctions)
            2. Lock FX rate (30-second window)
            3. Convert local currency to FIUSD amount
            4. Simulate FIUSD transfer on Solana
            5. Settle merchant in USD via INDX simulator
            6. Return result with timing and savings

        Args:
            transaction_id: The transaction identifier.
            buyer_name: Buyer's full name for compliance screening.
            buyer_country: Buyer's country code.
            buyer_currency: Buyer's local currency code.
            merchant_currency: Merchant's currency code (typically USD).
            amount_local: Payment amount in buyer's local currency.

        Returns:
            SettlementResult with complete settlement details.

        Raises:
            ValueError: If FX rate lock or conversion fails.
        """
        import time

        start_time = time.monotonic()

        # Step 1: Compliance screening
        amount_usd_estimate = amount_local * self.fx_engine._base_rates.get(
            f"{buyer_currency}/USD", Decimal("1.0")
        )
        compliance_result = await self.compliance.screen_transaction(
            buyer_name=buyer_name,
            buyer_country=buyer_country,
            amount_usd=amount_usd_estimate,
        )

        # Step 2: Lock FX rate
        rate_lock = await self.fx_engine.lock_rate(
            from_currency=buyer_currency,
            to_currency="USD",
            amount_local=amount_local,
            ttl_seconds=30,
        )

        # Step 3: Execute conversion
        conversion = await self.fx_engine.execute_conversion(rate_lock.lock_id)

        # Step 4: Calculate fees
        stablecoin_fee = self.fx_engine.calculate_stablecoin_fee(conversion.fiusd_amount)
        fee_pct = self.fx_engine.TOTAL_STABLECOIN_FEE_PCT

        # Step 5: Simulate INDX settlement
        indx_id = f"INDX-{uuid.uuid4().hex[:8].upper()}"

        # Simulate realistic settlement latency (3-12 seconds)
        elapsed = time.monotonic() - start_time
        settlement_seconds = max(3, int(elapsed) + random.randint(3, 8))

        now = datetime.now(timezone.utc)

        return SettlementResult(
            transaction_id=transaction_id,
            method="FIUSD_INDX",
            amount_usd=conversion.fiusd_amount,
            fee_amount=stablecoin_fee,
            fee_pct=fee_pct,
            settlement_time_seconds=settlement_seconds,
            indx_settlement_id=indx_id,
            compliance=compliance_result,
            fx_conversion=conversion,
            status="COMPLETED",
            completed_at=now,
        )

    async def compare_routes(
        self,
        buyer_currency: str,
        merchant_currency: str,
        amount_local: Decimal,
    ) -> RouteComparisonSchema:
        """Calculate side-by-side route comparison.

        Compares what the transaction would cost and how long it would
        take via traditional card networks vs the FIUSD/INDX stablecoin route.

        Args:
            buyer_currency: Source currency.
            merchant_currency: Destination currency.
            amount_local: Amount in source currency.

        Returns:
            RouteComparisonSchema with fee and timing differences.
        """
        corridor = f"{buyer_currency}->{merchant_currency}"

        # Get current FX rate for amount calculation
        rate_data = await self.fx_engine.get_live_rate(buyer_currency, "USD")
        amount_usd = (amount_local * rate_data.mid_rate).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        # Card route costs
        card_estimate = self.detector._get_card_estimate(corridor)
        card_fee = (amount_usd * card_estimate.total_fee_pct).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        # Stablecoin route costs
        stablecoin_fee = self.fx_engine.calculate_stablecoin_fee(amount_usd)
        stablecoin_fee_pct = self.fx_engine.TOTAL_STABLECOIN_FEE_PCT
        stablecoin_seconds = random.randint(3, 12)

        # Savings
        savings_amount = card_fee - stablecoin_fee
        savings_pct = Decimal("0")
        if card_fee > 0:
            savings_pct = (
                (savings_amount / card_fee * Decimal("100"))
                .quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            )

        return RouteComparisonSchema(
            transaction_id=f"COMPARE-{uuid.uuid4().hex[:8].upper()}",
            card_fee=card_fee,
            card_fee_pct=card_estimate.total_fee_pct,
            card_settlement_days=card_estimate.settlement_days,
            card_intermediaries=card_estimate.intermediary_count,
            stablecoin_fee=stablecoin_fee,
            stablecoin_fee_pct=stablecoin_fee_pct,
            stablecoin_settlement_seconds=stablecoin_seconds,
            savings_amount=savings_amount,
            savings_pct=savings_pct,
        )

    def calculate_corridor_analytics(
        self,
        transactions: list[dict],
        comparisons: list[dict],
        settlements: list[dict],
        days: int = 30,
        merchant_id: str = "",
    ) -> CorridorAnalytics:
        """Calculate analytics per corridor from historical data.

        Aggregates transaction volumes, savings, and settlement times
        across all corridors for the dashboard display.

        Args:
            transactions: List of transaction dicts.
            comparisons: List of route comparison dicts.
            settlements: List of settlement dicts.
            days: Period in days.
            merchant_id: Merchant identifier.

        Returns:
            CorridorAnalytics with per-corridor and aggregate stats.
        """
        cross_border_txns = [t for t in transactions if t.get("is_cross_border")]
        total_txns = len(transactions)
        cb_count = len(cross_border_txns)

        # Group by corridor
        corridor_data: dict[str, dict] = {}
        comparison_lookup = {c["transaction_id"]: c for c in comparisons}
        settlement_lookup = {s["transaction_id"]: s for s in settlements}

        for txn in cross_border_txns:
            corridor = txn.get("corridor", "UNKNOWN")
            if corridor not in corridor_data:
                corridor_data[corridor] = {
                    "count": 0,
                    "volume": Decimal("0"),
                    "savings": Decimal("0"),
                    "savings_pcts": [],
                    "settlement_seconds": [],
                    "card_days": [],
                }

            data = corridor_data[corridor]
            data["count"] += 1
            data["volume"] += txn["amount_usd"]

            comp = comparison_lookup.get(txn["id"])
            if comp:
                data["savings"] += comp["savings_amount"]
                data["savings_pcts"].append(comp["savings_pct"])
                data["card_days"].append(comp["card_settlement_days"])

            stl = settlement_lookup.get(txn["id"])
            if stl:
                data["settlement_seconds"].append(stl["settlement_time_seconds"])

        # Build corridor stats
        corridor_stats = []
        total_volume = Decimal("0")
        total_savings = Decimal("0")

        for corridor, data in sorted(corridor_data.items()):
            avg_savings = Decimal("0")
            if data["savings_pcts"]:
                avg_savings = (
                    sum(data["savings_pcts"]) / len(data["savings_pcts"])
                ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            avg_seconds = 0
            if data["settlement_seconds"]:
                avg_seconds = int(
                    sum(data["settlement_seconds"]) / len(data["settlement_seconds"])
                )

            avg_card_days = 0
            if data["card_days"]:
                avg_card_days = int(sum(data["card_days"]) / len(data["card_days"]))

            corridor_stats.append(
                CorridorStats(
                    corridor=corridor,
                    transaction_count=data["count"],
                    total_volume_usd=data["volume"].quantize(
                        Decimal("0.01"), rounding=ROUND_HALF_UP
                    ),
                    total_savings=data["savings"].quantize(
                        Decimal("0.01"), rounding=ROUND_HALF_UP
                    ),
                    avg_savings_pct=avg_savings,
                    avg_settlement_seconds=avg_seconds,
                    avg_card_settlement_days=avg_card_days,
                )
            )
            total_volume += data["volume"]
            total_savings += data["savings"]

        avg_savings_pct = Decimal("0")
        if total_volume > 0 and total_savings > 0:
            # Overall savings percentage based on what card fees would have been
            all_card_fees = sum(
                c["card_fee"] for c in comparisons
            )
            if all_card_fees > 0:
                avg_savings_pct = (
                    (total_savings / all_card_fees * Decimal("100"))
                    .quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                )

        cross_border_pct = Decimal("0")
        if total_txns > 0:
            cross_border_pct = (
                Decimal(cb_count) / Decimal(total_txns) * Decimal("100")
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        return CorridorAnalytics(
            merchant_id=merchant_id,
            period_days=days,
            corridors=corridor_stats,
            total_cross_border_volume=total_volume.quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            ),
            total_savings=total_savings.quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            ),
            avg_savings_pct=avg_savings_pct,
            total_transactions=total_txns,
            cross_border_transactions=cb_count,
            cross_border_pct=cross_border_pct,
        )
