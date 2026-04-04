"""Finxact client library for Fiserv crypto prototypes.

Provides an async Python SDK for interacting with the Finxact
core-banking platform, with built-in demo mode for development
and presentations.

Usage::

    from finxact_client import FinxactClient

    async with FinxactClient(base_url="...", api_key="...", demo_mode=True) as client:
        account = await client.get_account("ACCT_MARIO_001")
        balance = await client.get_balance("ACCT_MARIO_001")
"""

from .client import FinxactClient
from .exceptions import (
    FinxactAPIError,
    FinxactAuthenticationError,
    FinxactConnectionError,
    FinxactError,
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

__all__ = [
    "FinxactClient",
    # Exceptions
    "FinxactError",
    "FinxactAPIError",
    "FinxactAuthenticationError",
    "FinxactConnectionError",
    "FinxactNotFoundError",
    "FinxactRateLimitError",
    "FinxactTimeoutError",
    "FinxactValidationError",
    "InsufficientFundsError",
    # Models
    "Account",
    "AccountStatus",
    "Balance",
    "Position",
    "PositionType",
    "SweepDirection",
    "SweepResult",
    "TransferResult",
    "TransferStatus",
]
