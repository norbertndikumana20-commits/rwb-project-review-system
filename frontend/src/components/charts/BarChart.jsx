import { useId } from 'react'

/**
 * Grouped vertical bar chart (SVG). Used for Monthly Project Submissions.
 * Two series: received (navy/informational) and completed (sage/completed).
 */
export default function BarChart({ data, height = 200 }) {
  const uid = useId().replace(/:/g, '')
  const months = data.map((d) => d.month.slice(5) + '/' + d.month.slice(2, 4))
  const max = Math.max(1, ...data.flatMap((d) => [d.received, d.completed]))
  const groupW = 100 / data.length
  const barW = Math.min(22, groupW * 0.32)
  const padTop = 8
  const plotH = height - 34

  return (
    <div>
      <svg
        role="img"
        aria-label="Monthly project submissions"
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1="0"
            x2="100"
            y1={padTop + plotH * (1 - f)}
            y2={padTop + plotH * (1 - f)}
            stroke="#1a2332"
            strokeOpacity="0.06"
            strokeWidth="0.4"
          />
        ))}
        {data.map((d, i) => {
          const cx = i * groupW + groupW / 2
          const rH = (d.received / max) * (plotH - padTop)
          const cH = (d.completed / max) * (plotH - padTop)
          return (
            <g key={d.month} clipPath={`url(#${uid}-clip)`}>
              <rect
                x={cx - barW - 0.5}
                y={height - 34 - rH}
                width={barW}
                height={rH}
                rx="0.8"
                fill="#1f3a5f"
                style={{ transformOrigin: `${cx - barW - 0.5}px ${height - 34}px`, animation: 'grow-bar 0.4s ease-out both' }}
              />
              <rect
                x={cx + 0.5}
                y={height - 34 - cH}
                width={barW}
                height={cH}
                rx="0.8"
                fill="#4a7c59"
                style={{ transformOrigin: `${cx + 0.5}px ${height - 34}px`, animation: 'grow-bar 0.4s ease-out both' }}
              />
            </g>
          )
        })}
        <defs>
          <clipPath id={`${uid}-clip`}>
            <rect x="0" y="0" width="100" height={height - 34} />
          </clipPath>
        </defs>
      </svg>
      <div className="mt-1 grid" style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}>
        {months.map((m, i) => (
          <span key={i} className="text-center text-[11px] font-medium uppercase tracking-[0.05em] text-muted">
            {m}
          </span>
        ))}
      </div>
    </div>
  )
}
