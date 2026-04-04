"""Bill of Materials for Mario's Pizzeria demo menu.

Maps each menu item to its ingredient requirements (quantity per single
serving in the ingredient's native unit).
"""

from __future__ import annotations

# --------------------------------------------------------------------------- #
# BOM: menu_item_name -> {ingredient_name: qty_per_serving}
# --------------------------------------------------------------------------- #

DEMO_BOM: dict[str, dict[str, float]] = {
    # --- Pizzas (35% of orders) ---
    "Margherita Pizza": {
        "pizza_dough_flour": 0.50,
        "mozzarella": 0.30,
        "canned_tomatoes": 0.25,
        "olive_oil": 0.02,
        "garlic": 0.10,
    },
    "Pepperoni Pizza": {
        "pizza_dough_flour": 0.50,
        "mozzarella": 0.35,
        "canned_tomatoes": 0.25,
        "olive_oil": 0.02,
        "ground_beef": 0.15,  # pepperoni sub in demo
    },
    "BBQ Chicken Pizza": {
        "pizza_dough_flour": 0.50,
        "mozzarella": 0.30,
        "chicken_breast": 0.25,
        "onions": 0.10,
        "olive_oil": 0.02,
    },
    "Veggie Supreme Pizza": {
        "pizza_dough_flour": 0.50,
        "mozzarella": 0.30,
        "bell_peppers": 0.50,
        "mushrooms": 0.15,
        "onions": 0.10,
        "tomatoes": 0.15,
        "olive_oil": 0.02,
        "canned_tomatoes": 0.25,
    },

    # --- Pastas ---
    "Pasta Bolognese": {
        "pasta": 0.40,
        "ground_beef": 0.35,
        "canned_tomatoes": 0.30,
        "olive_oil": 0.02,
        "onions": 0.05,
        "garlic": 0.10,
    },
    "Shrimp Scampi": {
        "shrimp": 0.40,
        "pasta": 0.30,
        "olive_oil": 0.04,
        "garlic": 0.15,
    },
    "Chicken Alfredo": {
        "chicken_breast": 0.30,
        "pasta": 0.40,
        "parmesan": 0.08,
        "olive_oil": 0.02,
        "garlic": 0.10,
    },
    "Mushroom Risotto": {
        "rice": 0.35,
        "mushrooms": 0.25,
        "parmesan": 0.06,
        "olive_oil": 0.03,
        "onions": 0.05,
    },

    # --- Proteins / Entrees ---
    "Grilled Salmon": {
        "salmon_fillet": 0.50,
        "rice": 0.30,
        "olive_oil": 0.02,
    },
    "Chicken Parmesan": {
        "chicken_breast": 0.35,
        "mozzarella": 0.15,
        "canned_tomatoes": 0.20,
        "breadcrumbs": 0.10,
        "pasta": 0.30,
        "olive_oil": 0.03,
    },

    # --- Salads ---
    "Chicken Caesar Salad": {
        "chicken_breast": 0.30,
        "romaine_lettuce": 0.50,
        "parmesan": 0.04,
        "olive_oil": 0.03,
        "breadcrumbs": 0.05,
    },
    "Garden Salad": {
        "romaine_lettuce": 0.40,
        "tomatoes": 0.15,
        "onions": 0.05,
        "bell_peppers": 0.25,
        "olive_oil": 0.02,
    },

    # --- Sides ---
    "Garlic Bread": {
        "pizza_dough_flour": 0.20,
        "garlic": 0.15,
        "olive_oil": 0.03,
        "parmesan": 0.02,
    },
    "Bruschetta": {
        "pizza_dough_flour": 0.15,
        "tomatoes": 0.20,
        "olive_oil": 0.02,
        "garlic": 0.10,
    },
    "Mozzarella Sticks": {
        "mozzarella": 0.20,
        "breadcrumbs": 0.10,
        "canned_tomatoes": 0.10,
        "olive_oil": 0.05,
    },

    # --- Beverages ---
    "Soda (Fountain)": {
        "coca_cola_syrup": 0.01,
    },
    "Fresh OJ": {
        "orange_juice": 0.06,
    },
    "Coffee": {
        "coffee_beans": 0.03,
    },
    "Lemonade": {
        "lemonade_mix": 0.04,
    },
}

# Menu prices used for revenue simulation
MENU_PRICES: dict[str, float] = {
    "Margherita Pizza": 14.99,
    "Pepperoni Pizza": 16.99,
    "BBQ Chicken Pizza": 17.99,
    "Veggie Supreme Pizza": 15.99,
    "Pasta Bolognese": 15.99,
    "Shrimp Scampi": 19.99,
    "Chicken Alfredo": 16.99,
    "Mushroom Risotto": 14.99,
    "Grilled Salmon": 22.99,
    "Chicken Parmesan": 17.99,
    "Chicken Caesar Salad": 13.99,
    "Garden Salad": 9.99,
    "Garlic Bread": 5.99,
    "Bruschetta": 8.99,
    "Mozzarella Sticks": 9.99,
    "Soda (Fountain)": 2.99,
    "Fresh OJ": 4.99,
    "Coffee": 3.49,
    "Lemonade": 3.99,
}

# Order-frequency weights (must sum to 1.0). Pizzas dominate.
ORDER_WEIGHTS: dict[str, float] = {
    "Margherita Pizza": 0.12,
    "Pepperoni Pizza": 0.13,
    "BBQ Chicken Pizza": 0.06,
    "Veggie Supreme Pizza": 0.05,
    "Pasta Bolognese": 0.08,
    "Shrimp Scampi": 0.04,
    "Chicken Alfredo": 0.06,
    "Mushroom Risotto": 0.03,
    "Grilled Salmon": 0.04,
    "Chicken Parmesan": 0.06,
    "Chicken Caesar Salad": 0.06,
    "Garden Salad": 0.03,
    "Garlic Bread": 0.05,
    "Bruschetta": 0.03,
    "Mozzarella Sticks": 0.04,
    "Soda (Fountain)": 0.05,
    "Fresh OJ": 0.03,
    "Coffee": 0.02,
    "Lemonade": 0.02,
}


def get_menu_items() -> list[str]:
    """Return all menu item names."""
    return list(DEMO_BOM.keys())


def get_ingredients_for_item(item_name: str) -> dict[str, float]:
    """Return ingredient -> qty mapping for a menu item."""
    return DEMO_BOM.get(item_name, {})
