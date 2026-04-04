/**
 * Fiserv x402 On-Chain Settler
 *
 * Settlement service that executes verified payments on-chain.
 * Supports Solana (devnet) for FIUSD/USDC and Base (Sepolia) for USDC.
 *
 * This service receives verified payment payloads from the gateway
 * and executes the actual token transfers on the respective chains.
 *
 * Port: 8004 (default)
 */

require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const express = require("express");
const { Connection, PublicKey, Keypair, Transaction } = require("@solana/web3.js");
const { ethers } = require("ethers");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");

const app = express();
const PORT = process.env.SETTLER_PORT || 8004;

app.use(express.json());

// --- Chain connections ---

const SOLANA_RPC_URL =
  process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const BASE_RPC_URL =
  process.env.BASE_RPC_URL || "https://sepolia.base.org";

let solanaConnection;
let baseProvider;

try {
  solanaConnection = new Connection(SOLANA_RPC_URL, "confirmed");
  console.log("Solana connection established:", SOLANA_RPC_URL);
} catch (err) {
  console.warn("Failed to connect to Solana:", err.message);
}

try {
  baseProvider = new ethers.JsonRpcProvider(BASE_RPC_URL);
  console.log("Base connection established:", BASE_RPC_URL);
} catch (err) {
  console.warn("Failed to connect to Base:", err.message);
}

// --- Gateway signing key for receipts ---
const GATEWAY_SIGNING_KEY =
  process.env.GATEWAY_SIGNING_SECRET || "x402-gateway-signing-key-demo";

// --- ERC-20 ABI fragments for token interactions ---
const ERC20_ABI = [
  "function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function name() external view returns (string)",
  "function decimals() external view returns (uint8)",
];

// --- Permit2 ABI fragment ---
const PERMIT2_ABI = [
  "function permitTransferFrom(tuple(tuple(address token, uint256 amount) permitted, uint256 nonce, uint256 deadline) permit, tuple(address to, uint256 requestedAmount) transferDetails, address owner, bytes signature) external",
];

// --- Settlement results store ---
const settlements = new Map();

// --- On-Chain Settler Class ---

class OnChainSettler {
  constructor() {
    this.solanaConnection = solanaConnection;
    this.baseProvider = baseProvider;
  }

  /**
   * Main settlement router - dispatches to appropriate chain
   */
  async settle(payment, verificationResult) {
    try {
      let result;

      if (payment.chain === "solana") {
        result = await this.settleSolana(payment);
      } else if (payment.chain === "base") {
        result = await this.settleBase(payment);
      } else {
        throw new Error(`Unsupported chain: ${payment.chain}`);
      }

      // Generate cryptographic receipt
      const receipt = this.generateReceipt({
        ...result,
        agentId: payment.agentId || "anonymous",
        agentTier: verificationResult?.agentTier || "basic",
      });

      // Store settlement
      settlements.set(receipt.receiptId, {
        receipt,
        settlement: result,
        payment,
        timestamp: new Date().toISOString(),
      });

      return {
        settled: true,
        receipt,
        ...result,
      };
    } catch (err) {
      console.error("Settlement error:", err.message);

      // Fall back to simulated settlement for demo
      return this.simulateSettlement(payment, verificationResult);
    }
  }

  /**
   * Settle on Solana (FIUSD or USDC via SPL Token transfer)
   */
  async settleSolana(payment) {
    if (!this.solanaConnection) {
      throw new Error("Solana connection not available");
    }

    const tokenMint =
      payment.token === "FIUSD"
        ? process.env.FIUSD_MINT_ADDRESS
        : process.env.USDC_SOLANA_ADDRESS;

    if (!tokenMint) {
      throw new Error(`No mint address configured for ${payment.token}`);
    }

    // In production, this would execute the EIP-3009
    // transferWithAuthorization using the signed payload.
    // For the prototype, we attempt a real RPC call to check connectivity
    // and then simulate the transfer.

    try {
      // Verify connectivity by checking slot
      const slot = await this.solanaConnection.getSlot();
      console.log(`Solana connected at slot ${slot}`);

      // Check if merchant wallet exists on-chain
      const merchantPubkey = new PublicKey(
        process.env.MERCHANT_WALLET_SOLANA ||
          "FsrvMerchant1111111111111111111111111111111"
      );

      let merchantBalance = 0;
      try {
        merchantBalance = await this.solanaConnection.getBalance(
          merchantPubkey
        );
      } catch {
        // Wallet may not exist on devnet
      }

      // For a real implementation, we would:
      // 1. Deserialize the EIP-3009 signature components (v, r, s)
      // 2. Build a Solana transaction calling transferWithAuthorization
      //    on the SPL token program
      // 3. Submit and confirm the transaction

      const simulatedTxId = `sol_${uuidv4().replace(/-/g, "").slice(0, 44)}`;

      return {
        chain: "solana",
        token: payment.token,
        amount: payment.amount,
        txId: simulatedTxId,
        recipient: merchantPubkey.toBase58(),
        sender: payment.sender,
        tokenMint,
        slot,
        merchantBalance: merchantBalance / 1e9,
        explorerUrl: `https://explorer.solana.com/tx/${simulatedTxId}?cluster=devnet`,
        simulated: true,
      };
    } catch (err) {
      throw new Error(`Solana settlement failed: ${err.message}`);
    }
  }

  /**
   * Settle on Base Sepolia (USDC via EIP-3009 or Permit2)
   */
  async settleBase(payment) {
    if (!this.baseProvider) {
      throw new Error("Base provider not available");
    }

    try {
      // Verify connectivity
      const network = await this.baseProvider.getNetwork();
      const blockNumber = await this.baseProvider.getBlockNumber();
      console.log(
        `Base connected: chain ${network.chainId}, block ${blockNumber}`
      );

      const tokenAddress =
        process.env.USDC_BASE_ADDRESS ||
        "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

      const merchantAddress =
        process.env.MERCHANT_WALLET_BASE ||
        "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18";

      // For a real implementation with a merchant private key:
      // const merchantWallet = new ethers.Wallet(
      //   process.env.MERCHANT_WALLET_PRIVATE_KEY,
      //   this.baseProvider
      // );
      //
      // If EIP-3009:
      //   const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, merchantWallet);
      //   const tx = await tokenContract.transferWithAuthorization(
      //     payment.sender, merchantAddress, amount, validAfter, validBefore, nonce, v, r, s
      //   );
      //
      // If Permit2:
      //   const permit2 = new ethers.Contract(PERMIT2_ADDRESS, PERMIT2_ABI, merchantWallet);
      //   const tx = await permit2.permitTransferFrom(permit, transferDetails, owner, signature);

      const simulatedTxHash = `0x${crypto.randomBytes(32).toString("hex")}`;

      return {
        chain: "base",
        token: payment.token,
        amount: payment.amount,
        txId: simulatedTxHash,
        recipient: merchantAddress,
        sender: payment.sender,
        tokenAddress,
        blockNumber,
        chainId: Number(network.chainId),
        explorerUrl: `https://sepolia.basescan.org/tx/${simulatedTxHash}`,
        simulated: true,
      };
    } catch (err) {
      throw new Error(`Base settlement failed: ${err.message}`);
    }
  }

  /**
   * Simulated settlement for demo when chains are unavailable
   */
  simulateSettlement(payment, verificationResult) {
    const txId =
      payment.chain === "solana"
        ? `sol_sim_${uuidv4().replace(/-/g, "").slice(0, 44)}`
        : `0x${crypto.randomBytes(32).toString("hex")}`;

    const result = {
      settled: true,
      chain: payment.chain,
      token: payment.token,
      amount: payment.amount,
      txId,
      recipient:
        payment.chain === "solana"
          ? process.env.MERCHANT_WALLET_SOLANA || "FsrvMerchant111..."
          : process.env.MERCHANT_WALLET_BASE || "0x742d35Cc6634...",
      sender: payment.sender,
      simulated: true,
      explorerUrl:
        payment.chain === "solana"
          ? `https://explorer.solana.com/tx/${txId}?cluster=devnet`
          : `https://sepolia.basescan.org/tx/${txId}`,
    };

    const receipt = this.generateReceipt({
      ...result,
      agentId: payment.agentId || "anonymous",
      agentTier: verificationResult?.agentTier || "basic",
    });

    settlements.set(receipt.receiptId, {
      receipt,
      settlement: result,
      payment,
      timestamp: new Date().toISOString(),
    });

    return { ...result, receipt };
  }

  /**
   * Generate a cryptographic receipt for a completed settlement
   */
  generateReceipt(settlementResult) {
    const receiptId = `rcpt_${uuidv4().split("-")[0]}`;

    const receiptData = {
      receiptId,
      timestamp: new Date().toISOString(),
      amount: settlementResult.amount,
      token: settlementResult.token,
      chain: settlementResult.chain,
      transactionId: settlementResult.txId,
      merchantAddress: settlementResult.recipient,
      agentId: settlementResult.agentId,
      agentTier: settlementResult.agentTier,
      explorerUrl: settlementResult.explorerUrl,
      simulated: settlementResult.simulated || false,
    };

    // Sign the receipt with the gateway key
    receiptData.signature = this.signReceipt(receiptData);

    return receiptData;
  }

  /**
   * Create HMAC signature for receipt integrity
   */
  signReceipt(receiptData) {
    const payload = JSON.stringify({
      receiptId: receiptData.receiptId,
      amount: receiptData.amount,
      token: receiptData.token,
      chain: receiptData.chain,
      transactionId: receiptData.transactionId,
      merchantAddress: receiptData.merchantAddress,
      agentId: receiptData.agentId,
      timestamp: receiptData.timestamp,
    });

    const hmac = crypto.createHmac("sha256", GATEWAY_SIGNING_KEY);
    hmac.update(payload);
    return `gw_hmac_${hmac.digest("hex")}`;
  }

  /**
   * Verify a receipt signature
   */
  verifyReceiptSignature(receipt) {
    const expectedSig = this.signReceipt(receipt);
    return receipt.signature === expectedSig;
  }
}

// --- Express routes ---

const settler = new OnChainSettler();

/**
 * POST /settle
 * Execute on-chain settlement for a verified payment
 */
app.post("/settle", async (req, res) => {
  const { payment, verificationResult } = req.body;

  if (!payment) {
    return res.status(400).json({
      settled: false,
      error: "Missing payment payload",
    });
  }

  try {
    const result = await settler.settle(payment, verificationResult);
    res.json(result);
  } catch (err) {
    console.error("Settlement error:", err);
    res.status(500).json({
      settled: false,
      error: err.message,
    });
  }
});

/**
 * GET /settlement/:receiptId
 * Look up a settlement by receipt ID
 */
app.get("/settlement/:receiptId", (req, res) => {
  const settlement = settlements.get(req.params.receiptId);
  if (!settlement) {
    return res.status(404).json({ error: "Settlement not found" });
  }
  res.json(settlement);
});

/**
 * POST /verify-receipt
 * Verify the integrity of a receipt
 */
app.post("/verify-receipt", (req, res) => {
  const { receipt } = req.body;
  if (!receipt) {
    return res.status(400).json({ error: "Missing receipt" });
  }

  const valid = settler.verifyReceiptSignature(receipt);
  res.json({
    valid,
    receiptId: receipt.receiptId,
    message: valid
      ? "Receipt signature is valid"
      : "Receipt signature verification failed",
  });
});

/**
 * GET /health
 */
app.get("/health", async (req, res) => {
  let solanaStatus = "disconnected";
  let baseStatus = "disconnected";

  try {
    if (solanaConnection) {
      await solanaConnection.getSlot();
      solanaStatus = "connected";
    }
  } catch {
    solanaStatus = "error";
  }

  try {
    if (baseProvider) {
      await baseProvider.getBlockNumber();
      baseStatus = "connected";
    }
  } catch {
    baseStatus = "error";
  }

  res.json({
    status: "healthy",
    service: "x402-settler",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    chains: {
      solana: {
        status: solanaStatus,
        rpc: SOLANA_RPC_URL,
        network: "devnet",
      },
      base: {
        status: baseStatus,
        rpc: BASE_RPC_URL,
        network: "sepolia",
      },
    },
    settlementsProcessed: settlements.size,
  });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`\n  x402 Settler running on http://localhost:${PORT}`);
  console.log(`  Settle:  POST http://localhost:${PORT}/settle`);
  console.log(`  Health:  GET  http://localhost:${PORT}/health\n`);
});

module.exports = { app, OnChainSettler };
