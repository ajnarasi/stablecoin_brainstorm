"""FastAPI routes for the Instant Supplier Pay prototype."""

from __future__ import annotations

import logging
import math
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.ml.depletion_predictor import IngredientDepletionPredictor
from app.models.database import (
    BillOfMaterials,
    Ingredient,
    Merchant,
    MenuItem,
    Payment,
    POLineItem,
    PurchaseOrder,
    Sale,
    Supplier,
    SupplierIngredient,
    async_session,
)
from app.models.schemas import (
    AutoOrderResponse,
    DashboardData,
    DemoSeedResponse,
    DemoTriggerResponse,
    EvaluateResponse,
    InventoryReport,
    POStatusEnum,
    PredictionsResponse,
    PurchaseOrderListResponse,
    PurchaseOrderSchema,
    POLineItemSchema,
    SavingsReport,
    SupplierIngredientSchema,
    SupplierSchema,
)
from app.services.procurement_agent import ProcurementAgent
from app.services.sales_simulator import SalesSimulator
from app.suppliers.bom import DEMO_BOM, MENU_PRICES, ORDER_WEIGHTS
from app.suppliers.catalog import DEMO_SUPPLIERS, find_supplier_for_ingredient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["supplier-pay"])

# Shared predictor and agent (initialized at seed time)
_predictor: IngredientDepletionPredictor | None = None
_agent: ProcurementAgent | None = None


def _get_agent() -> ProcurementAgent:
    global _predictor, _agent
    if _agent is None:
        _predictor = IngredientDepletionPredictor()
        _agent = ProcurementAgent(predictor=_predictor)
    return _agent


def _get_predictor() -> IngredientDepletionPredictor:
    global _predictor
    if _predictor is None:
        _predictor = IngredientDepletionPredictor()
    return _predictor


# --------------------------------------------------------------------------- #
# Health
# --------------------------------------------------------------------------- #


@router.get("/health")
async def health() -> dict:
    return {"status": "healthy", "service": "prototype-3-supplier-pay", "port": 8003}


# --------------------------------------------------------------------------- #
# Inventory
# --------------------------------------------------------------------------- #


@router.get("/merchants/{merchant_id}/inventory", response_model=InventoryReport)
async def get_inventory(merchant_id: str) -> InventoryReport:
    """Current ingredient stock levels."""
    agent = _get_agent()
    return await agent.evaluate_inventory(merchant_id)


# --------------------------------------------------------------------------- #
# Predictions
# --------------------------------------------------------------------------- #


@router.get("/merchants/{merchant_id}/predictions", response_model=PredictionsResponse)
async def get_predictions(merchant_id: str) -> PredictionsResponse:
    """Depletion predictions for all ingredients."""
    agent = _get_agent()
    return await agent.get_predictions(merchant_id)


# --------------------------------------------------------------------------- #
# Purchase orders
# --------------------------------------------------------------------------- #


@router.get("/merchants/{merchant_id}/purchase-orders", response_model=PurchaseOrderListResponse)
async def get_purchase_orders(merchant_id: str) -> PurchaseOrderListResponse:
    """PO history."""
    async with async_session() as session:
        result = await session.execute(
            select(PurchaseOrder)
            .where(PurchaseOrder.merchant_id == merchant_id)
            .order_by(PurchaseOrder.created_at.desc())
        )
        pos = result.scalars().all()

    po_schemas: list[PurchaseOrderSchema] = []
    total_value = 0.0
    total_discount = 0.0

    for po in pos:
        # Build line item schemas
        async with async_session() as session:
            li_result = await session.execute(
                select(POLineItem).where(POLineItem.po_id == po.id)
            )
            line_items = li_result.scalars().all()

        li_schemas = []
        for li in line_items:
            async with async_session() as session:
                ing = await session.get(Ingredient, li.ingredient_id)
            li_schemas.append(POLineItemSchema(
                ingredient_id=li.ingredient_id,
                ingredient_name=ing.name if ing else li.ingredient_id,
                quantity=li.quantity,
                unit_price=li.unit_price,
                total=li.total,
            ))

        # Find supplier name
        sup_name = po.supplier_id
        for s in DEMO_SUPPLIERS:
            if s["id"] == po.supplier_id:
                sup_name = s["name"]
                break

        net = round(po.total_amount - po.discount_amount, 2)
        po_schemas.append(PurchaseOrderSchema(
            id=po.id,
            merchant_id=po.merchant_id,
            supplier_id=po.supplier_id,
            supplier_name=sup_name,
            status=POStatusEnum(po.status.value),
            total_amount=po.total_amount,
            discount_amount=po.discount_amount,
            net_amount=net,
            line_items=li_schemas,
            created_at=po.created_at,
        ))

        total_value += po.total_amount
        total_discount += po.discount_amount

    return PurchaseOrderListResponse(
        merchant_id=merchant_id,
        purchase_orders=po_schemas,
        total_value=round(total_value, 2),
        total_discount=round(total_discount, 2),
    )


# --------------------------------------------------------------------------- #
# Evaluate & Auto-order
# --------------------------------------------------------------------------- #


@router.post("/merchants/{merchant_id}/evaluate", response_model=EvaluateResponse)
async def evaluate_inventory(merchant_id: str) -> EvaluateResponse:
    """Trigger inventory evaluation."""
    agent = _get_agent()
    inventory = await agent.evaluate_inventory(merchant_id)
    predictions = await agent.get_predictions(merchant_id)

    return EvaluateResponse(
        status="completed",
        inventory=inventory,
        predictions=predictions,
        message=f"Evaluated {inventory.total_ingredients} ingredients. "
                f"{inventory.critical_count} critical, {inventory.low_stock_count} low.",
    )


@router.post("/merchants/{merchant_id}/auto-order", response_model=AutoOrderResponse)
async def auto_order(merchant_id: str) -> AutoOrderResponse:
    """Trigger AI auto-ordering."""
    agent = _get_agent()
    return await agent.auto_order(merchant_id)


# --------------------------------------------------------------------------- #
# Savings
# --------------------------------------------------------------------------- #


@router.get("/merchants/{merchant_id}/savings", response_model=SavingsReport)
async def get_savings(merchant_id: str, period_days: int = 30) -> SavingsReport:
    """Savings report."""
    agent = _get_agent()
    return await agent.get_savings_report(merchant_id, period_days)


# --------------------------------------------------------------------------- #
# Suppliers
# --------------------------------------------------------------------------- #


@router.get("/merchants/{merchant_id}/suppliers", response_model=list[SupplierSchema])
async def get_suppliers(merchant_id: str) -> list[SupplierSchema]:
    """Supplier catalog."""
    return [
        SupplierSchema(
            id=s["id"],
            name=s["name"],
            category=s["category"],
            payment_terms=s["payment_terms"],
            early_pay_discount=s["early_pay_discount"],
            early_pay_days=s["early_pay_days"],
            ingredients=[
                SupplierIngredientSchema(**ing) for ing in s["ingredients"]
            ],
        )
        for s in DEMO_SUPPLIERS
    ]


# --------------------------------------------------------------------------- #
# Dashboard
# --------------------------------------------------------------------------- #


@router.get("/merchants/{merchant_id}/dashboard", response_model=DashboardData)
async def get_dashboard(merchant_id: str) -> DashboardData:
    """All dashboard data in one call."""
    agent = _get_agent()

    inventory = await agent.evaluate_inventory(merchant_id)
    predictions = await agent.get_predictions(merchant_id)
    savings = await agent.get_savings_report(merchant_id)

    # Recent POs
    po_response = await get_purchase_orders(merchant_id)

    suppliers = [
        SupplierSchema(
            id=s["id"],
            name=s["name"],
            category=s["category"],
            payment_terms=s["payment_terms"],
            early_pay_discount=s["early_pay_discount"],
            early_pay_days=s["early_pay_days"],
            ingredients=[SupplierIngredientSchema(**ing) for ing in s["ingredients"]],
        )
        for s in DEMO_SUPPLIERS
    ]

    # Get merchant name
    async with async_session() as session:
        merchant = await session.get(Merchant, merchant_id)
    merchant_name = merchant.name if merchant else merchant_id

    return DashboardData(
        merchant_id=merchant_id,
        merchant_name=merchant_name,
        inventory=inventory,
        predictions=predictions,
        recent_pos=po_response.purchase_orders[:10],
        savings=savings,
        suppliers=suppliers,
    )


# --------------------------------------------------------------------------- #
# Demo seed & trigger
# --------------------------------------------------------------------------- #


@router.post("/demo/seed", response_model=DemoSeedResponse)
async def seed_demo() -> DemoSeedResponse:
    """Seed demo data: merchant, menu items, ingredients, suppliers, 30 days of sales."""
    global _predictor, _agent

    merchant_id = "MERCH_001"

    async with async_session() as session:
        # Check if already seeded
        existing = await session.get(Merchant, merchant_id)
        if existing:
            # Clear existing data for re-seed
            from app.models.database import Base, engine
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.drop_all)
                await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # 1. Create merchant
        merchant = Merchant(
            id=merchant_id,
            name="Mario's Pizzeria",
            clover_id="CLOVER_MARIO_001",
            config={"auto_order_enabled": True, "reorder_threshold_days": 3},
        )
        session.add(merchant)

        # 2. Create ingredients (from supplier catalog)
        ingredient_map: dict[str, Ingredient] = {}
        ing_counter = 0
        for supplier_data in DEMO_SUPPLIERS:
            for ing_data in supplier_data["ingredients"]:
                if ing_data["name"] not in ingredient_map:
                    ing_counter += 1
                    ing_id = f"ING_{ing_counter:03d}"
                    ingredient = Ingredient(
                        id=ing_id,
                        name=ing_data["name"],
                        unit=ing_data["unit"],
                        current_stock=0.0,  # will be set after usage calc
                        reorder_point=0.0,
                        unit_cost=ing_data["price_per_unit"],
                    )
                    ingredient_map[ing_data["name"]] = ingredient
                    session.add(ingredient)

        # 3. Create menu items and BOM
        menu_item_map: dict[str, MenuItem] = {}
        bom_counter = 0
        categories = {
            "Pizza": ["Margherita Pizza", "Pepperoni Pizza", "BBQ Chicken Pizza", "Veggie Supreme Pizza"],
            "Pasta": ["Pasta Bolognese", "Shrimp Scampi", "Chicken Alfredo", "Mushroom Risotto"],
            "Entree": ["Grilled Salmon", "Chicken Parmesan"],
            "Salad": ["Chicken Caesar Salad", "Garden Salad"],
            "Side": ["Garlic Bread", "Bruschetta", "Mozzarella Sticks"],
            "Beverage": ["Soda (Fountain)", "Fresh OJ", "Coffee", "Lemonade"],
        }

        mi_counter = 0
        for category, items in categories.items():
            for item_name in items:
                if item_name not in DEMO_BOM:
                    continue
                mi_counter += 1
                mi_id = f"MI_{mi_counter:03d}"
                mi = MenuItem(
                    id=mi_id,
                    merchant_id=merchant_id,
                    name=item_name,
                    price=MENU_PRICES.get(item_name, 12.00),
                    category=category,
                )
                menu_item_map[item_name] = mi
                session.add(mi)

                # BOM entries
                for ing_name, qty in DEMO_BOM[item_name].items():
                    ing = ingredient_map.get(ing_name)
                    if ing:
                        bom_counter += 1
                        bom_entry = BillOfMaterials(
                            menu_item_id=mi_id,
                            ingredient_id=ing.id,
                            quantity_per_unit=qty,
                        )
                        session.add(bom_entry)

        # 4. Create suppliers and supplier-ingredient links
        for sup_data in DEMO_SUPPLIERS:
            supplier = Supplier(
                id=sup_data["id"],
                name=sup_data["name"],
                contact=f"{sup_data['name'].lower().replace(' ', '')}@example.com",
                payment_terms=sup_data["payment_terms"],
                early_pay_discount_pct=sup_data["early_pay_discount"],
                early_pay_days=sup_data["early_pay_days"],
            )
            session.add(supplier)

            for ing_data in sup_data["ingredients"]:
                ing = ingredient_map.get(ing_data["name"])
                if ing:
                    si = SupplierIngredient(
                        supplier_id=sup_data["id"],
                        ingredient_id=ing.id,
                        price_per_unit=ing_data["price_per_unit"],
                        lead_time_days=ing_data["lead_time"],
                        moq=ing_data["moq"],
                    )
                    session.add(si)

        # 5. Generate 30 days of sales
        simulator = SalesSimulator(seed=42)
        sales_data = simulator.generate_history(merchant_id, days=30)

        sales_count = 0
        for sale_dict in sales_data:
            mi = menu_item_map.get(sale_dict["menu_item_name"])
            if mi:
                sale = Sale(
                    merchant_id=merchant_id,
                    menu_item_id=mi.id,
                    quantity=sale_dict["quantity"],
                    timestamp=sale_dict["timestamp"],
                )
                session.add(sale)
                sales_count += 1

        await session.commit()

        # 6. Calculate total usage over 30 days and set stock levels
        total_usage = simulator.calculate_ingredient_usage(sales_data)

        # Set current stock = ~3 days remaining for most items (to make demo interesting)
        for ing_name, ing_obj in ingredient_map.items():
            daily_usage = total_usage.get(ing_name, 0) / 30
            # Reorder point = 2 days of usage
            reorder_pt = round(daily_usage * 2, 2)
            # Current stock = random 1-4 days of stock (some critical, some ok)
            import random
            rng = random.Random(hash(ing_name) % 10000)
            days_of_stock = rng.uniform(1.0, 5.0)
            current = round(daily_usage * days_of_stock, 2)

            ing_obj.current_stock = current
            ing_obj.reorder_point = reorder_pt
            session.add(ing_obj)

        await session.commit()

    # 7. Train ML model
    _predictor = IngredientDepletionPredictor()
    _predictor.train(sales_data)
    _agent = ProcurementAgent(predictor=_predictor)

    # Calculate revenue
    daily_rev = simulator.calculate_daily_revenue(sales_data)
    total_rev = sum(daily_rev.values())

    return DemoSeedResponse(
        status="seeded",
        merchant_id=merchant_id,
        menu_items_created=len(menu_item_map),
        ingredients_created=len(ingredient_map),
        suppliers_created=len(DEMO_SUPPLIERS),
        sales_generated=sales_count,
        message=f"Seeded Mario's Pizzeria with {len(menu_item_map)} menu items, "
                f"{len(ingredient_map)} ingredients, {len(DEMO_SUPPLIERS)} suppliers, "
                f"and {sales_count} sales over 30 days (${total_rev:,.0f} revenue). "
                f"ML depletion model trained.",
    )


@router.post("/demo/trigger", response_model=DemoTriggerResponse)
async def trigger_demo() -> DemoTriggerResponse:
    """Trigger full demo flow: evaluate -> auto-order -> pay -> report."""
    agent = _get_agent()
    merchant_id = "MERCH_001"

    # Step 1: Evaluate inventory
    inventory = await agent.evaluate_inventory(merchant_id)

    # Step 2: Auto-order and pay
    auto_result = await agent.auto_order(merchant_id)

    # Step 3: Savings report
    savings = await agent.get_savings_report(merchant_id)

    return DemoTriggerResponse(
        status="completed",
        evaluation=inventory,
        purchase_orders_created=auto_result.purchase_orders,
        payments=auto_result.payments,
        savings=savings,
        message=f"Demo complete. {inventory.critical_count} critical ingredients detected. "
                f"Created {len(auto_result.purchase_orders)} POs, paid instantly in FIUSD. "
                f"Total savings: ${auto_result.total_savings:.2f}",
    )
