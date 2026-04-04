import { useState, useEffect, useRef } from 'react'

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

export default function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 1500,
  decimals = 2,
}) {
  const [displayValue, setDisplayValue] = useState(0)
  const rafRef = useRef(null)
  const startTimeRef = useRef(null)
  const startValueRef = useRef(0)

  useEffect(() => {
    const parsed = typeof value === 'number' ? value : parseFloat(value)
    const targetValue = Number.isFinite(parsed) ? parsed : 0
    startValueRef.current = displayValue
    startTimeRef.current = null

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }

    function animate(timestamp) {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(progress)

      const current = startValueRef.current + (targetValue - startValueRef.current) * easedProgress
      setDisplayValue(current)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [value, duration]) // eslint-disable-line react-hooks/exhaustive-deps

  const safeValue = Number.isFinite(displayValue) ? displayValue : 0
  const formatted = safeValue.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return (
    <span aria-live="polite">
      {prefix}{formatted}{suffix}
    </span>
  )
}
