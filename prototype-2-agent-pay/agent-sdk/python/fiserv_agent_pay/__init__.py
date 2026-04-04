"""
fiserv-agent-pay: Python SDK for AI Agent Commerce via x402

Enables AI agents to make x402 payments automatically when
accessing paid resources from CommerceHub merchants.

Usage:
    from fiserv_agent_pay import FiservAgentPay

    agent_pay = FiservAgentPay(
        wallet_private_key="your-private-key",
        gateway_url="http://localhost:8002",
    )

    result = await agent_pay.fetch_with_payment(
        "http://localhost:8002/api/products/prod_001",
        max_amount="200.00"
    )
"""

from .client import FiservAgentPay, PaymentResponse, PaymentOptions, CryptographicReceipt

__version__ = "0.1.0"
__all__ = ["FiservAgentPay", "PaymentResponse", "PaymentOptions", "CryptographicReceipt"]
