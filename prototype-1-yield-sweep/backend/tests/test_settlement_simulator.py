"""
Tests for the settlement simulator.
"""

from datetime import date

import pytest

from app.services.settlement_simulator import SettlementSimulator


class TestSettlementSimulator:
    """Tests for transaction data generation."""

    def test_generate_history_length(self, simulator):
        transactions = simulator.generate_history("TEST_001", days=30)
        # Should have at least 1 transaction per day (settlement)
        assert len(transactions) >= 30

    def test_generate_history_fields(self, simulator):
        transactions = simulator.generate_history("TEST_001", days=7)
        for txn in transactions:
            assert "merchant_id" in txn
            assert "amount" in txn
            assert "type" in txn
            assert "timestamp" in txn
            assert txn["amount"] > 0

    def test_weekend_revenue_higher(self, simulator):
        """Weekend transactions should have higher settlement amounts."""
        transactions = simulator.generate_history("TEST_001", days=60)

        weekday_totals = []
        weekend_totals = []

        for txn in transactions:
            if txn["type"] != "SETTLEMENT":
                continue
            dow = txn["timestamp"].weekday()
            if dow >= 5:
                weekend_totals.append(txn["amount"])
            else:
                weekday_totals.append(txn["amount"])

        avg_weekday = sum(weekday_totals) / max(len(weekday_totals), 1)
        avg_weekend = sum(weekend_totals) / max(len(weekend_totals), 1)

        assert avg_weekend > avg_weekday

    def test_payroll_on_fridays(self, simulator):
        transactions = simulator.generate_history("TEST_001", days=60)
        payroll_txns = [t for t in transactions if t["type"] == "PAYROLL"]

        for txn in payroll_txns:
            assert txn["timestamp"].weekday() == 4  # Friday

    def test_rent_on_first_of_month(self, simulator):
        transactions = simulator.generate_history("TEST_001", days=60)
        rent_txns = [t for t in transactions if t["type"] == "RENT"]

        for txn in rent_txns:
            assert txn["timestamp"].day == 1

    def test_supplier_on_tuesdays(self, simulator):
        transactions = simulator.generate_history("TEST_001", days=60)
        supplier_txns = [t for t in transactions if t["type"] == "SUPPLIER"]

        for txn in supplier_txns:
            assert txn["timestamp"].weekday() == 1  # Tuesday

    def test_running_balance(self, simulator):
        transactions = simulator.generate_history("TEST_001", days=30)
        balance_history = simulator.compute_running_balance(
            transactions, starting_balance=25000.0
        )

        assert len(balance_history) > 0
        assert balance_history[0]["balance"] is not None
        # Balance should have date, balance, inflows, outflows
        for entry in balance_history:
            assert "date" in entry
            assert "balance" in entry
            assert "inflows" in entry
            assert "outflows" in entry

    def test_deterministic_with_seed(self):
        sim1 = SettlementSimulator(seed=42)
        sim2 = SettlementSimulator(seed=42)

        txn1 = sim1.generate_history("TEST_001", days=30)
        txn2 = sim2.generate_history("TEST_001", days=30)

        assert len(txn1) == len(txn2)
        for a, b in zip(txn1, txn2):
            assert a["amount"] == b["amount"]
            assert a["type"] == b["type"]
