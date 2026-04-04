"""Mock supplier API that accepts POs and returns confirmations.

Simulates supplier-side order acceptance for the demo.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.suppliers.catalog import get_supplier_by_id

router = APIRouter(prefix="/api/suppliers", tags=["suppliers-mock"])


# --------------------------------------------------------------------------- #
# Mock in-memory order store
# --------------------------------------------------------------------------- #

_mock_orders: dict[str, dict] = {}


# --------------------------------------------------------------------------- #
# Schemas
# --------------------------------------------------------------------------- #


class SupplierOrderRequest(BaseModel):
    po_id: str
    line_items: list[dict]
    total_amount: float
    payment_method: str = "FIUSD"


class SupplierOrderResponse(BaseModel):
    order_id: str
    supplier_id: str
    po_id: str
    status: str
    estimated_delivery: str
    confirmation_number: str
    message: str


class SupplierOrderStatus(BaseModel):
    order_id: str
    supplier_id: str
    po_id: str
    status: str
    estimated_delivery: str
    created_at: str


# --------------------------------------------------------------------------- #
# Routes
# --------------------------------------------------------------------------- #


@router.post("/{supplier_id}/orders", response_model=SupplierOrderResponse)
async def accept_purchase_order(
    supplier_id: str,
    order: SupplierOrderRequest,
) -> SupplierOrderResponse:
    """Accept a PO from a merchant and return confirmation."""
    supplier = get_supplier_by_id(supplier_id)
    if supplier is None:
        raise HTTPException(status_code=404, detail=f"Supplier {supplier_id} not found")

    order_id = f"SO-{uuid.uuid4().hex[:8].upper()}"
    confirmation = f"CONF-{uuid.uuid4().hex[:6].upper()}"

    # Calculate estimated delivery based on max lead time
    max_lead = 1
    for item in order.line_items:
        for ing in supplier.get("ingredients", []):
            if ing["name"] == item.get("ingredient_name"):
                max_lead = max(max_lead, ing.get("lead_time", 1))

    est_delivery = (datetime.utcnow() + timedelta(days=max_lead)).isoformat()

    mock_record = {
        "order_id": order_id,
        "supplier_id": supplier_id,
        "po_id": order.po_id,
        "status": "ACCEPTED",
        "estimated_delivery": est_delivery,
        "confirmation_number": confirmation,
        "created_at": datetime.utcnow().isoformat(),
        "total_amount": order.total_amount,
    }
    _mock_orders[order_id] = mock_record

    return SupplierOrderResponse(
        order_id=order_id,
        supplier_id=supplier_id,
        po_id=order.po_id,
        status="ACCEPTED",
        estimated_delivery=est_delivery,
        confirmation_number=confirmation,
        message=f"Order accepted by {supplier['name']}. "
                f"FIUSD payment received instantly -- 2% early-pay discount applied.",
    )


@router.get("/{supplier_id}/orders/{order_id}", response_model=SupplierOrderStatus)
async def get_order_status(supplier_id: str, order_id: str) -> SupplierOrderStatus:
    """Get the status of a supplier order."""
    record = _mock_orders.get(order_id)
    if record is None or record["supplier_id"] != supplier_id:
        raise HTTPException(status_code=404, detail="Order not found")

    return SupplierOrderStatus(
        order_id=record["order_id"],
        supplier_id=record["supplier_id"],
        po_id=record["po_id"],
        status=record["status"],
        estimated_delivery=record["estimated_delivery"],
        created_at=record["created_at"],
    )
