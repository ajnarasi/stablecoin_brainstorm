import CodeBlock from '../shared/CodeBlock'
import DataTable from '../shared/DataTable'

const tsSDKCode = `import { AgentPaySDK } from '@fiserv/agent-pay-sdk';

const agent = new AgentPaySDK({
  apiKey: 'ak_live_...',
  identity: {
    tier: 'premium',
    walletAddress: '0x1234...5678',
  },
  defaultChain: 'solana',
  defaultToken: 'FIUSD',
});

// Agent discovers product and pays in one HTTP cycle
const receipt = await agent.purchase({
  url: 'https://merchant.com/api/products/PROD_001',
  maxAmount: 500.00,
  currency: 'USD',
});

console.log(receipt.id);        // "RCP-2026-04-03-001"
console.log(receipt.fee);       // 0.13 (0.1%)
console.log(receipt.signature); // "5Kz9...3mF"`

const pythonSDKCode = `from fiserv_agent_pay import AgentPaySDK

agent = AgentPaySDK(
    api_key="ak_live_...",
    identity={
        "tier": "premium",
        "wallet_address": "0x1234...5678",
    },
    default_chain="solana",
    default_token="FIUSD",
)

# Agent discovers product and pays in one HTTP cycle
receipt = agent.purchase(
    url="https://merchant.com/api/products/PROD_001",
    max_amount=500.00,
    currency="USD",
)

print(receipt.id)        # "RCP-2026-04-03-001"
print(receipt.fee)       # 0.13 (0.1%)
print(receipt.signature) # "5Kz9...3mF"`

const x402FlowJSON = `// 1. Agent sends GET request to merchant endpoint
GET /api/products/PROD_001 HTTP/1.1
Host: merchant.com
X-Agent-Identity: agent_id_12345

// 2. Server responds with HTTP 402 + payment instructions
HTTP/1.1 402 Payment Required
X-Payment-Token: FIUSD
X-Payment-Amount: 129.99
X-Payment-Chain: solana
X-Payment-Address: 0xMerchant...
X-Payment-Expiry: 300
X-Payment-Version: x402-v2

// 3. Agent signs EIP-3009 transferWithAuthorization
POST /api/x402/verify HTTP/1.1
Content-Type: application/json
{
  "productId": "PROD_001",
  "amount": 129.99,
  "token": "FIUSD",
  "chain": "solana",
  "signature": "0xAgentSignature...",
  "nonce": "unique_nonce_12345"
}

// 4. Server verifies, settles, and returns receipt
HTTP/1.1 200 OK
{
  "receiptId": "RCP-2026-04-03-001",
  "status": "confirmed",
  "fee": 0.13,
  "signature": "5Kz9...3mF"
}`

export default function AgentPayDocs() {
  return (
    <div className="docs-content">
      {/* Problem Statement */}
      <section className="docs-section">
        <h3 className="docs-section__title">The Problem</h3>
        <div className="docs-callout docs-callout--problem">
          <p>
            AI agents cannot complete purchases on existing payment rails. Card networks require
            human authentication (3DS challenges, CVV entry, biometric verification) that autonomous
            agents cannot perform. This blocks the entire agentic commerce ecosystem.
          </p>
          <p>
            The result: AI agents that can browse, compare, and recommend products but must hand off
            to humans for the final purchase step -- breaking the autonomous workflow.
          </p>
        </div>
      </section>

      {/* Solution */}
      <section className="docs-section">
        <h3 className="docs-section__title">The Solution</h3>
        <div className="docs-callout docs-callout--solution">
          <p>
            The x402 protocol on CommerceHub enables agent-native payments. When an agent encounters
            a purchase, the server returns HTTP 402 with payment instructions. The agent signs a
            payment authorization and the transaction settles in a single HTTP request-response cycle.
          </p>
          <ul className="docs-list">
            <li>No human authentication required -- fully autonomous agent payments</li>
            <li>Sub-3-second end-to-end settlement (vs 30+ seconds for card payments)</li>
            <li>0.1% transaction fee (vs 2.9% + $0.30 for card payments)</li>
            <li>Cryptographic receipt provides non-repudiation proof</li>
          </ul>
        </div>
      </section>

      {/* Distribution */}
      <section className="docs-section">
        <h3 className="docs-section__title">Distribution Advantage</h3>
        <div className="docs-callout docs-callout--info">
          <p>
            6 million Clover merchants become agent-payable with a single software update to CommerceHub.
            No merchant integration work required -- the x402 gateway sits in front of existing
            CommerceHub APIs.
          </p>
          <div className="docs-grid docs-grid--3">
            <div className="docs-card">
              <h4>6M+ Merchants</h4>
              <p>Instant access to the largest US merchant network</p>
            </div>
            <div className="docs-card">
              <h4>Zero Integration</h4>
              <p>Gateway sits in front of existing CommerceHub APIs</p>
            </div>
            <div className="docs-card">
              <h4>One Update</h4>
              <p>Software update enables x402 across entire fleet</p>
            </div>
          </div>
        </div>
      </section>

      {/* SDK Reference */}
      <section className="docs-section">
        <h3 className="docs-section__title">SDK Reference</h3>
        <h4 className="docs-subsection__title">TypeScript SDK</h4>
        <CodeBlock language="typescript" code={tsSDKCode} />

        <h4 className="docs-subsection__title">Python SDK</h4>
        <CodeBlock language="python" code={pythonSDKCode} />
      </section>

      {/* x402 Protocol */}
      <section className="docs-section">
        <h3 className="docs-section__title">x402 Protocol Flow (HTTP 402 Spec v2)</h3>
        <CodeBlock language="http" code={x402FlowJSON} />
        <div className="docs-callout docs-callout--info" style={{ marginTop: '16px' }}>
          <p>
            The x402 protocol extends HTTP 402 (Payment Required) with structured payment instructions
            in response headers. The agent SDK parses these headers, constructs and signs a payment
            authorization, and submits it to the verification endpoint -- all within a single
            request-response cycle.
          </p>
        </div>
      </section>

      {/* Supported Assets */}
      <section className="docs-section">
        <h3 className="docs-section__title">Supported Tokens and Chains</h3>
        <DataTable
          headers={['Token', 'Chain', 'Settlement', 'Fee', 'Auth Method']}
          rows={[
            ['FIUSD', 'Solana', 'Instant', '0.1%', 'EIP-3009 transferWithAuthorization'],
            ['USDC', 'Solana', 'Instant', '0.1%', 'EIP-3009 transferWithAuthorization'],
            ['USDC', 'Base', '~2 seconds', '0.1%', 'Permit2 (EIP-2612)'],
          ]}
        />
      </section>

      {/* API Endpoints */}
      <section className="docs-section">
        <h3 className="docs-section__title">API Reference</h3>
        <DataTable
          headers={['Method', 'Path', 'Description']}
          rows={[
            ['GET', '/api/products', 'List all products in the merchant catalog'],
            ['GET', '/api/products/search?q={query}', 'Search products by name or category'],
            ['GET', '/api/x402/status', 'Get x402 gateway status and supported tokens/chains'],
            ['GET', '/api/x402/transactions', 'List recent x402 transactions'],
            ['POST', '/api/x402/verify', 'Submit signed payment for verification and settlement'],
          ]}
        />
      </section>
    </div>
  )
}
