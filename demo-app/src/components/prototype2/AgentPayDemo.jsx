import { useState, useEffect } from 'react'
import { useTraceLog } from '../../hooks/useTraceLog'
import { usePrototype2 } from '../../hooks/usePrototype2'
import useApiHealth from '../../hooks/useApiHealth'
import LiveTracePanel from '../shared/LiveTracePanel'
import StatCard from '../shared/StatCard'
import DataTable from '../shared/DataTable'
import LiveIndicator from '../shared/LiveIndicator'
import AnimatedCounter from '../shared/AnimatedCounter'

const AGENT_TIERS = [
  { value: 'basic', label: 'Basic', limit: '$100/txn', desc: 'KYC-lite, email verified' },
  { value: 'verified', label: 'Verified', limit: '$1,000/txn', desc: 'KYC Level 2, ID verified' },
  { value: 'premium', label: 'Premium', limit: '$10,000/txn', desc: 'KYC Level 3, enterprise' },
]

const DEFAULT_PRODUCTS = [
  { id: 'PROD_001', name: 'Nike Air Max 90', price: 129.99, category: 'Footwear', icon: 'S' },
  { id: 'PROD_002', name: 'MacBook Pro M4', price: 2499.00, category: 'Electronics', icon: 'L' },
  { id: 'PROD_003', name: 'Organic Coffee Beans (1lb)', price: 18.99, category: 'Grocery', icon: 'C' },
  { id: 'PROD_004', name: 'Wireless Noise-Canceling Headphones', price: 349.99, category: 'Electronics', icon: 'H' },
  { id: 'PROD_005', name: 'Premium Yoga Mat', price: 89.00, category: 'Fitness', icon: 'Y' },
  { id: 'PROD_006', name: 'Smart Home Hub', price: 199.99, category: 'Smart Home', icon: 'I' },
  { id: 'PROD_007', name: 'Artisan Chocolate Box', price: 45.00, category: 'Gourmet', icon: 'G' },
  { id: 'PROD_008', name: 'Running Watch GPS', price: 299.99, category: 'Wearables', icon: 'W' },
]

const X402_FLOW_STEPS = [
  { label: 'Request', desc: 'Agent sends HTTP GET' },
  { label: 'HTTP 402', desc: 'Server returns payment instructions' },
  { label: 'Sign Payment', desc: 'Agent signs EIP-3009' },
  { label: 'Verify Identity', desc: 'KYC + spend check' },
  { label: 'On-Chain Settle', desc: 'Solana/Base settlement' },
  { label: 'Receipt', desc: 'Cryptographic proof' },
]

export default function AgentPayDemo() {
  const { entries, addTrace, clearTrace } = useTraceLog()
  const { getProducts, getX402Status, triggerAgentPurchase, loading, error } = usePrototype2(addTrace)
  const health = useApiHealth()

  const [agentTier, setAgentTier] = useState('premium')
  const [products, setProducts] = useState(DEFAULT_PRODUCTS)
  const [transactions, setTransactions] = useState([])
  const [receipt, setReceipt] = useState(null)
  const [flowStep, setFlowStep] = useState(-1)
  const [stats, setStats] = useState({
    totalTxns: 0,
    totalRevenue: 0,
    avgPayment: 0,
    feeSavings: 0,
  })

  // Try to load products from backend
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const result = await getProducts()
        if (result) {
          const p = result.products || result
          if (Array.isArray(p) && p.length > 0) {
            setProducts(p)
          }
        }
      } catch {
        // Use default products
      }
    }
    loadProducts()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePurchase = async (product) => {
    setReceipt(null)
    setFlowStep(0)

    // Animate through flow steps
    const stepDelay = (step) => new Promise(resolve => {
      setTimeout(() => {
        setFlowStep(step)
        resolve()
      }, 400)
    })

    await stepDelay(0)
    await stepDelay(1)
    await stepDelay(2)

    const result = await triggerAgentPurchase(product)

    await stepDelay(3)
    await stepDelay(4)
    await stepDelay(5)

    if (result) {
      const cardFee = product.price * 0.029 + 0.30 // typical card fee
      const x402Fee = result.fee || product.price * 0.001

      setReceipt({
        receiptId: result.receiptId,
        product: product.name,
        amount: product.price,
        fee: x402Fee,
        cardFeeWouldBe: cardFee,
        savings: cardFee - x402Fee,
        signature: result.signature || '5Kz9...3mF',
        timestamp: new Date().toISOString(),
      })

      setTransactions((prev) => [[
        new Date().toLocaleTimeString(),
        product.name,
        `$${(Number(product.price) || 0).toFixed(2)}`,
        'x402 Agent',
        `$${(Number(x402Fee) || 0).toFixed(2)}`,
        'Confirmed',
      ], ...prev])

      setStats((prev) => {
        const newTxns = prev.totalTxns + 1
        const newRevenue = prev.totalRevenue + product.price
        return {
          totalTxns: newTxns,
          totalRevenue: newRevenue,
          avgPayment: newRevenue / newTxns,
          feeSavings: prev.feeSavings + (cardFee - x402Fee),
        }
      })
    }

    setTimeout(() => setFlowStep(-1), 3000)
  }

  const handleX402Status = async () => {
    await getX402Status()
  }

  return (
    <div className="demo-split">
      <div className="demo-split__main">
        {/* API Status */}
        <div className="demo-status-bar">
          <LiveIndicator
            status={health.p2}
            label={health.p2 === 'online' ? 'Backend Connected (port 8002)' : 'Backend Offline (port 8002)'}
          />
          {error && <span className="demo-error" role="alert">{error}</span>}
        </div>

        {/* Agent Identity Selector */}
        <div className="demo-controls">
          <div className="demo-controls__row">
            <div className="demo-controls__left">
              <h3 className="demo-controls__title">Agent Identity Tier</h3>
              <div className="demo-controls__radio-group">
                {AGENT_TIERS.map((tier) => (
                  <label key={tier.value} className={`radio-card ${agentTier === tier.value ? 'radio-card--active' : ''}`}>
                    <input
                      type="radio"
                      name="agent-tier"
                      value={tier.value}
                      checked={agentTier === tier.value}
                      onChange={(e) => setAgentTier(e.target.value)}
                    />
                    <span className="radio-card__label">{tier.label}</span>
                    <span className="radio-card__desc">{tier.limit}</span>
                    <span className="radio-card__desc">{tier.desc}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="demo-controls__right">
              <button
                className="btn btn--primary"
                onClick={handleX402Status}
                disabled={loading}
              >
                View x402 Protocol Status
              </button>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="stat-cards-grid">
          <StatCard
            label="Agent Transactions"
            value={<AnimatedCounter value={stats.totalTxns} decimals={0} />}
            color="navy"
          />
          <StatCard
            label="Agent Revenue"
            value={<AnimatedCounter value={stats.totalRevenue} prefix="$" decimals={2} />}
            color="teal"
          />
          <StatCard
            label="Avg Agent Payment"
            value={<AnimatedCounter value={stats.avgPayment} prefix="$" decimals={2} />}
            color="green"
          />
          <StatCard
            label="Card Fee Savings"
            value={<AnimatedCounter value={stats.feeSavings} prefix="$" decimals={2} />}
            color="orange"
            trend={stats.feeSavings > 0 ? `+$${stats.feeSavings.toFixed(2)} saved` : undefined}
          />
        </div>

        {/* x402 Flow Animation */}
        <div className="x402-flow">
          <h4 className="x402-flow__title">x402 Payment Flow</h4>
          <div className="x402-flow__steps" role="list" aria-label="x402 payment flow steps">
            {X402_FLOW_STEPS.map((step, i) => (
              <div key={i} className="x402-flow__item" role="listitem">
                <div className={`x402-flow__node ${i === flowStep ? 'x402-flow__node--active' : ''} ${i < flowStep ? 'x402-flow__node--done' : ''}`}>
                  <div className="x402-flow__number">
                    {i < flowStep ? '\u2713' : i + 1}
                  </div>
                  <div className="x402-flow__label">{step.label}</div>
                  <div className="x402-flow__desc">{step.desc}</div>
                </div>
                {i < X402_FLOW_STEPS.length - 1 && (
                  <div className={`x402-flow__arrow ${i < flowStep ? 'x402-flow__arrow--active' : ''}`} aria-hidden="true">
                    {'\u2192'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Product Catalog */}
        <div className="demo-section">
          <h4 className="demo-section__title">Product Catalog</h4>
          <div className="product-grid">
            {products.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-card__icon" aria-hidden="true">
                  {product.icon || product.name?.charAt(0) || '?'}
                </div>
                <div className="product-card__info">
                  <div className="product-card__name">{product.name}</div>
                  <div className="product-card__category">{product.category}</div>
                  <div className="product-card__price">${(Number(product.price) || 0).toFixed(2)}</div>
                </div>
                <button
                  className="btn btn--accent btn--small"
                  onClick={() => handlePurchase(product)}
                  disabled={loading}
                  aria-label={`Buy ${product.name} with AI Agent`}
                >
                  Buy with AI Agent
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Receipt Display */}
        {receipt && (
          <div className="receipt-panel" role="status" aria-label="Payment receipt">
            <h4 className="receipt-panel__title">Payment Receipt</h4>
            <div className="receipt-panel__body">
              <div className="receipt-row">
                <span>Receipt ID</span>
                <span className="receipt-row__value">{receipt.receiptId}</span>
              </div>
              <div className="receipt-row">
                <span>Product</span>
                <span className="receipt-row__value">{receipt.product}</span>
              </div>
              <div className="receipt-row">
                <span>Amount</span>
                <span className="receipt-row__value">${receipt.amount.toFixed(2)}</span>
              </div>
              <div className="receipt-row">
                <span>x402 Fee (0.1%)</span>
                <span className="receipt-row__value receipt-row__value--green">${receipt.fee.toFixed(2)}</span>
              </div>
              <div className="receipt-row">
                <span>Card Fee Would Be (2.9%+$0.30)</span>
                <span className="receipt-row__value receipt-row__value--red">${receipt.cardFeeWouldBe.toFixed(2)}</span>
              </div>
              <div className="receipt-row receipt-row--highlight">
                <span>You Saved</span>
                <span className="receipt-row__value receipt-row__value--green">${receipt.savings.toFixed(2)}</span>
              </div>
              <div className="receipt-row">
                <span>On-Chain Signature</span>
                <span className="receipt-row__value receipt-row__value--mono">{receipt.signature}</span>
              </div>
              <div className="receipt-row">
                <span>Timestamp</span>
                <span className="receipt-row__value">{new Date(receipt.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="demo-section">
          <h4 className="demo-section__title">Transaction History</h4>
          <DataTable
            headers={['Time', 'Product', 'Amount', 'Payment Type', 'Fee', 'Status']}
            rows={transactions}
          />
        </div>
      </div>

      <div className="demo-split__trace">
        <LiveTracePanel entries={entries} onClear={clearTrace} />
      </div>
    </div>
  )
}
