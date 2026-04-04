"""Hardcoded supplier catalog for the Instant Supplier Pay demo."""

from __future__ import annotations

DEMO_SUPPLIERS: list[dict] = [
    {
        "id": "SUP_001",
        "name": "Fresh Foods Inc.",
        "category": "produce_protein",
        "payment_terms": "net-30",
        "early_pay_discount": 0.02,  # 2% if paid within 10 days
        "early_pay_days": 10,
        "ingredients": [
            {"name": "chicken_breast", "price_per_unit": 4.50, "unit": "lb", "moq": 20, "lead_time": 1},
            {"name": "ground_beef", "price_per_unit": 5.25, "unit": "lb", "moq": 15, "lead_time": 1},
            {"name": "salmon_fillet", "price_per_unit": 12.00, "unit": "lb", "moq": 10, "lead_time": 1},
            {"name": "shrimp", "price_per_unit": 9.50, "unit": "lb", "moq": 10, "lead_time": 2},
            {"name": "mozzarella", "price_per_unit": 3.75, "unit": "lb", "moq": 10, "lead_time": 1},
            {"name": "romaine_lettuce", "price_per_unit": 1.50, "unit": "head", "moq": 20, "lead_time": 1},
            {"name": "tomatoes", "price_per_unit": 2.00, "unit": "lb", "moq": 15, "lead_time": 1},
            {"name": "onions", "price_per_unit": 1.00, "unit": "lb", "moq": 20, "lead_time": 1},
            {"name": "bell_peppers", "price_per_unit": 1.75, "unit": "each", "moq": 15, "lead_time": 1},
            {"name": "mushrooms", "price_per_unit": 3.00, "unit": "lb", "moq": 10, "lead_time": 1},
            {"name": "parmesan", "price_per_unit": 8.50, "unit": "lb", "moq": 5, "lead_time": 1},
        ],
    },
    {
        "id": "SUP_002",
        "name": "Metro Dry Goods",
        "category": "dry_goods",
        "payment_terms": "net-30",
        "early_pay_discount": 0.015,  # 1.5%
        "early_pay_days": 10,
        "ingredients": [
            {"name": "pizza_dough_flour", "price_per_unit": 0.80, "unit": "lb", "moq": 50, "lead_time": 2},
            {"name": "olive_oil", "price_per_unit": 8.00, "unit": "liter", "moq": 5, "lead_time": 2},
            {"name": "pasta", "price_per_unit": 1.20, "unit": "lb", "moq": 25, "lead_time": 2},
            {"name": "rice", "price_per_unit": 0.90, "unit": "lb", "moq": 25, "lead_time": 2},
            {"name": "canned_tomatoes", "price_per_unit": 1.50, "unit": "can", "moq": 24, "lead_time": 2},
            {"name": "breadcrumbs", "price_per_unit": 1.10, "unit": "lb", "moq": 10, "lead_time": 2},
            {"name": "garlic", "price_per_unit": 0.50, "unit": "head", "moq": 20, "lead_time": 2},
        ],
    },
    {
        "id": "SUP_003",
        "name": "Bay Area Beverages",
        "category": "beverages",
        "payment_terms": "net-30",
        "early_pay_discount": 0.02,
        "early_pay_days": 7,
        "ingredients": [
            {"name": "coca_cola_syrup", "price_per_unit": 45.00, "unit": "box", "moq": 2, "lead_time": 3},
            {"name": "orange_juice", "price_per_unit": 3.50, "unit": "gallon", "moq": 5, "lead_time": 1},
            {"name": "coffee_beans", "price_per_unit": 12.00, "unit": "lb", "moq": 5, "lead_time": 2},
            {"name": "lemonade_mix", "price_per_unit": 5.00, "unit": "lb", "moq": 5, "lead_time": 2},
        ],
    },
]


def get_supplier_by_id(supplier_id: str) -> dict | None:
    """Look up a supplier by ID."""
    for s in DEMO_SUPPLIERS:
        if s["id"] == supplier_id:
            return s
    return None


def find_supplier_for_ingredient(ingredient_name: str) -> tuple[dict, dict] | None:
    """Find the supplier and ingredient entry for a given ingredient name.

    Returns (supplier_dict, ingredient_dict) or None.
    """
    for supplier in DEMO_SUPPLIERS:
        for ing in supplier["ingredients"]:
            if ing["name"] == ingredient_name:
                return supplier, ing
    return None


def get_all_ingredient_names() -> list[str]:
    """Return a flat list of every ingredient name across all suppliers."""
    names: list[str] = []
    for supplier in DEMO_SUPPLIERS:
        for ing in supplier["ingredients"]:
            names.append(ing["name"])
    return names
