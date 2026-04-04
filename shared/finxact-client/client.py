"""Finxact REST API client for Fiserv crypto prototypes.

Provides an async Python SDK wrapping Finxact's core banking API for
account management, position tracking, sweep operations, and B2B transfers.
Supports a demo_mode that returns pre-computed realistic responses
without hitting the actual API.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

import httpx

from .exceptions import (
    FinxactAPIError,
    FinxactAuthenticationError,
    FinxactConnectionError,
    FinxactNotFoundError,
    FinxactRateLimitError,
    FinxactTimeoutError,
    FinxactValidationError,
    InsufficientFundsError,
)
from .models import (
    Account,
    AccountStatus,
    Balance,
    Position,
    PositionType,
    SweepDirection,
    SweepResult,
    TransferResult,
    TransferStatus,
)

logger = logging.getLogger(__name__)

_REQUEST_TIMEOUT_SECONDS = 30.0


# ---------------------------------------------------------------------------
# Demo / mock data
# ---------------------------------------------------------------------------

def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uid(prefix: str = "") -> str:
    short = uuid.uuid4().hex[:12]
    return f"{prefix}{short}" if prefix else short


_DEMO_ACCOUNTS: dict[str, Account] = {
    "ACCT_MARIO_001": Account(
        account_id="ACCT_MARIO_001",
        account_name="Mario's Pizzeria - Operating",
        account_type="DDA",
        status=AccountStatus.ACTIVE,
        currency="USD",
        asset="FIUSD",
        owner_id="DEMO_MERCHANT_001",
        created_at=datetime(2024, 6, 15, tzinfo=timezone.utc),
    ),
    "ACCT_MARIO_YIELD": Account(
        account_id="ACCT_MARIO_YIELD",
        account_name="Mario's Pizzeria - Yield Pool",
        account_type="YIELD",
        status=AccountStatus.ACTIVE,
        currency="USD",
        asset="FIUSD",
        owner_id="DEMO_MERCHANT_001",
        created_at=datetime(2024, 6, 15, tzinfo=timezone.utc),
    ),
    "ACCT_SUPPLIER_FLOUR": Account(
        account_id="ACCT_SUPPLIER_FLOUR",
        account_name="Roma Flour Co. - Receivables",
        account_type="DDA",
        status=AccountStatus.ACTIVE,
        currency="USD",
        asset="FIUSD",
        owner_id="SUPPLIER_ROMA_001",
        created_at=datetime(2024, 7, 1, tzinfo=timezone.utc),
    ),
    "ACCT_SUPPLIER_CHEESE": Account(
        account_id="ACCT_SUPPLIER_CHEESE",
        account_name="Napoli Cheese Imports - Receivables",
        account_type="DDA",
        status=AccountStatus.ACTIVE,
        currency="USD",
        asset="FIUSD",
        owner_id="SUPPLIER_NAPOLI_001",
        created_at=datetime(2024, 7, 10, tzinfo=timezone.utc),
    ),
}

_DEMO_BALANCES: dict[str, Balance] = {
    "ACCT_MARIO_001": Balance(
        account_id="ACCT_MARIO_001",
        total=Decimal("847523.50"),
        available=Decimal("547523.50"),
        yield_allocated=Decimal("300000.00"),
        reserve_held=Decimal("0"),
        pending_in=Decimal("12450.00"),
        pending_out=Decimal("8750.00"),
        currency="USD",
    ),
    "ACCT_MARIO_YIELD": Balance(
        account_id="ACCT_MARIO_YIELD",
        total=Decimal("300000.00"),
        available=Decimal("0"),
        yield_allocated=Decimal("300000.00"),
        currency="USD",
    ),
    "ACCT_SUPPLIER_FLOUR": Balance(
        account_id="ACCT_SUPPLIER_FLOUR",
        total=Decimal("125000.00"),
        available=Decimal("125000.00"),
        currency="USD",
    ),
    "ACCT_SUPPLIER_CHEESE": Balance(
        account_id="ACCT_SUPPLIER_CHEESE",
        total=Decimal("89750.00"),
        available=Decimal("89750.00"),
        currency="USD",
    ),
}

_DEMO_POSITIONS: dict[str, list[Position]] = {
    "ACCT_MARIO_001": [
        Position(
            position_id="POS_MARIO_DEMAND",
            account_id="ACCT_MARIO_001",
            position_type=PositionType.DEMAND,
            amount=Decimal("547523.50"),
            asset="FIUSD",
        ),
        Position(
            position_id="POS_MARIO_YIELD",
            account_id="ACCT_MARIO_001",
            position_type=PositionType.YIELD,
            amount=Decimal("300000.00"),
            asset="FIUSD",
            apy=Decimal("4.25"),
            accrued_interest=Decimal("1041.10"),
        ),
    ],
    "ACCT_SUPPLIER_FLOUR": [
        Position(
            position_id="POS_FLOUR_DEMAND",
            account_id="ACCT_SUPPLIER_FLOUR",
            position_type=PositionType.DEMAND,
            amount=Decimal("125000.00"),
            asset="FIUSD",
        ),
    ],
    "ACCT_SUPPLIER_CHEESE": [
        Position(
            position_id="POS_CHEESE_DEMAND",
            account_id="ACCT_SUPPLIER_CHEESE",
            position_type=PositionType.DEMAND,
            amount=Decimal("89750.00"),
            asset="FIUSD",
        ),
    ],
}


# ---------------------------------------------------------------------------
# Client
# ---------------------------------------------------------------------------

class FinxactClient:
    """Async client for the Finxact core-banking REST API.

    Parameters
    ----------
    base_url:
        Root URL of the Finxact API (e.g., ``https://api.finxact.com/v1``).
    api_key:
        Bearer token for API authentication.
    demo_mode:
        When ``True``, return pre-computed mock data instead of making
        real HTTP calls.  Useful for demos, testing, and local development.
    timeout:
        Request timeout in seconds.  Defaults to 30.
    """

    def __init__(
        self,
        base_url: str,
        api_key: str,
        demo_mode: bool = False,
        timeout: float = _REQUEST_TIMEOUT_SECONDS,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.demo_mode = demo_mode
        self._timeout = timeout
        self._client: httpx.AsyncClient | None = None

    # -- lifecycle -----------------------------------------------------------

    async def _get_client(self) -> httpx.AsyncClient:
        """Lazily create the underlying httpx client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "X-Client": "fiserv-crypto-prototype",
                },
                timeout=httpx.Timeout(self._timeout),
            )
        return self._client

    async def close(self) -> None:
        """Close the underlying HTTP client."""
        if self._client is not None and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def __aenter__(self) -> FinxactClient:
        return self

    async def __aexit__(self, *exc: object) -> None:
        await self.close()

    # -- low-level HTTP helpers ----------------------------------------------

    async def _request(
        self,
        method: str,
        path: str,
        *,
        json: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Execute an HTTP request and return the parsed JSON body.

        Raises structured exceptions for common error codes.
        """
        client = await self._get_client()
        try:
            response = await client.request(method, path, json=json, params=params)
        except httpx.TimeoutException as exc:
            raise FinxactTimeoutError(self._timeout, exc) from exc
        except httpx.ConnectError as exc:
            raise FinxactConnectionError(original_error=exc) from exc

        request_id = response.headers.get("x-request-id")

        if response.status_code == 200:
            return response.json()

        body = {}
        try:
            body = response.json()
        except Exception:
            pass

        if response.status_code in (401, 403):
            raise FinxactAuthenticationError(
                response_body=body, request_id=request_id,
            )
        if response.status_code == 404:
            raise FinxactNotFoundError(
                resource_type="resource", resource_id=path,
                response_body=body, request_id=request_id,
            )
        if response.status_code == 429:
            retry = response.headers.get("retry-after")
            raise FinxactRateLimitError(
                retry_after_seconds=float(retry) if retry else None,
                response_body=body, request_id=request_id,
            )
        raise FinxactAPIError(
            message=f"API error {response.status_code}: {body.get('message', '')}",
            status_code=response.status_code,
            response_body=body,
            request_id=request_id,
        )

    # -- Account operations --------------------------------------------------

    async def get_account(self, account_id: str) -> Account:
        """Retrieve account details by ID.

        Parameters
        ----------
        account_id:
            The Finxact account identifier.

        Returns
        -------
        Account
            Populated account model.

        Raises
        ------
        FinxactNotFoundError
            If the account does not exist.
        """
        if not account_id:
            raise FinxactValidationError("account_id must not be empty", field="account_id")

        if self.demo_mode:
            account = _DEMO_ACCOUNTS.get(account_id)
            if account is None:
                raise FinxactNotFoundError("Account", account_id)
            return account

        data = await self._request("GET", f"/accounts/{account_id}")
        return Account.model_validate(data)

    async def get_balance(self, account_id: str) -> Balance:
        """Get the current balance breakdown for an account.

        Parameters
        ----------
        account_id:
            The Finxact account identifier.

        Returns
        -------
        Balance
            Balance object with demand, yield, reserve, and pending amounts.
        """
        if not account_id:
            raise FinxactValidationError("account_id must not be empty", field="account_id")

        if self.demo_mode:
            balance = _DEMO_BALANCES.get(account_id)
            if balance is None:
                raise FinxactNotFoundError("Balance", account_id)
            return balance

        data = await self._request("GET", f"/accounts/{account_id}/balance")
        return Balance.model_validate(data)

    # -- Position operations -------------------------------------------------

    async def create_position(
        self,
        account_id: str,
        position_type: str,
        amount: Decimal,
    ) -> Position:
        """Create a new position on an account.

        Parameters
        ----------
        account_id:
            Target account.
        position_type:
            One of ``demand``, ``yield``, ``reserve``, ``settlement``.
        amount:
            Initial position amount in the account's asset.

        Returns
        -------
        Position
            The newly created position.
        """
        if amount <= 0:
            raise FinxactValidationError(
                "Amount must be positive", field="amount", value=str(amount),
            )

        pos_type = PositionType(position_type)

        if self.demo_mode:
            return Position(
                position_id=_uid("POS_"),
                account_id=account_id,
                position_type=pos_type,
                amount=amount,
                asset="FIUSD",
                apy=Decimal("4.25") if pos_type == PositionType.YIELD else None,
            )

        data = await self._request(
            "POST",
            f"/accounts/{account_id}/positions",
            json={
                "positionType": position_type,
                "amount": str(amount),
            },
        )
        return Position.model_validate(data)

    async def get_positions(self, account_id: str) -> list[Position]:
        """List all positions for an account.

        Parameters
        ----------
        account_id:
            The Finxact account identifier.

        Returns
        -------
        list[Position]
            All positions (demand, yield, reserve, settlement) on the account.
        """
        if self.demo_mode:
            return _DEMO_POSITIONS.get(account_id, [])

        data = await self._request("GET", f"/accounts/{account_id}/positions")
        return [Position.model_validate(p) for p in data.get("positions", [])]

    async def transfer_position(
        self,
        from_account: str,
        to_account: str,
        amount: Decimal,
        asset: str = "FIUSD",
    ) -> TransferResult:
        """Transfer an asset amount between two accounts.

        Parameters
        ----------
        from_account:
            Source account ID.
        to_account:
            Destination account ID.
        amount:
            Transfer amount.
        asset:
            Asset code (default ``FIUSD``).

        Returns
        -------
        TransferResult
            Details of the completed transfer.
        """
        if amount <= 0:
            raise FinxactValidationError(
                "Transfer amount must be positive", field="amount", value=str(amount),
            )
        if from_account == to_account:
            raise FinxactValidationError(
                "Source and destination accounts must differ",
                field="from_account",
            )

        if self.demo_mode:
            src_balance = _DEMO_BALANCES.get(from_account)
            if src_balance and src_balance.available < amount:
                raise InsufficientFundsError(
                    from_account, str(amount), str(src_balance.available),
                )
            return TransferResult(
                transfer_id=_uid("TXN_"),
                from_account=from_account,
                to_account=to_account,
                amount=amount,
                asset=asset,
                status=TransferStatus.COMPLETED,
                fee=Decimal("0"),
                settlement_time_ms=85,
            )

        data = await self._request(
            "POST",
            "/transfers",
            json={
                "fromAccount": from_account,
                "toAccount": to_account,
                "amount": str(amount),
                "asset": asset,
            },
        )
        return TransferResult.model_validate(data)

    # -- Sweep operations ----------------------------------------------------

    async def sweep_to_yield(
        self,
        account_id: str,
        amount: Decimal,
    ) -> SweepResult:
        """Move funds from the demand position into the yield pool.

        Parameters
        ----------
        account_id:
            Account to sweep from.
        amount:
            Amount to move into yield.

        Returns
        -------
        SweepResult
            Sweep outcome including updated balances and APY.
        """
        if amount <= 0:
            raise FinxactValidationError(
                "Sweep amount must be positive", field="amount", value=str(amount),
            )

        if self.demo_mode:
            balance = _DEMO_BALANCES.get(account_id)
            if balance is None:
                raise FinxactNotFoundError("Account", account_id)
            if balance.available < amount:
                raise InsufficientFundsError(
                    account_id, str(amount), str(balance.available),
                )
            new_demand = balance.available - amount
            new_yield = balance.yield_allocated + amount
            return SweepResult(
                sweep_id=_uid("SWP_"),
                account_id=account_id,
                direction=SweepDirection.TO_YIELD,
                amount=amount,
                from_position_type=PositionType.DEMAND,
                to_position_type=PositionType.YIELD,
                status=TransferStatus.COMPLETED,
                new_yield_balance=new_yield,
                new_demand_balance=new_demand,
                apy=Decimal("4.25"),
            )

        data = await self._request(
            "POST",
            f"/accounts/{account_id}/sweep",
            json={"direction": "to_yield", "amount": str(amount)},
        )
        return SweepResult.model_validate(data)

    async def unsweep_from_yield(
        self,
        account_id: str,
        amount: Decimal,
    ) -> SweepResult:
        """Move funds from the yield pool back to the demand position.

        Parameters
        ----------
        account_id:
            Account to unsweep to.
        amount:
            Amount to move out of yield.

        Returns
        -------
        SweepResult
            Sweep outcome including updated balances.
        """
        if amount <= 0:
            raise FinxactValidationError(
                "Unsweep amount must be positive", field="amount", value=str(amount),
            )

        if self.demo_mode:
            balance = _DEMO_BALANCES.get(account_id)
            if balance is None:
                raise FinxactNotFoundError("Account", account_id)
            if balance.yield_allocated < amount:
                raise InsufficientFundsError(
                    account_id, str(amount), str(balance.yield_allocated),
                )
            new_yield = balance.yield_allocated - amount
            new_demand = balance.available + amount
            return SweepResult(
                sweep_id=_uid("SWP_"),
                account_id=account_id,
                direction=SweepDirection.FROM_YIELD,
                amount=amount,
                from_position_type=PositionType.YIELD,
                to_position_type=PositionType.DEMAND,
                status=TransferStatus.COMPLETED,
                new_yield_balance=new_yield,
                new_demand_balance=new_demand,
                apy=Decimal("4.25"),
            )

        data = await self._request(
            "POST",
            f"/accounts/{account_id}/sweep",
            json={"direction": "from_yield", "amount": str(amount)},
        )
        return SweepResult.model_validate(data)

    # -- B2B transfers -------------------------------------------------------

    async def b2b_transfer(
        self,
        from_merchant: str,
        to_supplier: str,
        amount: Decimal,
        reference: str,
    ) -> TransferResult:
        """Execute a business-to-business FIUSD transfer.

        Instant settlement between a merchant and a supplier account,
        recording the external payment reference for reconciliation.

        Parameters
        ----------
        from_merchant:
            Payer (merchant) account ID.
        to_supplier:
            Payee (supplier) account ID.
        amount:
            Payment amount.
        reference:
            External invoice or PO reference string.

        Returns
        -------
        TransferResult
            Transfer details including settlement timing.
        """
        if not reference:
            raise FinxactValidationError(
                "B2B transfers require a payment reference",
                field="reference",
            )

        if self.demo_mode:
            src_balance = _DEMO_BALANCES.get(from_merchant)
            if src_balance and src_balance.available < amount:
                raise InsufficientFundsError(
                    from_merchant, str(amount), str(src_balance.available),
                )
            return TransferResult(
                transfer_id=_uid("B2B_"),
                from_account=from_merchant,
                to_account=to_supplier,
                amount=amount,
                asset="FIUSD",
                status=TransferStatus.COMPLETED,
                reference=reference,
                fee=Decimal("0"),
                settlement_time_ms=120,
                metadata={
                    "payment_type": "b2b_supplier",
                    "reference": reference,
                    "rail": "FIUSD_instant",
                },
            )

        data = await self._request(
            "POST",
            "/transfers/b2b",
            json={
                "fromMerchant": from_merchant,
                "toSupplier": to_supplier,
                "amount": str(amount),
                "reference": reference,
                "asset": "FIUSD",
            },
        )
        return TransferResult.model_validate(data)
