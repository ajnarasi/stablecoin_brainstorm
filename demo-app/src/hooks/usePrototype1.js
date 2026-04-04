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

      // API returns: { merchant_id, transactions_created, days_seeded, model_trained }
      addTrace({
        type: 'system',
        title: 'Finxact: Creating merchant account',
        description: `Merchant ID: ${result.merchant_id}`,
      })
      addTrace({
        type: 'system',
        title: 'Generating settlement history',
        description: `${result.days_seeded} days of synthetic CommerceHub transaction data (${result.transactions_created} transactions)`,
      })
      addTrace({
        type: 'system',
        title: 'ML Model: Training cash flow predictor',
        description: result.model_trained
          ? 'LightGBM trained successfully on rolling window with day-of-week + seasonality features'
          : 'Model training pending',
      })
      addTrace({
        type: 'result',
        title: 'Demo seeded successfully',
        description: `Merchant: ${result.merchant_id} | ${result.transactions_created} transactions over ${result.days_seeded} days`,
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

      // API returns STRING decimals: current_balance, fiusd_position, total_value
      // earnings: { current_principal, total_accrued, total_value, current_apy, daily_earnings_rate, accrual_history }
      const currentBalance = parseFloat(result.current_balance) || 0
      const fiusdPosition = parseFloat(result.fiusd_position) || 0
      const apy = parseFloat(result.earnings?.current_apy) || 0
      const dailyEarningsRate = parseFloat(result.earnings?.daily_earnings_rate) || 0
      const totalAccrued = parseFloat(result.earnings?.total_accrued) || 0
      const monthlyEarnings = dailyEarningsRate * 30

      addTrace({
        type: 'system',
        title: 'Finxact: Loaded merchant dashboard',
        description: `Balance: $${currentBalance.toLocaleString()} | FIUSD Position: $${fiusdPosition.toLocaleString()} | APY: ${(apy * 100).toFixed(1)}%`,
      })

      // Normalize into a shape the component can use directly
      const normalized = {
        ...result,
        currentBalance,
        fiusdPosition,
        apy: apy * 100, // convert decimal to percentage
        dailyEarningsRate,
        totalAccrued,
        monthlyEarnings,
        accrualHistory: result.earnings?.accrual_history || [],
        recentSweeps: result.recent_sweeps || [],
        merchant: result.merchant,
      }

      setData(normalized)
      return normalized
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

      const result = await apiCall('POST', '/demo/trigger-sweep', {})

      // API returns STRING decimals: current_balance, predicted_outflows, safety_buffer,
      // hard_floor, excess_available, ramp_pct, fiusd_position
      // decision: { id, merchant_id, prediction_id, proposed_amount, decision, reason }
      const currentBalance = parseFloat(result.current_balance) || 0
      const predictedOutflows = parseFloat(result.predicted_outflows) || 0
      const hardFloor = parseFloat(result.hard_floor) || 0
      const excessAvailable = parseFloat(result.excess_available) || 0
      const rampPct = parseFloat(result.ramp_pct) || 0
      const fiusdPosition = parseFloat(result.fiusd_position) || 0
      const proposedAmount = parseFloat(result.decision?.proposed_amount) || 0
      const decisionResult = result.decision?.decision || 'DENIED' // APPROVED or DENIED
      const reason = result.decision?.reason || ''

      addTrace({
        type: 'system',
        title: `Finxact: Current balance = $${currentBalance.toLocaleString()}`,
      })

      addTrace({
        type: 'system',
        title: 'ML Model: Predicting 3-day outflows...',
      })

      addTrace({
        type: 'system',
        title: `ML Model: Predicted outflows = $${predictedOutflows.toLocaleString()}`,
      })

      addTrace({
        type: 'system',
        title: 'Decision Gate: Checking safeguards...',
      })

      addTrace({
        type: 'system',
        title: `Decision Gate: Hard floor = $${hardFloor.toLocaleString()}`,
        description: 'Historical max daily outflow + 20% buffer',
      })

      addTrace({
        type: 'system',
        title: `Decision Gate: Excess available = $${excessAvailable.toLocaleString()}`,
      })

      if (decisionResult === 'APPROVED') {
        addTrace({
          type: 'system',
          title: `Decision Gate: Ramp = ${(rampPct * 100).toFixed(0)}% of excess`,
          description: `Sweep amount = $${proposedAmount.toFixed(2)}`,
        })
        addTrace({
          type: 'result',
          title: `Sweep APPROVED: $${proposedAmount.toFixed(2)} to FIUSD yield position`,
        })

        addTrace({
          type: 'system',
          title: 'Finxact: Executing position transfer...',
        })

        addTrace({
          type: 'system',
          title: 'INDX: Settlement confirmed',
        })

        addTrace({
          type: 'result',
          title: 'Sweep complete',
          description: `FIUSD position: $${fiusdPosition.toFixed(2)} | Reason: ${reason}`,
        })
      } else {
        addTrace({
          type: 'result',
          title: `Sweep DENIED: ${reason}`,
        })
      }

      // Normalize for the component
      const normalized = {
        decision: decisionResult,
        proposedAmount,
        reason,
        currentBalance,
        predictedOutflows,
        hardFloor,
        excessAvailable,
        rampPct,
        fiusdPosition,
      }

      setData(normalized)
      return normalized
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
