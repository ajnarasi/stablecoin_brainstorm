import { useMemo } from 'react'

function getBoxCenter(box) {
  const x = box.x + (box.width || 140) / 2
  const y = box.y + 40
  return { x, y }
}

export default function ArchitectureDiagram({ boxes = [], arrows = [], height = 300 }) {
  const boxMap = useMemo(() => {
    const map = {}
    boxes.forEach((box) => { map[box.id] = box })
    return map
  }, [boxes])

  return (
    <div
      className="architecture-diagram"
      style={{ minHeight: height }}
      role="img"
      aria-label="Architecture diagram"
    >
      {/* SVG for arrows */}
      <svg
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#003B5C" />
          </marker>
        </defs>
        {arrows.map((arrow, i) => {
          const fromBox = boxMap[arrow.from]
          const toBox = boxMap[arrow.to]
          if (!fromBox || !toBox) return null

          const from = getBoxCenter(fromBox)
          const to = getBoxCenter(toBox)

          const midX = (from.x + to.x) / 2
          const midY = (from.y + to.y) / 2

          return (
            <g key={i}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                className="arch-arrow__line"
              />
              {arrow.label && (
                <text
                  x={midX}
                  y={midY - 8}
                  textAnchor="middle"
                  className="arch-arrow__label"
                >
                  {arrow.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Boxes */}
      {boxes.map((box) => (
        <div
          key={box.id}
          className="arch-box"
          style={{
            left: box.x,
            top: box.y,
            width: box.width || 140,
            borderColor: box.color || '#003B5C',
          }}
        >
          <div className="arch-box__title" style={{ color: box.color || '#003B5C' }}>
            {box.title}
          </div>
          {box.subtitle && <div className="arch-box__subtitle">{box.subtitle}</div>}
          {box.description && <div className="arch-box__description">{box.description}</div>}
        </div>
      ))}
    </div>
  )
}
