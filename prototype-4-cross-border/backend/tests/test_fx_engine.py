"""Tests for FX conversion engine."""

from decimal import Decimal

import pytest
import pytest_asyncio

from app.fx.engine import FXEngine


@pytest.fixture
def fx_engine() -> FXEngine:
    return FXEngine()


@pytest.mark.asyncio
class TestFXEngine:
    async def test_get_live_rate_mxn_usd(self, fx_engine):
        rate = await fx_engine.get_live_rate("MXN", "USD")
        assert rate.from_currency == "MXN"
        assert rate.to_currency == "USD"
        # Rate should be close to base rate of 0.0571 (within 1%)
        assert Decimal("0.0560") < rate.mid_rate < Decimal("0.0582")
        assert rate.bid_rate < rate.mid_rate < rate.ask_rate
        assert rate.spread_pct > 0

    async def test_get_live_rate_eur_usd(self, fx_engine):
        rate = await fx_engine.get_live_rate("EUR", "USD")
        assert Decimal("1.07") < rate.mid_rate < Decimal("1.10")

    async def test_get_live_rate_unsupported_pair(self, fx_engine):
        with pytest.raises(ValueError, match="Unsupported currency pair"):
            await fx_engine.get_live_rate("JPY", "USD")

    async def test_lock_rate(self, fx_engine):
        lock = await fx_engine.lock_rate("MXN", "USD", Decimal("17500"))
        assert lock.lock_id.startswith("FXLOCK-")
        assert lock.from_currency == "MXN"
        assert lock.to_currency == "USD"
        assert lock.amount_local == Decimal("17500")
        # FIUSD amount should be ~$1000 (17500 * 0.0571)
        assert Decimal("950") < lock.fiusd_amount < Decimal("1050")
        assert lock.expiry > lock.locked_at

    async def test_execute_conversion_success(self, fx_engine):
        lock = await fx_engine.lock_rate("EUR", "USD", Decimal("1000"))
        result = await fx_engine.execute_conversion(lock.lock_id)
        assert result.status == "COMPLETED"
        assert result.lock_id == lock.lock_id
        assert result.fiusd_amount == lock.fiusd_amount

    async def test_execute_conversion_already_used(self, fx_engine):
        lock = await fx_engine.lock_rate("EUR", "USD", Decimal("1000"))
        await fx_engine.execute_conversion(lock.lock_id)
        with pytest.raises(ValueError, match="already used"):
            await fx_engine.execute_conversion(lock.lock_id)

    async def test_execute_conversion_not_found(self, fx_engine):
        with pytest.raises(ValueError, match="not found"):
            await fx_engine.execute_conversion("FXLOCK-NONEXISTENT")

    async def test_stablecoin_fee_calculation(self, fx_engine):
        fee = fx_engine.calculate_stablecoin_fee(Decimal("1000"))
        # 0.5% of $1000 = $5
        assert fee == Decimal("5.0000")

    async def test_stablecoin_fee_on_large_amount(self, fx_engine):
        fee = fx_engine.calculate_stablecoin_fee(Decimal("10000"))
        assert fee == Decimal("50.0000")

    async def test_card_fee_mxn_corridor(self, fx_engine):
        fee = fx_engine.calculate_card_fee(Decimal("1000"), "MXN->USD")
        # 6.0% of $1000 = $60
        assert fee == Decimal("60.0000")

    async def test_card_fee_eur_corridor(self, fx_engine):
        fee = fx_engine.calculate_card_fee(Decimal("1000"), "EUR->USD")
        # 5.0% of $1000 = $50
        assert fee == Decimal("50.0000")

    async def test_savings_demonstration(self, fx_engine):
        """Demonstrate the ~90% savings on a $1000 MXN->USD transaction."""
        amount_usd = Decimal("1000")
        card_fee = fx_engine.calculate_card_fee(amount_usd, "MXN->USD")
        stablecoin_fee = fx_engine.calculate_stablecoin_fee(amount_usd)
        savings = card_fee - stablecoin_fee
        savings_pct = savings / card_fee * 100

        # Card fee: $60 (6.0%)
        assert card_fee == Decimal("60.0000")
        # Stablecoin fee: $5 (0.5%)
        assert stablecoin_fee == Decimal("5.0000")
        # Savings: $55 (~91.7%)
        assert savings == Decimal("55.0000")
        assert savings_pct > 90

    async def test_get_all_rates(self, fx_engine):
        rates = await fx_engine.get_all_rates()
        assert len(rates) >= 4
        currencies = {r.from_currency for r in rates}
        assert "MXN" in currencies
        assert "EUR" in currencies
        assert "GBP" in currencies
