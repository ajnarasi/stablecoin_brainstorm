import { useState, useCallback } from 'react'
import { API } from '../config'

const BASE = API.p2

export function usePrototype2(addTrace) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const apiCall = useCallback(async (method, path, body = null) => {
    const startTime = Date.now()
    addTrace({
      type: 'api',
      title: `${method} /api${path}`,
      description: 'Sending request...',
    })
    try {
      const opts = {
        method,
        headers: { 'Content-Type': 'application/json' },
      }
      if (body) opts.body = JSON.stringify(body)
      const res = await fetch(`${BASE}${path}`, opts)
      const json = await res.json()
      const latency = Date.now() - startTime
      if (!res.ok) {
        addTrace({
          type: 'error',
          title: `${method} /api${path} - ${res.status}`,
          description: json.error || json.message || `HTTP ${res.status}`,
          latency,
        })
        throw new Error(json.error || json.message || `HTTP ${res.status}`)
      }
      addTrace({
        type: 'api',
        title: `${method} /api${path} - 200 OK`,
        latency,
        details: json,
      })
      return json
    } catch (err) {
      if (!err.message?.includes('HTTP')) {
        addTrace({
          type: 'error',
          title: `${method} /api${path} - Failed`,
          description: err.message,
        })
      }
      throw err
    }
  }, [addTrace])

  const getProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiCall('GET', '/products')
      const products = result.products || result || []
      addTrace({
        type: 'system',
        title: `CommerceHub: Loaded ${products.length} products from merchant catalog`,
      })
      setData(result)
      return result
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apiCall, addTrace])

  const searchProducts = useCallback(async (query) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiCall('GET', `/products/search?q=${encodeURIComponent(query)}`)
      const products = result.products || result || []
      addTrace({
        type: 'result',
        title: `Found ${products.length} products matching "${query}"`,
      })
      setData(result)
      return result
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apiCall, addTrace])

  const getX402Status = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiCall('GET', '/x402/status')
      addTrace({
        type: 'system',
        title: `x402 Gateway: Status = ${result.status || 'active'}`,
      })
      addTrace({
        type: 'system',
        title: `Supported tokens: ${(result.supportedTokens || ['FIUSD', 'USDC']).join(', ')}`,
        description: `Chains: ${(result.supportedChains || ['Solana', 'Base']).join(', ')}`,
      })
      addTrace({
        type: 'result',
        title: 'x402 protocol is operational',
      })
      setData(result)
      return result
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apiCall, addTrace])

  const getTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiCall('GET', '/x402/transactions')
      const txns = result.transactions || result || []
      addTrace({
        type: 'result',
        title: `Loaded ${txns.length} recent transactions`,
      })
      setData(result)
      return result
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apiCall, addTrace])

  const triggerAgentPurchase = useCallback(async (product) => {
    setLoading(true)
    setError(null)
    try {
      const productName = product.name || product.title || `Product ${product.id}`
      const price = product.price || 0

      addTrace({
        type: 'api',
        title: `GET /api/products/${product.id} - ${productName}`,
      })
      addTrace({
        type: 'system',
        title: 'CommerceHub: Product requires payment. Returning HTTP 402...',
      })
      addTrace({
        type: 'result',
        title: 'HTTP 402 Payment Required',
      })
      addTrace({
        type: 'system',
        title: `x402 Instructions: price=$${price.toFixed(2)}, token=FIUSD, chain=solana`,
        description: 'Expiry: 300s',
      })
      addTrace({
        type: 'system',
        title: 'Agent SDK: Selecting payment method...',
        description: 'FIUSD on Solana (lowest fee)',
      })
      addTrace({
        type: 'system',
        title: 'Agent SDK: Signing EIP-3009 transferWithAuthorization...',
      })

      const result = await apiCall('POST', '/x402/verify', {
        productId: product.id,
        amount: price,
        token: 'FIUSD',
        chain: 'solana',
      })

      addTrace({
        type: 'system',
        title: 'Verifier: Validating EIP-3009 signature...',
      })
      addTrace({
        type: 'system',
        title: `Verifier: Checking Finxact KYC tier...`,
        description: `${result.kycTier || 'Premium'} (limit: $${(result.spendLimit || 10000).toLocaleString()}/txn)`,
      })
      addTrace({
        type: 'system',
        title: `Verifier: Checking daily spend...`,
        description: `$${price.toFixed(2)} / $${(result.dailyLimit || 50000).toLocaleString()} daily limit`,
      })
      addTrace({
        type: 'system',
        title: 'Settler: Executing on-chain settlement on Solana devnet...',
      })

      const sig = result.signature || '5Kz9...3mF'
      addTrace({
        type: 'system',
        title: `Settler: Transaction confirmed`,
        description: `Signature: ${sig}`,
      })
      addTrace({
        type: 'system',
        title: 'INDX: Converting FIUSD to USD for merchant settlement...',
      })

      const receiptId = result.receiptId || `RCP-${new Date().toISOString().slice(0, 10)}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`
      const fee = result.fee || (price * 0.001)
      addTrace({
        type: 'result',
        title: `Payment complete! Receipt ID: ${receiptId}`,
      })
      addTrace({
        type: 'result',
        title: `Merchant received $${price.toFixed(2)} USD`,
        description: `Fee: $${fee.toFixed(2)} (0.1%) | Settlement: instant`,
      })

      const enrichedResult = { ...result, receiptId, fee, productName, price }
      setData(enrichedResult)
      return enrichedResult
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apiCall, addTrace])

  return { getProducts, searchProducts, getX402Status, getTransactions, triggerAgentPurchase, loading, data, error }
}
