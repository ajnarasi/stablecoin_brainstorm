import { useState, useEffect, useCallback, useRef } from 'react'
import { API } from '../config'

const ENDPOINTS = {
  p1: `${API.p1}/health`,
  p2: `${API.p2}/health`,
  p3: `${API.p3}/health`,
  p4: `${API.p4}/health`,
}

const POLL_INTERVAL = 10000

export function useApiHealth() {
  const [health, setHealth] = useState({
    p1: 'checking',
    p2: 'checking',
    p3: 'checking',
    p4: 'checking',
  })

  const intervalRef = useRef(null)

  const checkHealth = useCallback(async () => {
    const results = {}

    await Promise.all(
      Object.entries(ENDPOINTS).map(async ([key, url]) => {
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 5000)

          const response = await fetch(url, {
            signal: controller.signal,
            mode: 'cors',
          })
          clearTimeout(timeout)

          results[key] = response.ok ? 'online' : 'offline'
        } catch {
          results[key] = 'offline'
        }
      })
    )

    setHealth(results)
  }, [])

  useEffect(() => {
    checkHealth()
    intervalRef.current = setInterval(checkHealth, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [checkHealth])

  return health
}

export default useApiHealth
