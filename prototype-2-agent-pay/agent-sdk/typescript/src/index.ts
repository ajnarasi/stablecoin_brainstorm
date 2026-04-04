/**
 * @fiserv/agent-pay - TypeScript SDK for AI Agent Commerce
 *
 * Enables AI agents to make x402 payments automatically when
 * accessing paid resources from CommerceHub merchants.
 *
 * Usage:
 *   const agentPay = new FiservAgentPay({
 *     walletPrivateKey: process.env.AGENT_WALLET_PRIVATE_KEY!,
 *     gatewayUrl: 'http://localhost:8002',
 *     preferredToken: 'FIUSD',
 *     preferredChain: 'solana',
 *   });
 *
 *   const result = await agentPay.fetchWithPayment(
 *     'http://localhost:8002/api/products/prod_001',
 *     { maxAmount: '200.00' }
 *   );
 */

import { Keypair, PublicKey } from "@solana/web3.js";
import { ethers } from "ethers";
import * as nacl from "tweetnacl";
import * as crypto from "crypto";

// --- Types ---

export interface AgentPayConfig {
  /** Private key for signing payments (base58 for Solana, hex for EVM) */
  walletPrivateKey: string;
  /** Gateway base URL */
  gatewayUrl: string;
  /** Preferred stablecoin token */
  preferredToken?: "FIUSD" | "USDC";
  /** Preferred blockchain */
  preferredChain?: "solana" | "base";
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Enable verbose logging */
  debug?: boolean;
}

export interface PaymentOptions {
  /** Maximum USD amount willing to pay */
  maxAmount?: string;
  /** Override preferred token for this request */
  preferredToken?: "FIUSD" | "USDC";
  /** Override preferred chain for this request */
  preferredChain?: "solana" | "base";
  /** Finxact KYC token for higher spending limits */
  agentIdentity?: string;
  /** Custom headers to include */
  headers?: Record<string, string>;
}

export interface PaymentResponse {
  status: "paid" | "rejected" | "insufficient_funds" | "limit_exceeded" | "error";
  receipt: CryptographicReceipt;
  resource: any;
  settlementTxId: string;
  amount: string;
  token: string;
  chain: string;
}

export interface CryptographicReceipt {
  receiptId: string;
  timestamp: string;
  amount: string;
  token: string;
  chain: string;
  transactionId: string;
  merchantAddress: string;
  agentId: string;
  signature: string;
  explorerUrl?: string;
}

export interface PaymentInstructions {
  version: string;
  price: string;
  currency: string;
  acceptedTokens: AcceptedToken[];
  paymentMethods: string[];
  merchantId: string;
  orderId: string;
  productId: string;
  description: string;
  expiry: number;
  issuedAt: number;
  nonce: string;
  gatewayUrl: string;
  verifyEndpoint: string;
}

export interface AcceptedToken {
  token: string;
  chain: string;
  address: string;
  decimals: number;
  recipient: string;
}

export interface SpendingSummary {
  agentId: string;
  tier: string;
  todaySpent: number;
  todayTransactions: number;
  remainingDaily: number;
  perTransactionLimit: number;
  dailyLimit: number;
}

// --- Main SDK Class ---

export class FiservAgentPay {
  private config: Required<AgentPayConfig>;
  private solanaKeypair: Keypair | null = null;
  private evmWallet: ethers.Wallet | null = null;
  private agentId: string;
  private finxactKycToken: string | null = null;
  private transactionHistory: PaymentResponse[] = [];

  constructor(config: AgentPayConfig) {
    this.config = {
      preferredToken: "FIUSD",
      preferredChain: "solana",
      timeout: 30000,
      debug: false,
      ...config,
    };

    // Initialize wallet(s) based on the private key format
    this.initializeWallets(config.walletPrivateKey);
    this.agentId = this.deriveAgentId();

    if (this.config.debug) {
      console.log(`[AgentPay] Initialized agent: ${this.agentId}`);
      console.log(
        `[AgentPay] Preferred: ${this.config.preferredToken} on ${this.config.preferredChain}`
      );
    }
  }

  /**
   * Initialize wallet keypairs from the provided private key
   */
  private initializeWallets(privateKey: string): void {
    // Try Solana (base58 encoded or raw bytes)
    try {
      if (privateKey.length === 88 || privateKey.length === 87) {
        // Base58 encoded Solana keypair
        const decoded = Buffer.from(privateKey, "base64");
        this.solanaKeypair = Keypair.fromSecretKey(decoded);
      } else if (privateKey.length === 128) {
        // Hex encoded 64-byte Solana keypair
        const bytes = Buffer.from(privateKey, "hex");
        this.solanaKeypair = Keypair.fromSecretKey(bytes);
      } else {
        // Try generating from seed
        const seed = Buffer.from(
          privateKey.padEnd(32, "0").slice(0, 32),
          "utf-8"
        );
        this.solanaKeypair = Keypair.fromSeed(seed);
      }
    } catch {
      if (this.config.debug) {
        console.log("[AgentPay] Could not create Solana keypair, using generated");
      }
      this.solanaKeypair = Keypair.generate();
    }

    // Try EVM (hex encoded 32-byte private key)
    try {
      const hexKey = privateKey.startsWith("0x")
        ? privateKey
        : `0x${privateKey.padEnd(64, "0").slice(0, 64)}`;
      if (hexKey.length === 66) {
        this.evmWallet = new ethers.Wallet(hexKey);
      }
    } catch {
      if (this.config.debug) {
        console.log("[AgentPay] Could not create EVM wallet, using generated");
      }
      this.evmWallet = ethers.Wallet.createRandom();
    }
  }

  /**
   * Derive a deterministic agent ID from the wallet
   */
  private deriveAgentId(): string {
    const source = this.solanaKeypair
      ? this.solanaKeypair.publicKey.toBase58()
      : this.evmWallet?.address || "unknown";

    const hash = crypto.createHash("sha256").update(source).digest("hex");
    return `agent_${hash.slice(0, 12)}`;
  }

  /**
   * Core method: Fetch a resource with automatic x402 payment
   *
   * 1. GET the resource URL
   * 2. If 402 returned, parse X-PAYMENT instructions
   * 3. Select best payment method (token/chain) based on options
   * 4. Sign the payment (EIP-3009 or Permit2)
   * 5. Retry request with X-PAYMENT header containing signed payload
   * 6. Return resource data + cryptographic receipt
   */
  async fetchWithPayment(
    url: string,
    options: PaymentOptions = {}
  ): Promise<PaymentResponse> {
    const effectiveToken = options.preferredToken || this.config.preferredToken;
    const effectiveChain = options.preferredChain || this.config.preferredChain;

    if (this.config.debug) {
      console.log(`[AgentPay] Fetching: ${url}`);
      console.log(`[AgentPay] Preferred: ${effectiveToken} on ${effectiveChain}`);
    }

    // Step 1: Initial request
    const initialResponse = await this.makeRequest(url, {
      method: "GET",
      headers: options.headers,
    });

    // If not 402, resource is free - return directly
    if (initialResponse.status !== 402) {
      const data = await initialResponse.json();
      return {
        status: "paid",
        receipt: {} as CryptographicReceipt,
        resource: data,
        settlementTxId: "",
        amount: "0",
        token: "",
        chain: "",
      };
    }

    // Step 2: Parse payment instructions from 402 response
    const responseBody = await initialResponse.json();
    const instructions: PaymentInstructions = responseBody.paymentInstructions;

    if (!instructions) {
      throw new Error("402 response missing payment instructions");
    }

    if (this.config.debug) {
      console.log(
        `[AgentPay] Payment required: $${instructions.price} for ${instructions.description}`
      );
    }

    // Step 3: Check max amount constraint
    if (options.maxAmount) {
      const maxAmt = parseFloat(options.maxAmount);
      const price = parseFloat(instructions.price);
      if (price > maxAmt) {
        return {
          status: "rejected",
          receipt: {} as CryptographicReceipt,
          resource: null,
          settlementTxId: "",
          amount: instructions.price,
          token: "",
          chain: "",
        };
      }
    }

    // Step 4: Select best payment method
    const selectedToken = this.selectToken(
      instructions.acceptedTokens,
      effectiveToken,
      effectiveChain
    );

    if (!selectedToken) {
      throw new Error(
        `No acceptable token found for ${effectiveToken} on ${effectiveChain}`
      );
    }

    // Step 5: Sign the payment
    const signedPayload = await this.signPayment(
      instructions,
      selectedToken
    );

    // Step 6: Retry with payment
    const paidResponse = await this.makeRequest(url, {
      method: "GET",
      headers: {
        ...options.headers,
        "X-PAYMENT": JSON.stringify(signedPayload),
      },
    });

    const paidData = await paidResponse.json();

    // Check for payment failure
    if (paidResponse.status === 402) {
      const failStatus = paidData.errors?.some((e: string) =>
        e.includes("limit")
      )
        ? "limit_exceeded"
        : "rejected";

      return {
        status: failStatus as any,
        receipt: {} as CryptographicReceipt,
        resource: null,
        settlementTxId: "",
        amount: instructions.price,
        token: selectedToken.token,
        chain: selectedToken.chain,
      };
    }

    // Parse receipt from response
    const receipt: CryptographicReceipt = paidData.receipt || {};
    const settlement = paidData.settlement || {};

    const result: PaymentResponse = {
      status: "paid",
      receipt,
      resource: paidData.product || paidData,
      settlementTxId: receipt.transactionId || settlement.txId || "",
      amount: instructions.price,
      token: selectedToken.token,
      chain: selectedToken.chain,
    };

    this.transactionHistory.push(result);

    if (this.config.debug) {
      console.log(
        `[AgentPay] Payment successful: $${result.amount} ${result.token} on ${result.chain}`
      );
      console.log(`[AgentPay] Receipt: ${receipt.receiptId}`);
      console.log(`[AgentPay] TX: ${result.settlementTxId}`);
    }

    return result;
  }

  /**
   * Select the best token/chain combination from accepted options
   */
  private selectToken(
    acceptedTokens: AcceptedToken[],
    preferredToken: string,
    preferredChain: string
  ): AcceptedToken | null {
    // First try exact match
    const exact = acceptedTokens.find(
      (t) => t.token === preferredToken && t.chain === preferredChain
    );
    if (exact) return exact;

    // Try preferred token on any chain
    const sameToken = acceptedTokens.find(
      (t) => t.token === preferredToken
    );
    if (sameToken) return sameToken;

    // Try preferred chain with any token
    const sameChain = acceptedTokens.find(
      (t) => t.chain === preferredChain
    );
    if (sameChain) return sameChain;

    // Fall back to first available
    return acceptedTokens[0] || null;
  }

  /**
   * Sign a payment payload for the selected token/chain
   */
  private async signPayment(
    instructions: PaymentInstructions,
    selectedToken: AcceptedToken
  ): Promise<Record<string, any>> {
    const nonce = crypto.randomBytes(16).toString("hex");

    const payload: Record<string, any> = {
      orderId: instructions.orderId,
      amount: instructions.price,
      token: selectedToken.token,
      chain: selectedToken.chain,
      tokenAddress: selectedToken.address,
      recipient: selectedToken.recipient,
      nonce,
      agentId: this.agentId,
      timestamp: Math.floor(Date.now() / 1000),
      expiry: instructions.expiry,
    };

    if (this.finxactKycToken) {
      payload.kycToken = this.finxactKycToken;
    }

    if (selectedToken.chain === "solana") {
      payload.paymentMethod = "EIP-3009";
      payload.sender = this.solanaKeypair!.publicKey.toBase58();
      payload.signature = this.signSolana(payload);
    } else if (selectedToken.chain === "base") {
      payload.paymentMethod = "EIP-3009";
      payload.sender = this.evmWallet!.address;
      payload.signature = await this.signEVM(payload, selectedToken);
    }

    return payload;
  }

  /**
   * Sign with Solana Ed25519
   */
  private signSolana(payload: Record<string, any>): string {
    const message = JSON.stringify({
      orderId: payload.orderId,
      amount: payload.amount,
      token: payload.token,
      chain: payload.chain,
      sender: payload.sender,
      nonce: payload.nonce,
    });

    const messageBytes = new TextEncoder().encode(message);
    const signature = nacl.sign.detached(
      messageBytes,
      this.solanaKeypair!.secretKey
    );

    return Buffer.from(signature).toString("base64");
  }

  /**
   * Sign with EVM EIP-712 typed data (for EIP-3009 or Permit2)
   */
  private async signEVM(
    payload: Record<string, any>,
    selectedToken: AcceptedToken
  ): Promise<string> {
    const domain = {
      name: selectedToken.token === "FIUSD" ? "Fiserv USD" : "USD Coin",
      version: "2",
      chainId: 84532, // Base Sepolia
      verifyingContract: selectedToken.address,
    };

    const types = {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    };

    const nonceBytes = ethers.zeroPadValue(
      ethers.toBeHex(BigInt("0x" + payload.nonce.slice(0, 16))),
      32
    );

    const value = {
      from: this.evmWallet!.address,
      to: selectedToken.recipient,
      value: ethers.parseUnits(payload.amount, selectedToken.decimals || 6),
      validAfter: 0,
      validBefore: payload.expiry,
      nonce: nonceBytes,
    };

    const signature = await this.evmWallet!.signTypedData(
      domain,
      types,
      value
    );

    return signature;
  }

  /**
   * Attach a Finxact KYC token for higher spending limits
   */
  attachIdentity(finxactKycToken: string): void {
    this.finxactKycToken = finxactKycToken;
    if (this.config.debug) {
      console.log("[AgentPay] KYC identity attached");
    }
  }

  /**
   * Get current spending summary
   */
  async getSpendingSummary(): Promise<SpendingSummary> {
    const totalSpent = this.transactionHistory.reduce(
      (sum, tx) => sum + parseFloat(tx.amount),
      0
    );

    // Default to basic tier limits
    let tier = "basic";
    let perTransactionLimit = 100;
    let dailyLimit = 500;

    if (this.finxactKycToken) {
      tier = "verified";
      perTransactionLimit = 1000;
      dailyLimit = 5000;
    }

    return {
      agentId: this.agentId,
      tier,
      todaySpent: totalSpent,
      todayTransactions: this.transactionHistory.length,
      remainingDaily: Math.max(0, dailyLimit - totalSpent),
      perTransactionLimit,
      dailyLimit,
    };
  }

  /**
   * Get the agent's public identifier
   */
  getAgentId(): string {
    return this.agentId;
  }

  /**
   * Get wallet addresses
   */
  getWalletAddresses(): { solana: string; evm: string } {
    return {
      solana: this.solanaKeypair?.publicKey.toBase58() || "",
      evm: this.evmWallet?.address || "",
    };
  }

  /**
   * Get transaction history
   */
  getTransactionHistory(): PaymentResponse[] {
    return [...this.transactionHistory];
  }

  /**
   * Make an HTTP request with timeout
   */
  private async makeRequest(
    url: string,
    options: { method: string; headers?: Record<string, string>; body?: string }
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeout
    );

    try {
      const response = await fetch(url, {
        method: options.method,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": `FiservAgentPay/0.1.0 (${this.agentId})`,
          ...options.headers,
        },
        body: options.body,
        signal: controller.signal,
      });

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// Re-export all types
export default FiservAgentPay;
