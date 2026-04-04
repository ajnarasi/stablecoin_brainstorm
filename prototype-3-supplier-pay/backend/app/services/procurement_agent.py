"""AI procurement agent that monitors inventory and auto-orders from suppliers.

Core business logic for the Instant Supplier Pay demo:
1. Evaluate inventory levels against ML predictions
2. Auto-generate purchase orders grouped by supplier
3. Pay suppliers instantly in FIUSD via Finxact
4. Track early-payment discount savings
"""

from __future__ import annotations

import logging
import math
import uuid
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ml.depletion_predictor import IngredientDepletionPredictor
from app.models.database import (
    Ingredient,
    Payment,
    PaymentStatus,
    POLineItem,
    POStatus,
    PurchaseOrder,
    Sale,
    Supplier,
    SupplierIngredient,
    async_session,
)
from app.models.schemas import (
    AutoOrderResponse,
    DepletionPrediction,
    EvaluateResponse,
    IngredientStock,
    InventoryReport,
    PaymentResult,
    PaymentSchema,
    PaymentStatusEnum,
    POLineItemSchema,
    POStatusEnum,
    PredictionsResponse,
    PurchaseOrderSchema,
    ReorderRecommendation,
    SavingsReport,
)
from app.suppliers.bom import DEMO_BOM
from app.suppliers.catalog import DEMO_SUPPLIERS, find_supplier_for_ingredient

logger = logging.getLogger(__name__)

# Card processing fee that FIUSD eliminates
CARD_FEE_PCT = 0.029  # 2.9% typical card processing


class ProcurementAgent:
    """AI agent that monitors inventory and auto-orders from suppliers."""

    def __init__(self, predictor: IngredientDepletionPredictor | None = None) -> None:
        self.predictor = predictor or IngredientDepletionPredictor()

    # ------------------------------------------------------------------ #
    # Inventory evaluation
    # ------------------------------------------------------------------ #

    async def evaluate_inventory(self, merchant_id: str) -> InventoryReport:
        """Check all ingredient levels against predictions."""
        async with async_session() as session:
            result = await session.execute(select(Ingredient))
            ingredients = result.scalars().all()

        items: list[IngredientStock] = []
        low_count = 0
        critical_count = 0

        for ing in ingredients:
            prediction = self.predictor.predict_depletion(
                ingredient_name=ing.name,
                current_stock=ing.current_stock,
                reorder_point=ing.reorder_point,
            )
            days_left = prediction.get("days_until_depletion")

            if ing.current_stock <= ing.reorder_point:
                status = "CRITICAL"
                critical_count += 1
            elif days_left is not None and days_left <= 3:
                status = "LOW"
                low_count += 1
            else:
                status = "OK"

            items.append(IngredientStock(
                ingredient_id=ing.id,
                name=ing.name,
                unit=ing.unit,
                current_stock=round(ing.current_stock, 2),
                reorder_point=ing.reorder_point,
                unit_cost=ing.unit_cost,
                days_until_reorder=round(days_left, 1) if days_left is not None else None,
                status=status,
            ))

        return InventoryReport(
            merchant_id=merchant_id,
            timestamp=datetime.utcnow(),
            total_ingredients=len(items),
            low_stock_count=low_count,
            critical_count=critical_count,
            ingredients=items,
        )

    # ------------------------------------------------------------------ #
    # Predictions
    # ------------------------------------------------------------------ #

    async def get_predictions(self, merchant_id: str) -> PredictionsResponse:
        """Get depletion predictions and reorder recommendations."""
        async with async_session() as session:
            result = await session.execute(select(Ingredient))
            ingredients = result.scalars().all()

        ing_dicts = [
            {
                "id": ing.id,
                "name": ing.name,
                "current_stock": ing.current_stock,
                "reorder_point": ing.reorder_point,
                "unit": ing.unit,
            }
            for ing in ingredients
        ]

        predictions: list[DepletionPrediction] = []
        for ing in ingredients:
            pred = self.predictor.predict_depletion(
                ingredient_name=ing.name,
                current_stock=ing.current_stock,
                reorder_point=ing.reorder_point,
            )
            predictions.append(DepletionPrediction(
                ingredient_id=ing.id,
                ingredient_name=ing.name,
                current_stock=round(ing.current_stock, 2),
                reorder_point=ing.reorder_point,
                daily_usage_rate=pred["daily_usage_rate"],
                estimated_depletion_date=pred.get("estimated_depletion_date"),
                days_until_depletion=pred.get("days_until_depletion"),
                confidence=pred["confidence"],
            ))

        recs_raw = self.predictor.get_reorder_recommendations(ing_dicts)
        recommendations = [
            ReorderRecommendation(**r) for r in recs_raw
        ]

        return PredictionsResponse(
            merchant_id=merchant_id,
            predictions=predictions,
            reorder_recommendations=recommendations,
        )

    # ------------------------------------------------------------------ #
    # Purchase order generation
    # ------------------------------------------------------------------ #

    async def generate_purchase_orders(self, merchant_id: str) -> list[PurchaseOrderSchema]:
        """Auto-generate POs for ingredients below reorder threshold.

        Groups line items by supplier to minimize orders.
        Applies MOQ constraints.
        Calculates early-payment discount opportunity.
        """
        predictions = await self.get_predictions(merchant_id)
        if not predictions.reorder_recommendations:
            return []

        # Group recommendations by supplier
        supplier_groups: dict[str, list[ReorderRecommendation]] = {}
        for rec in predictions.reorder_recommendations:
            supplier_groups.setdefault(rec.supplier_id, []).append(rec)

        created_pos: list[PurchaseOrderSchema] = []

        async with async_session() as session:
            for supplier_id, recs in supplier_groups.items():
                # Look up supplier discount info
                sup_data = None
                for s in DEMO_SUPPLIERS:
                    if s["id"] == supplier_id:
                        sup_data = s
                        break
                if sup_data is None:
                    continue

                po_id = f"PO-{uuid.uuid4().hex[:8].upper()}"
                line_items: list[POLineItem] = []
                line_item_schemas: list[POLineItemSchema] = []
                total = 0.0

                for rec in recs:
                    line_total = round(rec.recommended_quantity * rec.unit_price, 2)
                    total += line_total

                    line_items.append(POLineItem(
                        po_id=po_id,
                        ingredient_id=rec.ingredient_id,
                        quantity=rec.recommended_quantity,
                        unit_price=rec.unit_price,
                        total=line_total,
                    ))
                    line_item_schemas.append(POLineItemSchema(
                        ingredient_id=rec.ingredient_id,
                        ingredient_name=rec.ingredient_name,
                        quantity=rec.recommended_quantity,
                        unit_price=rec.unit_price,
                        total=line_total,
                    ))

                # Calculate early-payment discount
                discount_pct = sup_data.get("early_pay_discount", 0.0)
                discount_amount = round(total * discount_pct, 2)
                net_amount = round(total - discount_amount, 2)

                po = PurchaseOrder(
                    id=po_id,
                    merchant_id=merchant_id,
                    supplier_id=supplier_id,
                    status=POStatus.PENDING,
                    total_amount=total,
                    discount_amount=discount_amount,
                    created_at=datetime.utcnow(),
                )

                session.add(po)
                for li in line_items:
                    session.add(li)
                await session.commit()

                po_schema = PurchaseOrderSchema(
                    id=po_id,
                    merchant_id=merchant_id,
                    supplier_id=supplier_id,
                    supplier_name=sup_data["name"],
                    status=POStatusEnum.PENDING,
                    total_amount=total,
                    discount_amount=discount_amount,
                    net_amount=net_amount,
                    line_items=line_item_schemas,
                    created_at=po.created_at,
                )
                created_pos.append(po_schema)

        logger.info(
            "Generated %d purchase orders for merchant %s",
            len(created_pos),
            merchant_id,
        )
        return created_pos

    # ------------------------------------------------------------------ #
    # Payment execution
    # ------------------------------------------------------------------ #

    async def execute_payment(self, po: PurchaseOrderSchema) -> PaymentResult:
        """Pay supplier instantly in FIUSD via Finxact.

        Simulates the payment flow:
        1. Debit merchant Finxact account
        2. Credit supplier Finxact account
        3. Settle supplier in USD via INDX
        4. Record early-payment discount captured
        """
        payment_id = f"PAY-{uuid.uuid4().hex[:8].upper()}"
        fiusd_txn_id = f"FIUSD-{uuid.uuid4().hex[:12].upper()}"
        indx_settlement_id = f"INDX-{uuid.uuid4().hex[:10].upper()}"

        net_amount = po.net_amount
        paid_at = datetime.utcnow()

        async with async_session() as session:
            # Create payment record
            payment = Payment(
                id=payment_id,
                po_id=po.id,
                amount=net_amount,
                fiusd_txn_id=fiusd_txn_id,
                indx_settlement_id=indx_settlement_id,
                status=PaymentStatus.COMPLETED,
                paid_at=paid_at,
            )
            session.add(payment)

            # Update PO status
            po_record = await session.get(PurchaseOrder, po.id)
            if po_record:
                po_record.status = POStatus.PAID

            # Update ingredient stock levels (simulate delivery)
            for li in po.line_items:
                ing = await session.get(Ingredient, li.ingredient_id)
                if ing:
                    ing.current_stock += li.quantity

            await session.commit()

        # Calculate savings
        card_fee_savings = round(po.total_amount * CARD_FEE_PCT, 2)
        total_savings = round(po.discount_amount + card_fee_savings, 2)

        payment_schema = PaymentSchema(
            id=payment_id,
            po_id=po.id,
            amount=net_amount,
            fiusd_txn_id=fiusd_txn_id,
            indx_settlement_id=indx_settlement_id,
            status=PaymentStatusEnum.COMPLETED,
            paid_at=paid_at,
        )

        # Update the PO schema status
        paid_po = po.model_copy(update={"status": POStatusEnum.PAID})

        return PaymentResult(
            payment=payment_schema,
            purchase_order=paid_po,
            early_pay_discount=po.discount_amount,
            savings_vs_card=card_fee_savings,
            total_savings=total_savings,
        )

    # ------------------------------------------------------------------ #
    # Savings report
    # ------------------------------------------------------------------ #

    async def get_savings_report(
        self,
        merchant_id: str,
        period_days: int = 30,
    ) -> SavingsReport:
        """Calculate total savings from early-payment discounts and eliminated card fees."""
        cutoff = datetime.utcnow() - timedelta(days=period_days)

        async with async_session() as session:
            result = await session.execute(
                select(PurchaseOrder).where(
                    PurchaseOrder.merchant_id == merchant_id,
                    PurchaseOrder.created_at >= cutoff,
                )
            )
            pos = result.scalars().all()

        total_spend = sum(po.total_amount for po in pos)
        total_discounts = sum(po.discount_amount for po in pos)
        total_card_savings = round(total_spend * CARD_FEE_PCT, 2)
        total_savings = round(total_discounts + total_card_savings, 2)
        savings_pct = round((total_savings / total_spend * 100) if total_spend > 0 else 0, 2)

        # Avg payment speed: instant (simulated as < 1 second)
        avg_speed = 0.5 if pos else 0.0

        return SavingsReport(
            merchant_id=merchant_id,
            period_days=period_days,
            total_spend=round(total_spend, 2),
            total_early_pay_discounts=round(total_discounts, 2),
            total_card_fee_savings=total_card_savings,
            total_savings=total_savings,
            savings_pct=savings_pct,
            po_count=len(pos),
            avg_payment_speed_hours=avg_speed,
        )

    # ------------------------------------------------------------------ #
    # Full auto-order flow
    # ------------------------------------------------------------------ #

    async def auto_order(self, merchant_id: str) -> AutoOrderResponse:
        """Run the complete auto-order flow: evaluate -> generate POs -> pay."""
        pos = await self.generate_purchase_orders(merchant_id)

        payments: list[PaymentResult] = []
        total_savings = 0.0

        for po in pos:
            result = await self.execute_payment(po)
            payments.append(result)
            total_savings += result.total_savings

        return AutoOrderResponse(
            status="completed",
            purchase_orders=pos,
            payments=payments,
            total_savings=round(total_savings, 2),
            message=f"Created {len(pos)} POs and processed {len(payments)} instant FIUSD payments. "
                    f"Total savings: ${total_savings:.2f}",
        )
