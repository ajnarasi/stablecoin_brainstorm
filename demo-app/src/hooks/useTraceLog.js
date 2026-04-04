import { useState, useCallback, useRef } from 'react'

export function useTraceLog() {
  const [entries, setEntries] = useState([])
  const counterRef = useRef(0)

  const addTrace = useCallback((entryOrType, title, extra) => {
    counterRef.current += 1
    // Support both calling conventions:
    // addTrace({ type, title, ... })  -- used by usePrototype1, usePrototype2
    // addTrace('type', 'title', extra) -- used by usePrototype3, usePrototype4
    let entry
    if (typeof entryOrType === 'string') {
      entry = { type: entryOrType, title: title || '', ...(extra || {}) }
    } else {
      entry = entryOrType || {}
    }
    const newEntry = {
      id: `trace-${counterRef.current}-${Date.now()}`,
      timestamp: new Date(),
      ...entry,
    }
    setEntries((prev) => [...prev, newEntry])
    return newEntry.id
  }, [])

  const clearTrace = useCallback(() => {
    setEntries([])
  }, [])

  return { entries, addTrace, clearTrace }
}

export default useTraceLog
