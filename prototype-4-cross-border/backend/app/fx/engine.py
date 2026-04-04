"""FX conversion engine with rate locking.

Provides simulated live FX rates with realistic bid/ask spreads
and a rate-locking mechanism for guaranteed conversion within a TTL window.
"""

from __future__ import annotations

import random
import uuid
from datetime import datetime, timedelta, timezone
from decimal import ROUND_HALF_UP, Decimal
from typing import Optional

from app.models.schemas import ConversionResult, FXRate, RateLock


class FXEngine:
    """Real-time FX conversion with rate locking."""

    def __init__(self, redis_url: Optional[str] = None) -> None:
        # In-memory rate lock store (Redis replacement for demo)
        self._rate_locks: dict[str, dict] = {}

        # Base mid-market rates (updated periodically in production)
        self._base_rates: dict[str, Decimal] = {
            "MXN/USD": Decimal("0.0571"),   # 1 MXN = 0.0571 USD (~17.5 MXN per USD)
            "EUR/USD": Decimal("1.0850"),   # 1 EUR = 1.085 USD
            "GBP/USD": Decimal("1.2650"),   # 1 GBP = 1.265 USD
            "BRL/USD": Decimal("0.1890"),   # 1 BRL = 0.189 USD
            "INR/USD": Decimal("0.01193"),  # 1 INR = 0.01193 USD
            "USD/USD": Decimal("1.0000"),
        }

        # Spread configuration per pair (half-spread in basis points)
        self._spread_bps: dict[str, int] = {
            "MXN/USD": 15,  # 0.15% half-spread
            "EUR/USD": 5,   # 0.05% half-spread
            "GBP/USD": 7,   # 0.07% half-spread
            "BRL/USD": 20,  # 0.20% half-spread
            "INR/USD": 18,  # 0.18% half-spread
            "USD/USD": 0,
        }

        # Stablecoin fee breakdown
        self.FX_SPREAD_FEE_PCT = Decimal("0.002")       # 0.2%
        self.SETTLEMENT_FEE_PCT = Decimal("0.002")       # 0.2%
        self.NETWORK_FEE_PCT = Decimal("0.001")          # 0.1%
        self.TOTAL_STABLECOIN_FEE_PCT = (
            self.FX_SPREAD_FEE_PCT + self.SETTLEMENT_FEE_PCT + self.NETWORK_FEE_PCT
        )  # 0.5%

    def _pair_key(self, from_currency: str, to_currency: str) -> str:
        return f"{from_currency.upper()}/{to_currency.upper()}"

    def _add_jitter(self, base_rate: Decimal, max_pct: Decimal = Decimal("0.003")) -> Decimal:
        """Add small random jitter to simulate live market movement."""
        jitter_factor = Decimal(str(random.uniform(-float(max_pct), float(max_pct))))
        return base_rate * (Decimal("1") + jitter_factor)

    async def get_live_rate(self, from_currency: str, to_currency: str) -> FXRate:
        """Get simulated live FX rate with realistic bid/ask spread.

        Adds small random jitter to the base rate to simulate market
        movement, then applies the configured spread for the pair.

        Args:
            from_currency: Source currency (e.g., "MXN").
            to_currency: Target currency (e.g., "USD").

        Returns:
            FXRate with mid, bid, and ask rates plus spread info.

        Raises:
            ValueError: If the currency pair is not supported.
        """
        pair = self._pair_key(from_currency, to_currency)
        base_rate = self._base_rates.get(pair)

        if base_rate is None:
            raise ValueError(f"Unsupported currency pair: {pair}")

        # Apply jitter for realistic movement
        mid_rate = self._add_jitter(base_rate)
        mid_rate = mid_rate.quantize(Decimal("0.00000001"), rounding=ROUND_HALF_UP)

        # Calculate spread
        spread_bps = self._spread_bps.get(pair, 10)
        half_spread = mid_rate * Decimal(spread_bps) / Decimal("10000")

        bid_rate = (mid_rate - half_spread).quantize(Decimal("0.00000001"), rounding=ROUND_HALF_UP)
        ask_rate = (mid_rate + half_spread).quantize(Decimal("0.00000001"), rounding=ROUND_HALF_UP)
        spread_pct = (Decimal(spread_bps * 2) / Decimal("10000")).quantize(
            Decimal("0.0001"), rounding=ROUND_HALF_UP
        )

        return FXRate(
            from_currency=from_currency.upper(),
            to_currency=to_currency.upper(),
            mid_rate=mid_rate,
            bid_rate=bid_rate,
            ask_rate=ask_rate,
            spread_pct=spread_pct,
            timestamp=datetime.now(timezone.utc),
        )

    async def lock_rate(
        self,
        from_currency: str,
        to_currency: str,
        amount_local: Decimal,
        ttl_seconds: int = 30,
    ) -> RateLock:
        """Lock an FX rate for a specified TTL window.

        Fetches the current live rate and locks it for the given duration.
        The locked rate guarantees the conversion amount during the window.

        Args:
            from_currency: Source currency.
            to_currency: Target currency (typically "USD").
            amount_local: Amount in the source currency.
            ttl_seconds: How long the lock is valid (default 30s).

        Returns:
            RateLock with the guaranteed rate, FIUSD amount, and expiry.
        """
        rate_data = await self.get_live_rate(from_currency, to_currency)
        lock_id = f"FXLOCK-{uuid.uuid4().hex[:12].upper()}"
        now = datetime.now(timezone.utc)
        expiry = now + timedelta(seconds=ttl_seconds)

        # Use mid rate for the lock (stablecoin route has tighter spreads)
        fiusd_amount = (amount_local * rate_data.mid_rate).quantize(
            Decimal("0.0001"), rounding=ROUND_HALF_UP
        )

        lock = RateLock(
            lock_id=lock_id,
            from_currency=from_currency.upper(),
            to_currency=to_currency.upper(),
            rate=rate_data.mid_rate,
            amount_local=amount_local,
            fiusd_amount=fiusd_amount,
            locked_at=now,
            expiry=expiry,
        )

        # Store in memory (Redis in production)
        self._rate_locks[lock_id] = {
            "lock": lock,
            "used": False,
        }

        return lock

    async def execute_conversion(self, lock_id: str) -> ConversionResult:
        """Execute a currency conversion using a previously locked rate.

        Validates that the lock exists and has not expired, then marks
        the lock as used and returns the conversion result.

        Args:
            lock_id: The rate lock identifier.

        Returns:
            ConversionResult with the final amounts and rate.

        Raises:
            ValueError: If the lock is invalid, expired, or already used.
        """
        lock_entry = self._rate_locks.get(lock_id)
        if lock_entry is None:
            raise ValueError(f"Rate lock not found: {lock_id}")

        if lock_entry["used"]:
            raise ValueError(f"Rate lock already used: {lock_id}")

        lock: RateLock = lock_entry["lock"]
        now = datetime.now(timezone.utc)

        if now > lock.expiry:
            lock_entry["used"] = True
            raise ValueError(
                f"Rate lock expired at {lock.expiry.isoformat()}. "
                f"Current time: {now.isoformat()}"
            )

        lock_entry["used"] = True

        return ConversionResult(
            lock_id=lock_id,
            from_currency=lock.from_currency,
            to_currency=lock.to_currency,
            rate=lock.rate,
            amount_local=lock.amount_local,
            fiusd_amount=lock.fiusd_amount,
            status="COMPLETED",
            converted_at=now,
        )

    def calculate_stablecoin_fee(self, amount_usd: Decimal) -> Decimal:
        """Calculate total stablecoin route fee (~0.5%).

        Fee breakdown:
            - FX spread:      0.2%
            - Settlement fee:  0.2%
            - Network fee:     0.1%
            - Total:           0.5%

        Args:
            amount_usd: Transaction amount in USD.

        Returns:
            Fee amount in USD.
        """
        fee = (amount_usd * self.TOTAL_STABLECOIN_FEE_PCT).quantize(
            Decimal("0.0001"), rounding=ROUND_HALF_UP
        )
        return fee

    def calculate_card_fee(self, amount_usd: Decimal, corridor: str) -> Decimal:
        """Calculate what the card network would charge for this corridor.

        Looks up the corridor-specific processing and FX markup percentages
        from the cross-border fee table.

        Args:
            amount_usd: Transaction amount in USD.
            corridor: Corridor string (e.g., "MXN->USD").

        Returns:
            Fee amount in USD.
        """
        from app.detection.detector import CrossBorderDetector

        detector = CrossBorderDetector()
        fees = detector.CARD_CROSS_BORDER_FEES.get(
            corridor, detector.DEFAULT_CROSS_BORDER_FEES
        )
        total_pct = fees["processing_pct"] + fees["fx_markup_pct"]
        return (amount_usd * total_pct).quantize(
            Decimal("0.0001"), rounding=ROUND_HALF_UP
        )

    async def get_all_rates(self) -> list[FXRate]:
        """Get live rates for all supported pairs."""
        rates = []
        for pair in self._base_rates:
            if pair == "USD/USD":
                continue
            from_curr, to_curr = pair.split("/")
            rate = await self.get_live_rate(from_curr, to_curr)
            rates.append(rate)
        return rates
