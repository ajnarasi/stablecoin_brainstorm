"""Tests for settlement service and transaction simulator."""

from decimal import Decimal

import pytest

from app.fx.engine import FXEngine
from app.services.compliance_stub import ComplianceStub
from app.services.settlement_service import CrossBorderSettlementService
from app.services.transaction_simulator import TransactionSimulator


@pytest.fixture
def fx_engine() -> FXEngine:
    return FXEngine()


@pytest.fixture
def compliance() -> ComplianceStub:
    return ComplianceStub()


@pytest.fixture
def service(fx_engine, compliance) -> CrossBorderSettlementService:
    return CrossBorderSettlementService(
        fx_engine=fx_engine,
        compliance=compliance,
        demo_mode=True,
    )


@pytest.fixture
def simulator() -> TransactionSimulator:
    return TransactionSimulator(merchant_currency="USD")


@pytest.mark.asyncio
class TestSettlementService:
    async def test_process_mxn_payment(self, service):
        result = await service.process_cross_border_payment(
            transaction_id="TXN-TEST-001",
            buyer_name="Carlos Rodriguez",
            buyer_country="MX",
            buyer_currency="MXN",
            merchant_currency="USD",
            amount_local=Decimal("17500"),
        )
        assert result.status == "COMPLETED"
        assert result.method == "FIUSD_INDX"
        assert result.indx_settlement_id.startswith("INDX-")
        assert result.settlement_time_seconds >= 3
        assert result.fee_pct == Decimal("0.005")
        # Amount should be ~$1000
        assert Decimal("950") < result.amount_usd < Decimal("1050")
        assert result.compliance.status == "PASSED"

    async def test_process_eur_payment(self, service):
        result = await service.process_cross_border_payment(
            transaction_id="TXN-TEST-002",
            buyer_name="Hans Mueller",
            buyer_country="DE",
            buyer_currency="EUR",
            merchant_currency="USD",
            amount_local=Decimal("920"),
        )
        assert result.status == "COMPLETED"
        # ~$1000 (920 EUR * 1.085)
        assert Decimal("970") < result.amount_usd < Decimal("1030")

    async def test_compare_routes_mxn(self, service):
        comparison = await service.compare_routes(
            buyer_currency="MXN",
            merchant_currency="USD",
            amount_local=Decimal("17500"),
        )
        # Card: ~6.0% fee, 3 days
        assert comparison.card_fee_pct == Decimal("0.060")
        assert comparison.card_settlement_days == 3
        # Stablecoin: 0.5% fee, <15 seconds
        assert comparison.stablecoin_fee_pct == Decimal("0.005")
        assert comparison.stablecoin_settlement_seconds < 15
        # Savings should be positive
        assert comparison.savings_amount > 0
        assert comparison.savings_pct > 80


@pytest.mark.asyncio
class TestComplianceStub:
    async def test_standard_screening(self, compliance):
        result = await compliance.screen_transaction(
            buyer_name="John Doe",
            buyer_country="MX",
            amount_usd=Decimal("500"),
        )
        assert result.status == "PASSED"
        assert "OFAC" in result.screening_type

    async def test_high_value_enhanced_screening(self, compliance):
        result = await compliance.screen_transaction(
            buyer_name="High Value Buyer",
            buyer_country="DE",
            amount_usd=Decimal("5000"),
        )
        assert result.status == "PASSED"
        assert "Enhanced Due Diligence" in result.screening_type


class TestTransactionSimulator:
    def test_generate_history(self, simulator):
        transactions = simulator.generate_history(
            merchant_id="TEST_MERCHANT",
            days=7,
            transactions_per_day=(5, 10),
        )
        assert len(transactions) >= 35  # At least 7 * 5
        # Check cross-border ratio (~30%)
        cross_border = [t for t in transactions if t["is_cross_border"]]
        cb_ratio = len(cross_border) / len(transactions)
        assert 0.15 < cb_ratio < 0.50  # Allow variance due to randomness

    def test_generate_settlement_cross_border(self, simulator):
        txn = {
            "id": "TXN-TEST",
            "is_cross_border": True,
            "corridor": "MXN->USD",
            "amount_usd": Decimal("1000"),
            "created_at": __import__("datetime").datetime.now(
                __import__("datetime").timezone.utc
            ),
        }
        settlement = simulator.generate_settlement(txn)
        assert settlement is not None
        assert settlement["method"] == "FIUSD_INDX"
        assert settlement["fee_pct"] == Decimal("0.005")
        assert settlement["fee_amount"] == Decimal("5.00")

    def test_generate_settlement_domestic(self, simulator):
        txn = {
            "id": "TXN-TEST-DOM",
            "is_cross_border": False,
            "corridor": None,
            "amount_usd": Decimal("500"),
            "created_at": __import__("datetime").datetime.now(
                __import__("datetime").timezone.utc
            ),
        }
        settlement = simulator.generate_settlement(txn)
        assert settlement["method"] == "CARD"
        assert settlement["fee_pct"] == Decimal("0.029")

    def test_generate_route_comparison(self, simulator):
        txn = {
            "id": "TXN-TEST-CMP",
            "is_cross_border": True,
            "corridor": "MXN->USD",
            "amount_usd": Decimal("1000"),
        }
        comparison = simulator.generate_route_comparison(txn)
        assert comparison is not None
        assert comparison["card_fee"] == Decimal("60.00")
        assert comparison["stablecoin_fee"] == Decimal("5.00")
        assert comparison["savings_amount"] == Decimal("55.00")

    def test_domestic_has_no_comparison(self, simulator):
        txn = {
            "id": "TXN-DOMESTIC",
            "is_cross_border": False,
            "corridor": None,
            "amount_usd": Decimal("500"),
        }
        assert simulator.generate_route_comparison(txn) is None

    def test_demo_buyers_count(self, simulator):
        buyers = simulator.get_demo_buyers()
        assert len(buyers) == 8
        currencies = {b["currency"] for b in buyers}
        assert currencies == {"MXN", "EUR", "GBP", "USD"}
