"""Pydantic schemas for all API operations."""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


# --------------------------------------------------------------------------- #
# Enums
# --------------------------------------------------------------------------- #


class POStatusEnum(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    PAID = "PAID"
    DELIVERED = "DELIVERED"


class PaymentStatusEnum(str, Enum):
    INITIATED = "INITIATED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


# --------------------------------------------------------------------------- #
# Ingredient & Inventory
# --------------------------------------------------------------------------- #


class IngredientStock(BaseModel):
    ingredient_id: str
    name: str
    unit: str
    current_stock: float
    reorder_point: float
    unit_cost: float
    days_until_reorder: Optional[float] = None
    status: str = "OK"  # OK, LOW, CRITICAL


class InventoryReport(BaseModel):
    merchant_id: str
    timestamp: datetime
    total_ingredients: int
    low_stock_count: int
    critical_count: int
    ingredients: List[IngredientStock]


# --------------------------------------------------------------------------- #
# Predictions
# --------------------------------------------------------------------------- #


class DepletionPrediction(BaseModel):
    ingredient_id: str
    ingredient_name: str
    current_stock: float
    reorder_point: float
    daily_usage_rate: float
    estimated_depletion_date: Optional[datetime] = None
    days_until_depletion: Optional[float] = None
    confidence: float = 0.0


class ReorderRecommendation(BaseModel):
    ingredient_id: str
    ingredient_name: str
    current_stock: float
    reorder_point: float
    recommended_quantity: float
    supplier_id: str
    supplier_name: str
    unit_price: float
    total_cost: float
    lead_time_days: int
    urgency: str  # IMMEDIATE, SOON, PLANNED


class PredictionsResponse(BaseModel):
    merchant_id: str
    predictions: List[DepletionPrediction]
    reorder_recommendations: List[ReorderRecommendation]


# --------------------------------------------------------------------------- #
# Purchase Orders
# --------------------------------------------------------------------------- #


class POLineItemSchema(BaseModel):
    ingredient_id: str
    ingredient_name: str
    quantity: float
    unit_price: float
    total: float


class PurchaseOrderSchema(BaseModel):
    id: str
    merchant_id: str
    supplier_id: str
    supplier_name: str
    status: POStatusEnum
    total_amount: float
    discount_amount: float
    net_amount: float
    line_items: List[POLineItemSchema]
    created_at: datetime


class PurchaseOrderListResponse(BaseModel):
    merchant_id: str
    purchase_orders: List[PurchaseOrderSchema]
    total_value: float
    total_discount: float


# --------------------------------------------------------------------------- #
# Payments
# --------------------------------------------------------------------------- #


class PaymentSchema(BaseModel):
    id: str
    po_id: str
    amount: float
    fiusd_txn_id: Optional[str] = None
    indx_settlement_id: Optional[str] = None
    status: PaymentStatusEnum
    paid_at: Optional[datetime] = None


class PaymentResult(BaseModel):
    payment: PaymentSchema
    purchase_order: PurchaseOrderSchema
    early_pay_discount: float
    savings_vs_card: float
    total_savings: float


# --------------------------------------------------------------------------- #
# Savings
# --------------------------------------------------------------------------- #


class SavingsReport(BaseModel):
    merchant_id: str
    period_days: int
    total_spend: float
    total_early_pay_discounts: float
    total_card_fee_savings: float
    total_savings: float
    savings_pct: float
    po_count: int
    avg_payment_speed_hours: float


# --------------------------------------------------------------------------- #
# Suppliers
# --------------------------------------------------------------------------- #


class SupplierIngredientSchema(BaseModel):
    name: str
    price_per_unit: float
    unit: str
    moq: int
    lead_time: int


class SupplierSchema(BaseModel):
    id: str
    name: str
    category: str
    payment_terms: str
    early_pay_discount: float
    early_pay_days: int
    ingredients: List[SupplierIngredientSchema]


# --------------------------------------------------------------------------- #
# Dashboard
# --------------------------------------------------------------------------- #


class DashboardData(BaseModel):
    merchant_id: str
    merchant_name: str
    inventory: InventoryReport
    predictions: PredictionsResponse
    recent_pos: List[PurchaseOrderSchema]
    savings: SavingsReport
    suppliers: List[SupplierSchema]


# --------------------------------------------------------------------------- #
# Demo triggers
# --------------------------------------------------------------------------- #


class DemoSeedResponse(BaseModel):
    status: str
    merchant_id: str
    menu_items_created: int
    ingredients_created: int
    suppliers_created: int
    sales_generated: int
    message: str


class DemoTriggerResponse(BaseModel):
    status: str
    evaluation: InventoryReport
    purchase_orders_created: List[PurchaseOrderSchema]
    payments: List[PaymentResult]
    savings: SavingsReport
    message: str


class AutoOrderResponse(BaseModel):
    status: str
    purchase_orders: List[PurchaseOrderSchema]
    payments: List[PaymentResult]
    total_savings: float
    message: str


class EvaluateResponse(BaseModel):
    status: str
    inventory: InventoryReport
    predictions: PredictionsResponse
    message: str
