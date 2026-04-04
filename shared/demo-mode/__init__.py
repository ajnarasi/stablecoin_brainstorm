"""Universal demo mode fallback pattern for Fiserv crypto prototypes.

Provides resilient execution wrapping with automatic fallback to
pre-computed results when external dependencies are unavailable.

Usage::

    from demo_mode import DemoMode

    demo = DemoMode(enabled=True)
    demo.register_fallback("get_balance", precomputed_balance)

    result = await demo.execute_with_fallback(
        "get_balance",
        client.get_balance,
        "ACCT_MARIO_001",
    )
"""

from .demo_mode import (
    DEMO_MERCHANT_ID,
    DEMO_MERCHANT_NAME,
    DemoMode,
)

__all__ = [
    "DemoMode",
    "DEMO_MERCHANT_ID",
    "DEMO_MERCHANT_NAME",
]
