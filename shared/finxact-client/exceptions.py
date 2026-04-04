"""Custom exceptions for the Finxact client library.

Provides a structured exception hierarchy for handling API errors,
authentication failures, rate limiting, and validation issues.
"""

from __future__ import annotations

from typing import Any


class FinxactError(Exception):
    """Base exception for all Finxact client errors."""

    def __init__(self, message: str, details: dict[str, Any] | None = None) -> None:
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class FinxactAPIError(FinxactError):
    """Raised when the Finxact API returns an error response."""

    def __init__(
        self,
        message: str,
        status_code: int,
        response_body: dict[str, Any] | None = None,
        request_id: str | None = None,
    ) -> None:
        self.status_code = status_code
        self.response_body = response_body or {}
        self.request_id = request_id
        details = {
            "status_code": status_code,
            "response_body": self.response_body,
            "request_id": request_id,
        }
        super().__init__(message, details)


class FinxactAuthenticationError(FinxactAPIError):
    """Raised when authentication fails (401/403)."""

    def __init__(
        self,
        message: str = "Authentication failed. Check your API key.",
        status_code: int = 401,
        response_body: dict[str, Any] | None = None,
        request_id: str | None = None,
    ) -> None:
        super().__init__(message, status_code, response_body, request_id)


class FinxactNotFoundError(FinxactAPIError):
    """Raised when a requested resource is not found (404)."""

    def __init__(
        self,
        resource_type: str,
        resource_id: str,
        response_body: dict[str, Any] | None = None,
        request_id: str | None = None,
    ) -> None:
        self.resource_type = resource_type
        self.resource_id = resource_id
        message = f"{resource_type} not found: {resource_id}"
        super().__init__(message, 404, response_body, request_id)


class FinxactRateLimitError(FinxactAPIError):
    """Raised when the API rate limit is exceeded (429)."""

    def __init__(
        self,
        retry_after_seconds: float | None = None,
        response_body: dict[str, Any] | None = None,
        request_id: str | None = None,
    ) -> None:
        self.retry_after_seconds = retry_after_seconds
        message = "Rate limit exceeded."
        if retry_after_seconds is not None:
            message += f" Retry after {retry_after_seconds}s."
        super().__init__(message, 429, response_body, request_id)


class FinxactValidationError(FinxactError):
    """Raised when request parameters fail client-side validation."""

    def __init__(
        self,
        message: str,
        field: str | None = None,
        value: Any = None,
    ) -> None:
        self.field = field
        self.value = value
        details = {"field": field, "value": value}
        super().__init__(message, details)


class FinxactConnectionError(FinxactError):
    """Raised when the client cannot connect to the Finxact API."""

    def __init__(
        self,
        message: str = "Failed to connect to Finxact API.",
        original_error: Exception | None = None,
    ) -> None:
        self.original_error = original_error
        details = {"original_error": str(original_error) if original_error else None}
        super().__init__(message, details)


class FinxactTimeoutError(FinxactConnectionError):
    """Raised when a request to the Finxact API times out."""

    def __init__(
        self,
        timeout_seconds: float,
        original_error: Exception | None = None,
    ) -> None:
        self.timeout_seconds = timeout_seconds
        message = f"Request timed out after {timeout_seconds}s."
        super().__init__(message, original_error)


class InsufficientFundsError(FinxactError):
    """Raised when an account has insufficient funds for a transaction."""

    def __init__(
        self,
        account_id: str,
        requested_amount: str,
        available_amount: str,
    ) -> None:
        self.account_id = account_id
        self.requested_amount = requested_amount
        self.available_amount = available_amount
        message = (
            f"Insufficient funds in account {account_id}: "
            f"requested {requested_amount}, available {available_amount}"
        )
        details = {
            "account_id": account_id,
            "requested_amount": requested_amount,
            "available_amount": available_amount,
        }
        super().__init__(message, details)
