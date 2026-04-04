"""SQLAlchemy async models for the Instant Supplier Pay prototype.

Uses aiosqlite for zero-dependency demo (no Postgres required).
"""

from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, relationship

DATABASE_URL = "sqlite+aiosqlite:///./supplier_pay_demo.db"

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


# --------------------------------------------------------------------------- #
# Enums
# --------------------------------------------------------------------------- #


class POStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    PAID = "PAID"
    DELIVERED = "DELIVERED"


class PaymentStatus(str, enum.Enum):
    INITIATED = "INITIATED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


# --------------------------------------------------------------------------- #
# Tables
# --------------------------------------------------------------------------- #


class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    clover_id = Column(String, nullable=True)
    config = Column(JSON, default=dict)
    created_at = Column(DateTime, default=func.now())

    menu_items = relationship("MenuItem", back_populates="merchant", lazy="selectin")
    sales = relationship("Sale", back_populates="merchant", lazy="selectin")
    purchase_orders = relationship("PurchaseOrder", back_populates="merchant", lazy="selectin")


class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(String, primary_key=True)
    merchant_id = Column(String, ForeignKey("merchants.id"), nullable=False)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    category = Column(String, nullable=True)

    merchant = relationship("Merchant", back_populates="menu_items")
    bom_entries = relationship("BillOfMaterials", back_populates="menu_item", lazy="selectin")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    unit = Column(String, nullable=False)
    current_stock = Column(Float, nullable=False, default=0.0)
    reorder_point = Column(Float, nullable=False, default=0.0)
    unit_cost = Column(Float, nullable=False, default=0.0)

    bom_entries = relationship("BillOfMaterials", back_populates="ingredient", lazy="selectin")
    supplier_ingredients = relationship("SupplierIngredient", back_populates="ingredient", lazy="selectin")


class BillOfMaterials(Base):
    __tablename__ = "bill_of_materials"

    id = Column(Integer, primary_key=True, autoincrement=True)
    menu_item_id = Column(String, ForeignKey("menu_items.id"), nullable=False)
    ingredient_id = Column(String, ForeignKey("ingredients.id"), nullable=False)
    quantity_per_unit = Column(Float, nullable=False)

    menu_item = relationship("MenuItem", back_populates="bom_entries")
    ingredient = relationship("Ingredient", back_populates="bom_entries")


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, autoincrement=True)
    merchant_id = Column(String, ForeignKey("merchants.id"), nullable=False)
    menu_item_id = Column(String, ForeignKey("menu_items.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    timestamp = Column(DateTime, nullable=False)

    merchant = relationship("Merchant", back_populates="sales")
    menu_item = relationship("MenuItem")


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    contact = Column(String, nullable=True)
    payment_terms = Column(String, nullable=False, default="net-30")
    early_pay_discount_pct = Column(Float, nullable=False, default=0.0)
    early_pay_days = Column(Integer, nullable=False, default=10)

    supplier_ingredients = relationship("SupplierIngredient", back_populates="supplier", lazy="selectin")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier", lazy="selectin")


class SupplierIngredient(Base):
    __tablename__ = "supplier_ingredients"

    id = Column(Integer, primary_key=True, autoincrement=True)
    supplier_id = Column(String, ForeignKey("suppliers.id"), nullable=False)
    ingredient_id = Column(String, ForeignKey("ingredients.id"), nullable=False)
    price_per_unit = Column(Float, nullable=False)
    lead_time_days = Column(Integer, nullable=False, default=1)
    moq = Column(Integer, nullable=False, default=1)

    supplier = relationship("Supplier", back_populates="supplier_ingredients")
    ingredient = relationship("Ingredient", back_populates="supplier_ingredients")


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(String, primary_key=True)
    merchant_id = Column(String, ForeignKey("merchants.id"), nullable=False)
    supplier_id = Column(String, ForeignKey("suppliers.id"), nullable=False)
    status = Column(Enum(POStatus), nullable=False, default=POStatus.PENDING)
    total_amount = Column(Float, nullable=False, default=0.0)
    discount_amount = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=func.now())

    merchant = relationship("Merchant", back_populates="purchase_orders")
    supplier = relationship("Supplier", back_populates="purchase_orders")
    line_items = relationship("POLineItem", back_populates="purchase_order", lazy="selectin")
    payment = relationship("Payment", back_populates="purchase_order", uselist=False, lazy="selectin")


class POLineItem(Base):
    __tablename__ = "po_line_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    po_id = Column(String, ForeignKey("purchase_orders.id"), nullable=False)
    ingredient_id = Column(String, ForeignKey("ingredients.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    total = Column(Float, nullable=False)

    purchase_order = relationship("PurchaseOrder", back_populates="line_items")
    ingredient = relationship("Ingredient")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True)
    po_id = Column(String, ForeignKey("purchase_orders.id"), nullable=False)
    amount = Column(Float, nullable=False)
    fiusd_txn_id = Column(String, nullable=True)
    indx_settlement_id = Column(String, nullable=True)
    status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.INITIATED)
    paid_at = Column(DateTime, nullable=True)

    purchase_order = relationship("PurchaseOrder", back_populates="payment")


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #


async def create_tables() -> None:
    """Create all tables (idempotent)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncSession:
    """Yield an async session (for use in FastAPI Depends)."""
    async with async_session() as session:
        yield session
