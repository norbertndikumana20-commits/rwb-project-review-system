import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'

export function Brand({ compact = false }) {
  return (
    <Link to="/" className="group inline-flex items-center gap-3 no-underline" aria-label="RWB home">
      <img
        src="/assets/rwb-logo-horizontal.png"
        alt="RWB Logo"
        className="h-12 w-auto object-contain transition-transform group-hover:-rotate-3"
      />
      {!compact && (
        <span className="leading-tight">
          <span className="block font-display text-lg font-semibold tracking-tight text-paper">
            RWB Project Review
          </span>
          <span className="block font-mono text-[10px] uppercase tracking-[0.28em] text-ink-100/70">
            Review Ledger · Est. 2026
          </span>
        </span>
      )}
    </Link>
  )
}

/* Design-system label — the ONE label style app-wide.
 * 11px / medium / uppercase / 0.05em / muted gray. No variants. */
export const labelCls =
  'text-[11px] font-medium uppercase tracking-[0.05em] text-muted'

/**
 * Unified action button — every button shares the same shape/weight
 * (height 40px, 16px horizontal padding, 6px radius) and differs only in
 * color. Approve = success (green), Return = danger (red), same treatment.
 * Primary actions use the navy accent.
 */
export function Button({ variant = 'primary', className = '', whileHover: _hv, whileTap: _ht, ...props }) {
  const styles = {
    primary:
      'bg-accent text-white hover:bg-accent-dark border border-accent-dark/40 shadow-sm',
    secondary:
      'bg-surface-muted text-ink hover:bg-paper-darker border border-line',
    ghost: 'bg-transparent text-ink-700 hover:bg-ink/5 hover:text-ink',
    success: 'bg-sage text-white hover:bg-sage-dark border border-sage-dark/40 shadow-sm',
    danger: 'bg-brick text-white hover:bg-brick-dark border border-brick-dark/40 shadow-sm',
  }
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  )
}

export function Field({ label, hint, children, id }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className={`block ${labelCls}`}>
        {label}
      </label>
      {children}
      {hint && <p className="text-sm text-ink-700/70">{hint}</p>}
    </div>
  )
}

export const inputClass =
  'w-full rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted/70 transition-colors hover:border-ink/30 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25'

/* Shared card surface — one radius/border/shadow for every panel
 * (12px, 1px hairline #E4E2DE, single elevation token). White cards on
 * the #F7F6F3 canvas. All dashboard panels inherit via `Card`. */
export function Card({ className = '', hover = false, children, ...props }) {
  const Comp = hover ? motion.div : 'div'
  const hoverProps = hover ? { whileHover: { y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }, transition: { type: 'spring', stiffness: 300, damping: 25 } } : {}
  return (
    <Comp
      className={`rounded-xl border border-line bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.08)] ${className}`}
      {...hoverProps}
      {...props}
    >
      {children}
    </Comp>
  )
}

export function Alert({ kind = 'error', children }) {
  const styles = {
    error: 'border-brick/40 bg-brick-light/50 text-brick-dark',
    info: 'border-ink/20 bg-ink-50 text-ink-700',
    success: 'border-sage/40 bg-sage-light/50 text-sage-dark',
    warn: 'border-amber/50 bg-amber-light/40 text-amber-dark',
  }
  return (
    <div role="alert" className={`rounded-md border px-3.5 py-3 text-sm ${styles[kind]}`}>
      {children}
    </div>
  )
}

export function Divider() {
  return <div className="my-6 border-t border-line" />
}

/**
 * External reference — never render a raw URL. Shown as a labeled chip with
 * the hostname and an external-link icon; the full URL stays in the href.
 */
export function ExternalLinkChip({ href, label = 'View External Project Files', className = '' }) {
  let host = ''
  try {
    host = new URL(href).hostname.replace(/^www\./, '')
  } catch {
    host = href
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={`inline-flex max-w-full items-center gap-2 rounded-md border border-line bg-surface-muted px-3 py-2 text-sm font-semibold text-accent transition-colors hover:border-accent/40 hover:bg-accent-soft ${className}`}
    >
      <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block truncate">{label}</span>
        {host && <span className="block truncate text-xs font-medium text-muted">{host}</span>}
      </span>
    </a>
  )
}
