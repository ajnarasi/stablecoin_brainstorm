import { useState, useEffect, useRef } from 'react'

function formatTimestamp(date) {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  const ms = String(date.getMilliseconds()).padStart(3, '0')
  return `${h}:${m}:${s}.${ms}`
}

function TraceEntry({ entry }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={`trace-entry trace-entry--${entry.type}`}
      onClick={() => entry.details && setExpanded(!expanded)}
      role={entry.details ? 'button' : undefined}
      tabIndex={entry.details ? 0 : undefined}
      aria-expanded={entry.details ? expanded : undefined}
      onKeyDown={(e) => {
        if (entry.details && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          setExpanded(!expanded)
        }
      }}
    >
      <div className="trace-entry__header">
        <span className="trace-entry__title">{entry.title}</span>
        <div className="trace-entry__meta">
          {entry.latency != null && (
            <span className="trace-entry__latency">{entry.latency}ms</span>
          )}
          <span className="trace-entry__time">
            {formatTimestamp(entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp))}
          </span>
        </div>
      </div>

      {entry.description && (
        <div className="trace-entry__description">{entry.description}</div>
      )}

      {expanded && entry.details && (
        <div className="trace-entry__details">
          {typeof entry.details === 'string'
            ? entry.details
            : JSON.stringify(entry.details, null, 2)}
        </div>
      )}
    </div>
  )
}

export default function LiveTracePanel({ entries = [], onClear }) {
  const bodyRef = useRef(null)

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [entries.length])

  return (
    <aside className="trace-panel" aria-label="Live API trace log">
      <div className="trace-panel__header">
        <div className="trace-panel__title">
          Live Trace
          {entries.length > 0 && (
            <span className="trace-panel__badge">{entries.length}</span>
          )}
        </div>
        {onClear && entries.length > 0 && (
          <button
            className="trace-panel__clear"
            onClick={onClear}
            aria-label="Clear trace log"
          >
            Clear
          </button>
        )}
      </div>

      <div className="trace-panel__body" ref={bodyRef}>
        {entries.length === 0 ? (
          <div className="trace-panel__empty">
            Waiting for API activity...
          </div>
        ) : (
          entries.map((entry) => (
            <TraceEntry key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </aside>
  )
}
