export default function LiveIndicator({ status = 'checking', label = '' }) {
  return (
    <span className="live-indicator" role="status" aria-label={`${label} is ${status}`}>
      <span className={`live-indicator__dot live-indicator__dot--${status}`} aria-hidden="true" />
      {label && <span className="live-indicator__label">{label}</span>}
    </span>
  )
}
