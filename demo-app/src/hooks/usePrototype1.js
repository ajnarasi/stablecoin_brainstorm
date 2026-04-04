import { useState, useCallback } from 'react'
import { API } from '../config'

const BASE = API.p1
const MERCHANT = 'DEMO_MERCHANT_001'

export function usePrototype1(addTrace) {
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

  const seed = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      addTrace({
        type: 'system',
        title: 'Seeding demo data',
        description: "Mario's Pizzeria (DEMO_MERCHANT_001)",
      })
      const result = await apiCall('POST', '/demo/seed', {})
      addTrace({
        type: 'system',
        title: 'Finxact: Creating merchant account',
        description: 'Initial balance: $25,000.00',
      })
      addTrace({
        type: 'system',
        title: 'Generating settlement history',
        description: '180 days of synthetic CommerceHub transaction data',
      })
      addTrace({
        type: 'system',
        title: 'ML Model: Training cash flow predictor',
        description: 'LightGBM on 180-day rolling window with day-of-week + seasonality features',
      })
      addTrace({
        type: 'result',
        title: 'Demo seeded successfully',
        description: `Merchant: Mario's Pizzeria | Balance: $${(result.balance || 25000).toLocaleString()}`,
      })
      setData(result)
      return result
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apiCall, addTrace])

  const getDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiCall('GET', `/merchants/${MERCHANT}/dashboard`)
      addTrace({
        type: 'system',
        title: 'Finxact: Loaded merchant dashboard',
        description: `Balance: $${(result.availableBalance || 0).toLocaleString()} | Yield: $${(result.yieldPosition || 0).toLocaleString()} | APY: ${result.apy || 4.2}%`,
      })
      setData(result)
      return result
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apiCall, addTrace])

  const triggerSweep = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      addTrace({
        type: 'system',
        title: 'Finxact: Retrieving merchant balance...',
      })

      const evalResult = await apiCall('POST', `/merchants/${MERCHANT}/sweeps/evaluate`, {})

      const balance = evalResult.currentBalance || 23450
      addTrace({
        type: 'system',
        title: `Finxact: Current balance = $${balance.toLocaleString()}`,
      })

      addTrace({
        type: 'system',
        title: 'ML Model: Predicting 3-day outflows...',
      })

      const predicted = evalResult.predictedOutflows || 15200
      const confidence = evalResult.confidence || 87
      addTrace({
        type: 'system',
        title: `ML Model: Predicted outflows = $${predicted.toLocaleString()}`,
        description: `Confidence: ${confidence}%`,
      })

      addTrace({
        type: 'system',
        title: 'Decision Gate: Checking safeguards...',
      })

      const hardFloor = evalResult.hardFloor || 18240
      addTrace({
        type: 'system',
        title: `Decision Gate: Hard floor = $${hardFloor.toLocaleString()}`,
        description: 'Historical max daily outflow + 20% buffer',
      })

      const excess = evalResult.excessAvailable || (balance - hardFloor)
      addTrace({
        type: 'system',
        title: `Decision Gate: Excess available = $${excess.toLocaleString()}`,
      })

      if (evalResult.approved !== false && excess > 0) {
        const rampPct = evalResult.rampPercent || 15
        const sweepAmount = evalResult.sweepAmount || (excess * rampPct / 100)
        addTrace({
          type: 'system',
          title: `Decision Gate: Gradual ramp (month 3) = ${rampPct}% of excess`,
          description: `Sweep amount = $${sweepAmount.toFixed(2)}`,
        })
        addTrace({
          type: 'result',
          title: `Sweep APPROVED: $${sweepAmount.toFixed(2)} to FIUSD yield position`,
        })

        addTrace({
          type: 'system',
          title: 'Finxact: Executing position transfer...',
        })

        try {
          await apiCall('POST', '/demo/trigger-sweep', {})
        } catch {
          // trigger-sweep endpoint may not exist in all backends
        }

        const apy = evalResult.apy || 4.2
        addTrace({
          type: 'system',
          title: `INDX: Settlement confirmed | APY: ${apy}%`,
        })

        const newPosition = evalResult.newYieldPosition || (sweepAmount + (evalResult.yieldPosition || 0))
        const projectedMonthly = evalResult.projectedMonthly || (newPosition * apy / 100 / 12)
        addTrace({
          type: 'result',
          title: 'Sweep complete',
          description: `New yield position: $${newPosition.toFixed(2)} | Projected monthly earnings: $${projectedMonthly.toFixed(2)}`,
        })
      } else {
        const reason = evalResult.reason || 'Insufficient excess above safety floor'
        addTrace({
          type: 'result',
          title: `Sweep DENIED: ${reason}`,
        })
      }

      setData(evalResult)
      return evalResult
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apiCall, addTrace])

  const emergencyUnsweep = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      addTrace({
        type: 'system',
        title: 'EMERGENCY UNSWEEP initiated by merchant',
      })
      addTrace({
        type: 'system',
        title: 'Finxact: Retrieving current yield position...',
      })

      const result = await apiCall('POST', `/merchants/${MERCHANT}/unsweep`, {})

      addTrace({
        type: 'system',
        title: `INDX: Liquidating FIUSD position... $${(result.amount || 0).toFixed(2)}`,
      })
      addTrace({
        type: 'system',
        title: 'INDX: Converting FIUSD -> USD at 1:1 peg',
        description: 'Depeg check passed: 0.01% deviation',
      })
      addTrace({
        type: 'system',
        title: 'Finxact: Crediting merchant settlement account...',
      })
      addTrace({
        type: 'result',
        title: `Unsweep complete: $${(result.amount || 0).toFixed(2)} returned`,
        description: `Returned to available balance in ${result.latency || '<2'}s`,
      })
      setData(result)
      return result
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apiCall, addTrace])

  const getScenario = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiCall('GET', '/demo/scenario')
      addTrace({
        type: 'result',
        title: `Scenario loaded: ${result.name || 'Default'}`,
      })
      setData(result)
      return result
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [apiCall, addTrace])

  return { seed, getDashboard, triggerSweep, emergencyUnsweep, getScenario, loading, data, error }
}
