/**
 * Workload donut (SVG) — single progress arc with a center label.
 */
export default function Donut({ percent, size = 150, stroke = 12, label = 'Progress' }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, percent))
  const offset = c - (clamped / 100) * c

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`${label}: ${clamped}%`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1a2332" strokeOpacity="0.08" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#4a7c59"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ '--donut-circ': c, animation: 'draw-donut 0.8s ease-out both' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Numerals keep IBM Plex Mono / tabular figures — the label is Inter. */}
        <span className="font-mono text-2xl font-semibold text-ink tabular-nums">{clamped}%</span>
        <span className="text-[11px] font-medium uppercase tracking-[0.05em] text-muted">{label}</span>
      </div>
    </div>
  )
}
