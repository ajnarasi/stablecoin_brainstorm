"""Universal demo mode fallback pattern for all prototypes.

Provides a resilient execution wrapper that falls back to pre-computed
results when external dependencies fail, time out, or when demo mode
is explicitly enabled. Ensures every prototype can run a compelling
demo regardless of backend availability.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Awaitable, Callable, TypeVar

logger = logging.getLogger(__name__)

T = TypeVar("T")

# Default timeout for real function calls before falling back
_DEFAULT_TIMEOUT_SECONDS = 5.0

# Demo merchant constants
DEMO_MERCHANT_ID = "DEMO_MERCHANT_001"
DEMO_MERCHANT_NAME = "Mario's Pizzeria"


class DemoMode:
    """Universal fallback to pre-computed results if any external dependency fails.

    Register expected results for operation keys, then use
    ``execute_with_fallback`` to try the real function first and
    transparently fall back to the registered result on failure.

    When ``enabled`` is ``False``, the real function is called directly
    with no fallback wrapping (production mode).

    Parameters
    ----------
    enabled:
        When ``True``, wrap real calls with timeout + fallback logic.
        When ``False``, execute real functions directly without any
        fallback protection.
    timeout:
        Maximum seconds to wait for a real function before falling
        back. Defaults to 5.0 seconds.

    Usage::

        demo = DemoMode(enabled=True)
        demo.register_fallback("get_balance", Balance(total=Decimal("847523.50"), ...))

        balance = await demo.execute_with_fallback(
            "get_balance",
            client.get_balance,
            "ACCT_MARIO_001",
        )
    """

    def __init__(
        self,
        enabled: bool = False,
        timeout: float = _DEFAULT_TIMEOUT_SECONDS,
    ) -> None:
        self.enabled = enabled
        self.timeout = timeout
        self._fallbacks: dict[str, Any] = {}
        self._fallback_hit_count: dict[str, int] = {}
        self._real_call_count: int = 0
        self._fallback_call_count: int = 0

    # -- registration --------------------------------------------------------

    def register_fallback(self, key: str, result: Any) -> None:
        """Register a pre-computed result for a given operation key.

        Parameters
        ----------
        key:
            Identifier for the operation (e.g., ``"get_balance"``).
        result:
            The value to return when the real function fails or
            times out. Can be any type.
        """
        self._fallbacks[key] = result

    def register_fallbacks(self, fallbacks: dict[str, Any]) -> None:
        """Register multiple fallback results at once.

        Parameters
        ----------
        fallbacks:
            Mapping of operation keys to pre-computed results.
        """
        self._fallbacks.update(fallbacks)

    def has_fallback(self, key: str) -> bool:
        """Check whether a fallback is registered for the given key."""
        return key in self._fallbacks

    def get_fallback(self, key: str) -> Any | None:
        """Retrieve the registered fallback value for a key, or ``None``."""
        return self._fallbacks.get(key)

    # -- execution -----------------------------------------------------------

    async def execute_with_fallback(
        self,
        key: str,
        real_fn: Callable[..., Awaitable[T]],
        *args: Any,
        **kwargs: Any,
    ) -> T | Any:
        """Try the real function. Fall back to a registered result on failure.

        When demo mode is **disabled**, the real function is called
        directly -- no timeout wrapping, no fallback. Failures
        propagate normally.

        When demo mode is **enabled**:
        1. The real function is called with a timeout.
        2. If it succeeds within the timeout, its result is returned.
        3. If it raises any exception or times out, the registered
           fallback for ``key`` is returned.
        4. If no fallback is registered, ``None`` is returned and a
           warning is logged.

        Parameters
        ----------
        key:
            Operation identifier matching a registered fallback.
        real_fn:
            The async callable to attempt first.
        *args:
            Positional arguments forwarded to ``real_fn``.
        **kwargs:
            Keyword arguments forwarded to ``real_fn``.

        Returns
        -------
        T | Any
            Either the real result or the fallback value.
        """
        if not self.enabled:
            return await real_fn(*args, **kwargs)

        try:
            result = await asyncio.wait_for(
                real_fn(*args, **kwargs),
                timeout=self.timeout,
            )
            self._real_call_count += 1
            return result
        except Exception as exc:
            self._fallback_call_count += 1
            self._fallback_hit_count[key] = self._fallback_hit_count.get(key, 0) + 1

            fallback = self._fallbacks.get(key)
            if fallback is not None:
                logger.warning(
                    "Demo fallback activated for '%s': %s: %s",
                    key,
                    type(exc).__name__,
                    exc,
                )
                return fallback

            logger.warning(
                "Demo fallback activated for '%s' but no fallback registered: "
                "%s: %s",
                key,
                type(exc).__name__,
                exc,
            )
            return None

    # -- merchant helpers ----------------------------------------------------

    @staticmethod
    def is_demo_merchant(merchant_id: str) -> bool:
        """Check if this is the demo merchant (Mario's Pizzeria).

        Parameters
        ----------
        merchant_id:
            The merchant identifier to check.

        Returns
        -------
        bool
            ``True`` if the ID matches the canonical demo merchant.
        """
        return merchant_id == DEMO_MERCHANT_ID

    @staticmethod
    def demo_merchant_info() -> dict[str, str]:
        """Return metadata for the demo merchant."""
        return {
            "merchant_id": DEMO_MERCHANT_ID,
            "merchant_name": DEMO_MERCHANT_NAME,
            "business_type": "Restaurant / Quick Service",
            "location": "Brooklyn, NY",
            "monthly_volume": "$847,523",
            "account_id": "ACCT_MARIO_001",
        }

    # -- diagnostics ---------------------------------------------------------

    @property
    def stats(self) -> dict[str, Any]:
        """Return execution statistics for monitoring and debugging."""
        return {
            "enabled": self.enabled,
            "timeout_seconds": self.timeout,
            "registered_fallbacks": len(self._fallbacks),
            "real_calls_succeeded": self._real_call_count,
            "fallback_calls": self._fallback_call_count,
            "fallback_hits_by_key": dict(self._fallback_hit_count),
        }

    def reset_stats(self) -> None:
        """Reset execution counters."""
        self._real_call_count = 0
        self._fallback_call_count = 0
        self._fallback_hit_count.clear()
