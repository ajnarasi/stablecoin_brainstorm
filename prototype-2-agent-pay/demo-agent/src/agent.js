/**
 * Fiserv x402 Demo Agent
 *
 * Claude-powered shopping agent that uses the Anthropic API with tool_use
 * to search products, inspect details, and make purchases via x402 payments.
 *
 * The agent is constrained to exactly 3 tools:
 *   1. search_products(query)   - Search the product catalog
 *   2. get_product(product_id)  - Get product details (triggers x402 if not paid)
 *   3. purchase(product_id)     - Purchase a product via x402 payment
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... node src/agent.js
 *   ANTHROPIC_API_KEY=sk-ant-... node src/agent.js --demo
 */

require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const Anthropic = require("@anthropic-ai/sdk");
const { Keypair } = require("@solana/web3.js");
const nacl = require("tweetnacl");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

// --- Configuration ---

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:8002";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const AGENT_WALLET_PRIVATE_KEY =
  process.env.AGENT_WALLET_PRIVATE_KEY || "demo-agent-key-for-prototype";

// --- Agent Wallet ---

let agentKeypair;
try {
  const seed = Buffer.from(
    AGENT_WALLET_PRIVATE_KEY.padEnd(32, "0").slice(0, 32),
    "utf-8"
  );
  agentKeypair = Keypair.fromSeed(seed);
} catch {
  agentKeypair = Keypair.generate();
}

const AGENT_ID = `agent_${crypto
  .createHash("sha256")
  .update(agentKeypair.publicKey.toBase58())
  .digest("hex")
  .slice(0, 12)}`;

console.log(`Agent ID: ${AGENT_ID}`);
console.log(`Agent Wallet: ${agentKeypair.publicKey.toBase58()}`);
console.log(`Gateway: ${GATEWAY_URL}\n`);

// --- Tool Definitions ---

const TOOLS = [
  {
    name: "search_products",
    description:
      "Search the product catalog by name, category, or description. Returns a list of matching products with basic info (id, name, price, category). Use this to find products the user is looking for.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Search query - can be a product name, category (footwear, electronics, clothing, accessories, home), or description keyword.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_product",
    description:
      "Get detailed information about a specific product by its ID. This requires an x402 payment - the gateway will return a 402 Payment Required status which the agent SDK handles automatically. Returns full product details including fulfillment info after payment.",
    input_schema: {
      type: "object",
      properties: {
        product_id: {
          type: "string",
          description:
            "The product ID (e.g., 'prod_001'). Get this from search results.",
        },
      },
      required: ["product_id"],
    },
  },
  {
    name: "purchase",
    description:
      "Purchase a product via x402 payment. This executes the full payment flow: signs the payment with the agent wallet, submits it to the gateway, and receives a cryptographic receipt with on-chain settlement confirmation.",
    input_schema: {
      type: "object",
      properties: {
        product_id: {
          type: "string",
          description: "The product ID to purchase.",
        },
        size: {
          type: "string",
          description:
            "Size selection for clothing/footwear items (e.g., '11', 'M', '32x30').",
        },
      },
      required: ["product_id"],
    },
  },
];

// --- Tool Implementations ---

async function searchProducts(query) {
  try {
    const response = await fetch(
      `${GATEWAY_URL}/api/products/search?q=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    return data;
  } catch (err) {
    return { error: `Failed to search products: ${err.message}` };
  }
}

async function getProduct(productId) {
  try {
    // First request without payment - will get 402
    const response = await fetch(`${GATEWAY_URL}/api/products/${productId}`);
    const data = await response.json();

    if (response.status === 402) {
      // Return the product preview info from the 402 response
      return {
        paymentRequired: true,
        product: data.product,
        price: data.paymentInstructions?.price,
        currency: data.paymentInstructions?.currency,
        acceptedTokens: data.paymentInstructions?.acceptedTokens?.map(
          (t) => `${t.token} on ${t.chain}`
        ),
        message: `Product found but requires payment of $${data.paymentInstructions?.price} to access full details. Use the purchase tool to buy it.`,
      };
    }

    return data;
  } catch (err) {
    return { error: `Failed to get product: ${err.message}` };
  }
}

async function purchase(productId, size) {
  try {
    // Step 1: Get payment instructions via 402
    const initialResponse = await fetch(
      `${GATEWAY_URL}/api/products/${productId}`
    );

    if (initialResponse.status !== 402) {
      const data = await initialResponse.json();
      return {
        status: "already_paid",
        product: data.product || data,
        message: "This product has already been paid for.",
      };
    }

    const initialData = await initialResponse.json();
    const instructions = initialData.paymentInstructions;

    if (!instructions) {
      return { error: "No payment instructions received" };
    }

    // Step 2: Select token (prefer FIUSD on Solana)
    const selectedToken =
      instructions.acceptedTokens.find(
        (t) => t.token === "FIUSD" && t.chain === "solana"
      ) ||
      instructions.acceptedTokens.find((t) => t.chain === "solana") ||
      instructions.acceptedTokens[0];

    // Step 3: Sign payment
    const nonce = crypto.randomBytes(16).toString("hex");

    const paymentPayload = {
      orderId: instructions.orderId,
      amount: instructions.price,
      token: selectedToken.token,
      chain: selectedToken.chain,
      tokenAddress: selectedToken.address,
      recipient: selectedToken.recipient,
      paymentMethod: "EIP-3009",
      sender: agentKeypair.publicKey.toBase58(),
      agentId: AGENT_ID,
      nonce,
      timestamp: Math.floor(Date.now() / 1000),
      expiry: instructions.expiry,
    };

    // Sign the payment message
    const message = JSON.stringify({
      orderId: paymentPayload.orderId,
      amount: paymentPayload.amount,
      token: paymentPayload.token,
      chain: paymentPayload.chain,
      sender: paymentPayload.sender,
      nonce: paymentPayload.nonce,
    });

    const messageBytes = new TextEncoder().encode(message);
    const signature = nacl.sign.detached(messageBytes, agentKeypair.secretKey);
    paymentPayload.signature = Buffer.from(signature).toString("base64");

    if (size) {
      paymentPayload.metadata = { size };
    }

    // Step 4: Submit payment
    const paidResponse = await fetch(
      `${GATEWAY_URL}/api/products/${productId}`,
      {
        headers: {
          "X-PAYMENT": JSON.stringify(paymentPayload),
          "Content-Type": "application/json",
        },
      }
    );

    const paidData = await paidResponse.json();

    if (paidResponse.status === 402) {
      return {
        status: "payment_failed",
        errors: paidData.errors,
        message: "Payment verification failed. Please try again.",
      };
    }

    // Step 5: Return result with receipt
    return {
      status: "purchased",
      product: paidData.product,
      receipt: paidData.receipt,
      settlement: paidData.settlement,
      amount: instructions.price,
      token: selectedToken.token,
      chain: selectedToken.chain,
      message: `Successfully purchased ${paidData.product?.name || productId} for $${instructions.price} ${selectedToken.token} on ${selectedToken.chain}.`,
    };
  } catch (err) {
    return { error: `Purchase failed: ${err.message}` };
  }
}

// --- Tool Executor ---

async function executeTool(toolName, toolInput) {
  switch (toolName) {
    case "search_products":
      return await searchProducts(toolInput.query);
    case "get_product":
      return await getProduct(toolInput.product_id);
    case "purchase":
      return await purchase(toolInput.product_id, toolInput.size);
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// --- Agent Loop ---

async function runAgent(userMessage) {
  if (!ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required");
    console.log("\nRunning in simulation mode...\n");
    return runSimulation(userMessage);
  }

  const client = new Anthropic();

  const systemPrompt = `You are a shopping assistant agent powered by Fiserv's x402 payment protocol. You help users find and purchase products from the CommerceHub marketplace.

You have access to a catalog of 20 products across categories: footwear, electronics, clothing, accessories, and home.

Your workflow:
1. When a user wants to find something, use search_products to search the catalog
2. When they want details, use get_product (note: this requires x402 payment)
3. When they want to buy, use purchase to execute the payment

You pay for purchases using stablecoins (FIUSD or USDC) on blockchain (Solana or Base).
Payments are signed cryptographically and settled on-chain.
After each purchase, share the receipt ID and transaction details with the user.

Be helpful, concise, and transparent about payment amounts before purchasing.
Agent ID: ${AGENT_ID}
Wallet: ${agentKeypair.publicKey.toBase58()}`;

  let messages = [{ role: "user", content: userMessage }];

  console.log(`\nUser: ${userMessage}\n`);

  // Agentic loop - keep going until no more tool calls
  while (true) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      tools: TOOLS,
      messages,
    });

    // Collect all text blocks and tool use blocks
    let hasToolUse = false;
    const toolResults = [];

    for (const block of response.content) {
      if (block.type === "text") {
        console.log(`Agent: ${block.text}`);
      } else if (block.type === "tool_use") {
        hasToolUse = true;
        console.log(`\n[Tool Call: ${block.name}]`);
        console.log(`  Input: ${JSON.stringify(block.input)}`);

        const result = await executeTool(block.name, block.input);
        console.log(
          `  Result: ${JSON.stringify(result).slice(0, 200)}${
            JSON.stringify(result).length > 200 ? "..." : ""
          }\n`
        );

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }
    }

    // If no tool calls, we are done
    if (!hasToolUse || response.stop_reason === "end_turn") {
      break;
    }

    // Add assistant response and tool results to conversation
    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });
  }

  console.log("\n--- Agent session complete ---\n");
}

// --- Simulation mode (no API key) ---

async function runSimulation(userMessage) {
  console.log(`Simulating agent for: "${userMessage}"\n`);

  // Step 1: Search
  console.log("[Step 1] Searching products...");
  const searchResult = await searchProducts("Nike Air Max");
  console.log(`  Found ${searchResult.count || 0} products`);
  if (searchResult.products) {
    searchResult.products.forEach((p) => {
      console.log(`    - ${p.name} ($${p.price}) [${p.id}]`);
    });
  }

  // Step 2: Get product details
  console.log("\n[Step 2] Getting product details (triggers 402)...");
  const productResult = await getProduct("prod_001");
  console.log(`  ${productResult.message || JSON.stringify(productResult)}`);

  // Step 3: Purchase
  console.log("\n[Step 3] Purchasing via x402...");
  const purchaseResult = await purchase("prod_001", "11");
  console.log(`  Status: ${purchaseResult.status}`);
  if (purchaseResult.receipt) {
    console.log(`  Receipt ID: ${purchaseResult.receipt.receiptId}`);
    console.log(`  TX ID: ${purchaseResult.receipt.transactionId}`);
    console.log(`  Amount: $${purchaseResult.amount} ${purchaseResult.token}`);
    console.log(`  Chain: ${purchaseResult.chain}`);
  }
  console.log(`  ${purchaseResult.message || ""}`);

  console.log("\n--- Simulation complete ---\n");
}

// --- Main ---

const args = process.argv.slice(2);
const isDemoMode = args.includes("--demo");

const demoMessage =
  "I want to buy Nike Air Max 90 in size 11. Find it, check the price, and purchase it for me.";
const userMessage = isDemoMode
  ? demoMessage
  : args.filter((a) => !a.startsWith("--")).join(" ") || demoMessage;

runAgent(userMessage).catch((err) => {
  console.error("Agent error:", err);
  process.exit(1);
});
