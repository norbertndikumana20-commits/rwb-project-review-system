import { BarChart3 } from 'lucide-react'
import { Card, labelCls } from './ui'

/* Shared dashboard pieces — Inter only (no serif, no mono labels).
 * Labels: 11px / medium / uppercase / 0.05em / muted (#8A8F98) — the one
 * label style in the app. Numerals use IBM Plex Mono + tabular-nums.
 * See index.css @theme for the full design tokens. */

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className={labelCls}>{eyebrow}</p>}
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-[-0.01em] text-ink">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-700/80">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ title, action, children, className = '' }) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  )
}

export function Legend({ items }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <span key={item.label} className={`inline-flex items-center gap-1.5 ${labelCls}`}>
          <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  )
}

/** Friendly empty state for charts with fewer than ~4 data points. */
export function EmptyChart({ message = 'Not enough data yet — check back as more projects are submitted' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <BarChart3 className="h-6 w-6 text-muted/40" aria-hidden="true" />
      <p className="max-w-[260px] text-sm leading-relaxed text-ink-700/70">{message}</p>
    </div>
  )
}
