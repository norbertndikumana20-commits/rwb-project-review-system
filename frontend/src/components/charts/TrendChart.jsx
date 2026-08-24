import { useId } from 'react'

/**
 * Two-series line/area trend (SVG). Used for the review completion trend.
 */
export default function TrendChart({ data, height = 200 }) {
  const uid = useId().replace(/:/g, '')
  const W = 100
  const H = height
  const padX = 4
  const padTop = 10
  const padBottom = 26
  const plotW = W - padX * 2
  const plotH = H - padTop - padBottom

  const max = Math.max(1, ...data.flatMap((d) => [d.received, d.completed]))
  const stepX = data.length > 1 ? plotW / (data.length - 1) : 0

  const pts = (key) =>
    data.map((d, i) => [padX + i * stepX, padTop + plotH - (d[key] / max) * plotH])

  const line = (key) => pts(key).map((p) => p.join(',')).join(' ')
  const area = (key) => `${padX},${padTop + plotH} ${line(key)} ${padX + (data.length - 1) * stepX},${padTop + plotH}`

  const labels = data.map((d) => d.month.slice(5) + '/' + d.month.slice(2, 4))

  return (
    <div>
      <svg role="img" aria-label="Review completion trend" viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
        <defs>
          <linearGradient id={`${uid}-navy`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1f3a5f" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#1f3a5f" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}-sage`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a7c59" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#4a7c59" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={padX}
            x2={W - padX}
            y1={padTop + plotH * (1 - f)}
            y2={padTop + plotH * (1 - f)}
            stroke="#1a2332"
            strokeOpacity="0.06"
          />
        ))}

        <polygon points={area('received')} fill={`url(#${uid}-navy)`} />
        <polygon points={area('completed')} fill={`url(#${uid}-sage)`} />

        {(['received', 'completed']).map((key, si) => (
          <polyline
            key={key}
            points={line(key)}
            fill="none"
            stroke={si === 0 ? '#1f3a5f' : '#4a7c59'}
            strokeWidth="1.4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {pts('received').map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="1.6" fill="#1f3a5f" stroke="#ffffff" strokeWidth="0.6" />
            <circle cx={pts('completed')[i][0]} cy={pts('completed')[i][1]} r="1.6" fill="#4a7c59" stroke="#ffffff" strokeWidth="0.6" />
          </g>
        ))}
      </svg>
      <div className="mt-1 grid" style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}>
        {labels.map((m, i) => (
          <span key={i} className="text-center text-[11px] font-medium uppercase tracking-[0.05em] text-muted">
            {m}
          </span>
        ))}
      </div>
    </div>
  )
}
