"""Tests for API routes."""

import pytest
from fastapi.testclient import TestClient

from app import create_app
from app.api.routes import get_data_store


@pytest.fixture
def client():
    app = create_app()
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_data_store():
    """Reset the in-memory data store between tests."""
    store = get_data_store()
    store["merchants"].clear()
    store["buyers"].clear()
    store["transactions"].clear()
    store["settlements"].clear()
    store["fx_conversions"].clear()
    store["route_comparisons"].clear()
    yield


class TestHealthEndpoint:
    def test_health_check(self, client):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "cross-border-settlement"
        assert data["demo_mode"] is True


class TestDemoSeeding:
    def test_seed_demo_data(self, client):
        response = client.post("/api/demo/seed")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "seeded"
        assert data["total_transactions"] > 100
        assert data["cross_border_transactions"] > 20
        assert data["merchant"]["name"] == "GlobalTech Store"

    def test_seed_creates_merchant_and_buyers(self, client):
        client.post("/api/demo/seed")
        store = get_data_store()
        assert "MERCHANT_001" in store["merchants"]
        assert len(store["buyers"]) == 8


class TestTransactionEndpoints:
    def test_get_transactions_after_seed(self, client):
        client.post("/api/demo/seed")
        response = client.get("/api/merchants/MERCHANT_001/transactions")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] > 0
        assert len(data["transactions"]) <= 50

    def test_get_cross_border_transactions(self, client):
        client.post("/api/demo/seed")
        response = client.get("/api/merchants/MERCHANT_001/cross-border")
        assert response.status_code == 200
        data = response.json()
        assert data["total_cross_border"] > 0
        for txn in data["transactions"]:
            assert txn["is_cross_border"] is True

    def test_get_cross_border_by_corridor(self, client):
        client.post("/api/demo/seed")
        response = client.get(
            "/api/merchants/MERCHANT_001/cross-border",
            params={"corridor": "MXN->USD"},
        )
        assert response.status_code == 200
        data = response.json()
        for txn in data["transactions"]:
            assert txn["corridor"] == "MXN->USD"

    def test_merchant_not_found(self, client):
        response = client.get("/api/merchants/NONEXISTENT/transactions")
        assert response.status_code == 404


class TestPaymentProcessing:
    def test_process_cross_border_payment(self, client):
        client.post("/api/demo/seed")
        response = client.post(
            "/api/merchants/MERCHANT_001/payment",
            json={
                "buyer_id": "BUYER_MX_001",
                "amount_local": 17500.0,
                "buyer_currency": "MXN",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["detection"]["is_cross_border"] is True
        assert data["detection"]["corridor"] == "MXN->USD"
        assert data["settlement"] is not None
        assert data["route_comparison"] is not None

    def test_process_domestic_payment(self, client):
        client.post("/api/demo/seed")
        response = client.post(
            "/api/merchants/MERCHANT_001/payment",
            json={
                "buyer_id": "BUYER_US_001",
                "amount_local": 500.0,
                "buyer_currency": "USD",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["detection"]["is_cross_border"] is False


class TestFXEndpoints:
    def test_get_fx_rates(self, client):
        response = client.get("/api/fx/rates")
        assert response.status_code == 200
        data = response.json()
        assert len(data["rates"]) >= 4
        currencies = {r["from_currency"] for r in data["rates"]}
        assert "MXN" in currencies
        assert "EUR" in currencies

    def test_lock_fx_rate(self, client):
        response = client.post(
            "/api/fx/lock",
            json={
                "from_currency": "MXN",
                "to_currency": "USD",
                "amount_local": 17500.0,
                "ttl_seconds": 30,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["lock_id"].startswith("FXLOCK-")
        assert data["from_currency"] == "MXN"


class TestAnalytics:
    def test_get_analytics(self, client):
        client.post("/api/demo/seed")
        response = client.get("/api/merchants/MERCHANT_001/analytics")
        assert response.status_code == 200
        data = response.json()
        assert data["merchant_id"] == "MERCHANT_001"
        assert data["total_transactions"] > 0
        assert data["cross_border_transactions"] > 0
        assert len(data["corridors"]) > 0

    def test_get_route_comparisons(self, client):
        client.post("/api/demo/seed")
        response = client.get("/api/merchants/MERCHANT_001/comparisons")
        assert response.status_code == 200
        data = response.json()
        assert data["total_comparisons"] > 0
        assert data["total_savings"] > 0

    def test_get_dashboard(self, client):
        client.post("/api/demo/seed")
        response = client.get("/api/merchants/MERCHANT_001/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert data["merchant_name"] == "GlobalTech Store"
        assert data["headline_stats"]["total_savings_usd"] > 0
        assert data["headline_stats"]["cross_border_pct"] > 0
        assert len(data["fx_rates"]) > 0
        assert len(data["recent_cross_border"]) > 0


class TestLiveTransaction:
    def test_simulate_live_transaction(self, client):
        client.post("/api/demo/seed")
        response = client.post(
            "/api/demo/live-transaction",
            json={
                "buyer_id": "BUYER_EU_001",
                "amount_local": 920.0,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["detection"]["is_cross_border"] is True
        assert data["detection"]["corridor"] == "EUR->USD"

    def test_live_transaction_without_seed(self, client):
        response = client.post(
            "/api/demo/live-transaction",
            json={
                "buyer_id": "BUYER_MX_001",
                "amount_local": 5000.0,
            },
        )
        assert response.status_code in (400, 404)
