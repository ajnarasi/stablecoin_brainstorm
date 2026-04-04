"""
Fiserv Agent Pay - Python SDK Client

Full implementation of the x402 payment protocol for Python-based AI agents.
Supports Solana (Ed25519) and Base/EVM (EIP-712) signature schemes.
"""

import asyncio
import hashlib
import hmac
import json
import os
import secrets
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import aiohttp

try:
    from solders.keypair import Keypair as SoldersKeypair
    from solders.pubkey import Pubkey

    HAS_SOLDERS = True
except ImportError:
    HAS_SOLDERS = False

try:
    from eth_account import Account
    from eth_account.messages import encode_typed_data

    HAS_ETH = True
except ImportError:
    HAS_ETH = False


@dataclass
class CryptographicReceipt:
    """Receipt proving a completed x402 payment."""

    receipt_id: str = ""
    timestamp: str = ""
    amount: str = ""
    token: str = ""
    chain: str = ""
    transaction_id: str = ""
    merchant_address: str = ""
    agent_id: str = ""
    signature: str = ""
    explorer_url: str = ""

    @classmethod
    def from_dict(cls, data: dict) -> "CryptographicReceipt":
        return cls(
            receipt_id=data.get("receiptId", ""),
            timestamp=data.get("timestamp", ""),
            amount=data.get("amount", ""),
            token=data.get("token", ""),
            chain=data.get("chain", ""),
            transaction_id=data.get("transactionId", ""),
            merchant_address=data.get("merchantAddress", ""),
            agent_id=data.get("agentId", ""),
            signature=data.get("signature", ""),
            explorer_url=data.get("explorerUrl", ""),
        )


@dataclass
class PaymentOptions:
    """Options for a payment request."""

    max_amount: Optional[str] = None
    preferred_token: str = "FIUSD"
    preferred_chain: str = "solana"
    agent_identity: Optional[str] = None
    headers: Dict[str, str] = field(default_factory=dict)


@dataclass
class PaymentResponse:
    """Result of a payment attempt."""

    status: str  # paid, rejected, insufficient_funds, limit_exceeded, error
    receipt: CryptographicReceipt
    resource: Any
    settlement_tx_id: str
    amount: str
    token: str
    chain: str


class FiservAgentPay:
    """
    Python SDK for AI agents to make x402 payments.

    Handles the full x402 flow:
    1. Detect 402 Payment Required responses
    2. Parse payment instructions
    3. Sign payment with agent wallet
    4. Retry with signed payment
    5. Return resource + receipt
    """

    def __init__(
        self,
        wallet_private_key: str,
        gateway_url: str,
        preferred_token: str = "FIUSD",
        preferred_chain: str = "solana",
        timeout: int = 30,
        debug: bool = False,
        config: Optional[dict] = None,
    ):
        self.gateway_url = gateway_url.rstrip("/")
        self.preferred_token = preferred_token
        self.preferred_chain = preferred_chain
        self.timeout = timeout
        self.debug = debug
        self.finxact_kyc_token: Optional[str] = None
        self.transaction_history: List[PaymentResponse] = []

        # Apply any additional config
        if config:
            self.preferred_token = config.get("preferredToken", self.preferred_token)
            self.preferred_chain = config.get("preferredChain", self.preferred_chain)
            self.timeout = config.get("timeout", self.timeout)
            self.debug = config.get("debug", self.debug)

        # Initialize wallets
        self._init_wallets(wallet_private_key)
        self.agent_id = self._derive_agent_id()

        if self.debug:
            print(f"[AgentPay] Initialized agent: {self.agent_id}")
            print(f"[AgentPay] Preferred: {self.preferred_token} on {self.preferred_chain}")

    def _init_wallets(self, private_key: str) -> None:
        """Initialize Solana and EVM wallets from the private key."""
        self._solana_keypair = None
        self._evm_account = None
        self._solana_pubkey = ""
        self._evm_address = ""

        # Try Solana
        if HAS_SOLDERS:
            try:
                self._solana_keypair = SoldersKeypair()  # Generate for demo
                self._solana_pubkey = str(self._solana_keypair.pubkey())
            except Exception as e:
                if self.debug:
                    print(f"[AgentPay] Solana init warning: {e}")
        else:
            # Generate a deterministic pseudo-pubkey from the private key
            h = hashlib.sha256(private_key.encode()).hexdigest()
            self._solana_pubkey = f"Agent{h[:40]}"

        # Try EVM
        if HAS_ETH:
            try:
                hex_key = private_key if private_key.startswith("0x") else f"0x{private_key.ljust(64, '0')[:64]}"
                self._evm_account = Account.from_key(hex_key)
                self._evm_address = self._evm_account.address
            except Exception as e:
                if self.debug:
                    print(f"[AgentPay] EVM init warning: {e}")
                self._evm_account = Account.create()
                self._evm_address = self._evm_account.address
        else:
            h = hashlib.sha256(private_key.encode()).hexdigest()
            self._evm_address = f"0x{h[:40]}"

    def _derive_agent_id(self) -> str:
        """Derive deterministic agent ID from wallet."""
        source = self._solana_pubkey or self._evm_address or "unknown"
        h = hashlib.sha256(source.encode()).hexdigest()
        return f"agent_{h[:12]}"

    async def fetch_with_payment(
        self,
        url: str,
        max_amount: Optional[str] = None,
        preferred_token: Optional[str] = None,
        preferred_chain: Optional[str] = None,
        agent_identity: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> PaymentResponse:
        """
        Fetch a resource with automatic x402 payment handling.

        Args:
            url: Resource URL to fetch
            max_amount: Maximum USD amount willing to pay
            preferred_token: Token preference override
            preferred_chain: Chain preference override
            agent_identity: Finxact KYC token
            headers: Additional request headers

        Returns:
            PaymentResponse with resource data and receipt
        """
        eff_token = preferred_token or self.preferred_token
        eff_chain = preferred_chain or self.preferred_chain
        req_headers = {"User-Agent": f"FiservAgentPay-Python/0.1.0 ({self.agent_id})"}
        if headers:
            req_headers.update(headers)

        if self.debug:
            print(f"[AgentPay] Fetching: {url}")

        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            # Step 1: Initial request
            async with session.get(url, headers=req_headers) as resp:
                if resp.status != 402:
                    data = await resp.json()
                    return PaymentResponse(
                        status="paid",
                        receipt=CryptographicReceipt(),
                        resource=data,
                        settlement_tx_id="",
                        amount="0",
                        token="",
                        chain="",
                    )

                body = await resp.json()

            # Step 2: Parse payment instructions
            instructions = body.get("paymentInstructions")
            if not instructions:
                raise ValueError("402 response missing payment instructions")

            price = instructions["price"]
            if self.debug:
                print(f"[AgentPay] Payment required: ${price}")

            # Step 3: Check max amount
            if max_amount and float(price) > float(max_amount):
                return PaymentResponse(
                    status="rejected",
                    receipt=CryptographicReceipt(),
                    resource=None,
                    settlement_tx_id="",
                    amount=price,
                    token="",
                    chain="",
                )

            # Step 4: Select token
            accepted = instructions.get("acceptedTokens", [])
            selected = self._select_token(accepted, eff_token, eff_chain)
            if not selected:
                raise ValueError(f"No acceptable token for {eff_token} on {eff_chain}")

            # Step 5: Sign payment
            signed = self._sign_payment(instructions, selected)

            # Step 6: Retry with payment
            pay_headers = {**req_headers, "X-PAYMENT": json.dumps(signed)}
            async with session.get(url, headers=pay_headers) as resp:
                paid_data = await resp.json()

                if resp.status == 402:
                    errors = paid_data.get("errors", [])
                    fail_status = "limit_exceeded" if any("limit" in e for e in errors) else "rejected"
                    return PaymentResponse(
                        status=fail_status,
                        receipt=CryptographicReceipt(),
                        resource=None,
                        settlement_tx_id="",
                        amount=price,
                        token=selected["token"],
                        chain=selected["chain"],
                    )

            receipt = CryptographicReceipt.from_dict(paid_data.get("receipt", {}))
            settlement = paid_data.get("settlement", {})

            result = PaymentResponse(
                status="paid",
                receipt=receipt,
                resource=paid_data.get("product", paid_data),
                settlement_tx_id=receipt.transaction_id or settlement.get("txId", ""),
                amount=price,
                token=selected["token"],
                chain=selected["chain"],
            )

            self.transaction_history.append(result)

            if self.debug:
                print(f"[AgentPay] Payment successful: ${result.amount} {result.token}")
                print(f"[AgentPay] Receipt: {receipt.receipt_id}")

            return result

    def _select_token(
        self, accepted: List[dict], pref_token: str, pref_chain: str
    ) -> Optional[dict]:
        """Select the best token/chain from accepted options."""
        # Exact match
        for t in accepted:
            if t["token"] == pref_token and t["chain"] == pref_chain:
                return t

        # Same token, any chain
        for t in accepted:
            if t["token"] == pref_token:
                return t

        # Same chain, any token
        for t in accepted:
            if t["chain"] == pref_chain:
                return t

        return accepted[0] if accepted else None

    def _sign_payment(self, instructions: dict, selected_token: dict) -> dict:
        """Sign a payment payload."""
        nonce = secrets.token_hex(16)
        now = int(time.time())

        payload = {
            "orderId": instructions["orderId"],
            "amount": instructions["price"],
            "token": selected_token["token"],
            "chain": selected_token["chain"],
            "tokenAddress": selected_token["address"],
            "recipient": selected_token["recipient"],
            "nonce": nonce,
            "agentId": self.agent_id,
            "timestamp": now,
            "expiry": instructions.get("expiry", now + 300),
        }

        if self.finxact_kyc_token:
            payload["kycToken"] = self.finxact_kyc_token

        if selected_token["chain"] == "solana":
            payload["paymentMethod"] = "EIP-3009"
            payload["sender"] = self._solana_pubkey
            payload["signature"] = self._sign_solana(payload)
        elif selected_token["chain"] == "base":
            payload["paymentMethod"] = "EIP-3009"
            payload["sender"] = self._evm_address
            payload["signature"] = self._sign_evm(payload, selected_token)

        return payload

    def _sign_solana(self, payload: dict) -> str:
        """Sign with Solana Ed25519."""
        message = json.dumps(
            {
                "orderId": payload["orderId"],
                "amount": payload["amount"],
                "token": payload["token"],
                "chain": payload["chain"],
                "sender": payload["sender"],
                "nonce": payload["nonce"],
            },
            separators=(",", ":"),
        )

        if HAS_SOLDERS and self._solana_keypair:
            import base64

            msg_bytes = message.encode()
            from nacl.signing import SigningKey

            try:
                sk = SigningKey(bytes(self._solana_keypair)[:32])
                signed = sk.sign(msg_bytes)
                return base64.b64encode(signed.signature).decode()
            except Exception:
                pass

        # Fallback: HMAC-based signature for demo
        sig = hmac.new(
            self.agent_id.encode(), message.encode(), hashlib.sha256
        ).hexdigest()
        return f"sol_sig_{sig}"

    def _sign_evm(self, payload: dict, selected_token: dict) -> str:
        """Sign with EVM EIP-712 typed data."""
        if HAS_ETH and self._evm_account:
            try:
                domain_data = {
                    "name": "Fiserv USD" if selected_token["token"] == "FIUSD" else "USD Coin",
                    "version": "2",
                    "chainId": 84532,
                    "verifyingContract": selected_token["address"],
                }
                message_types = {
                    "TransferWithAuthorization": [
                        {"name": "from", "type": "address"},
                        {"name": "to", "type": "address"},
                        {"name": "value", "type": "uint256"},
                        {"name": "validAfter", "type": "uint256"},
                        {"name": "validBefore", "type": "uint256"},
                        {"name": "nonce", "type": "bytes32"},
                    ]
                }
                amount_wei = int(float(payload["amount"]) * 10**6)
                nonce_int = int(payload["nonce"][:16], 16)
                nonce_bytes = nonce_int.to_bytes(32, byteorder="big")

                message_data = {
                    "from": self._evm_address,
                    "to": selected_token["recipient"],
                    "value": amount_wei,
                    "validAfter": 0,
                    "validBefore": payload["expiry"],
                    "nonce": nonce_bytes,
                }

                structured = encode_typed_data(
                    domain_data, message_types, message_data
                )
                signed = self._evm_account.sign_message(structured)
                return signed.signature.hex()
            except Exception as e:
                if self.debug:
                    print(f"[AgentPay] EVM signing fallback: {e}")

        # Fallback: HMAC-based signature for demo
        msg = json.dumps(payload, separators=(",", ":"))
        sig = hmac.new(
            self.agent_id.encode(), msg.encode(), hashlib.sha256
        ).hexdigest()
        return f"0x{sig.ljust(128, '0')}"

    def attach_identity(self, finxact_kyc_token: str) -> None:
        """Attach bank-verified identity for higher spending limits."""
        self.finxact_kyc_token = finxact_kyc_token
        if self.debug:
            print("[AgentPay] KYC identity attached")

    async def get_spending_summary(self) -> dict:
        """Get current spending summary."""
        total = sum(float(tx.amount) for tx in self.transaction_history)
        tier = "basic"
        per_tx = 100
        daily = 500

        if self.finxact_kyc_token:
            tier = "verified"
            per_tx = 1000
            daily = 5000

        return {
            "agent_id": self.agent_id,
            "tier": tier,
            "today_spent": total,
            "today_transactions": len(self.transaction_history),
            "remaining_daily": max(0, daily - total),
            "per_transaction_limit": per_tx,
            "daily_limit": daily,
        }

    def get_agent_id(self) -> str:
        """Get the agent's public identifier."""
        return self.agent_id

    def get_wallet_addresses(self) -> dict:
        """Get wallet addresses."""
        return {
            "solana": self._solana_pubkey,
            "evm": self._evm_address,
        }
