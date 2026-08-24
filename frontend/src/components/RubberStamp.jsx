/* Status badge — the ONE pill style app-wide (project statuses + account
 * statuses). 11px / uppercase / semibold, 1px border, rounded-full.
 * Colors follow the design tokens: pending=amber (warning), approved=green,
 * rejected=red, informational=navy, inactive=gray. */

const STAMP_DEFS = {
  SUBMITTED: { label: 'RECEIVED', color: 'text-amber-dark border-amber bg-amber-light/40' },
  IN_REVIEW: { label: 'UNDER REVIEW', color: 'text-ink-600 border-ink-600/40 bg-accent-soft' },
  APPROVED: { label: 'APPROVED', color: 'text-sage-dark border-sage/50 bg-sage-light/60' },
  REJECTED: { label: 'REJECTED', color: 'text-brick-dark border-brick/50 bg-brick-light/60' },
  RESUBMITTED: { label: 'RESUBMITTED', color: 'text-amber-dark border-amber bg-amber-light/40' },
  ARCHIVED: { label: 'ARCHIVED', color: 'text-muted border-line bg-surface-muted' },
  DRAFT: { label: 'DRAFT', color: 'text-muted border-line bg-surface-muted' },
  /* Account statuses (admin directory) */
  PENDING_EMAIL_VERIFICATION: { label: 'EMAIL PENDING', color: 'text-muted border-line bg-surface-muted' },
  PENDING_ADMIN_REVIEW: { label: 'PENDING REVIEW', color: 'text-amber-dark border-amber bg-amber-light/40' },
  ACTIVE_FIRST_PROJECT_REQUIRED: { label: 'FIRST PROJECT', color: 'text-amber-dark border-amber bg-amber-light/40' },
  ACTIVE: { label: 'ACTIVE', color: 'text-sage-dark border-sage/50 bg-sage-light/60' },
  DISABLED: { label: 'DISABLED', color: 'text-muted border-line bg-surface-muted' },
}

export default function RubberStamp({ status, size = 'md', tilt = -2, show = true }) {
  const def = STAMP_DEFS[status] || { label: status, color: 'text-ink-600 border-ink-600/40 bg-accent-soft' }
  if (!show) return null

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] tracking-[0.06em] border',
    md: 'px-2.5 py-1 text-[11px] tracking-[0.08em] border',
    lg: 'px-3 py-1.5 text-xs tracking-[0.1em] border',
  }

  return (
    <span
      className={`inline-flex select-none items-center justify-center rounded-full font-sans font-semibold uppercase leading-none ${sizes[size]} ${def.color}`}
      style={{
        transform: `rotate(${tilt}deg)`,
        '--stamp-tilt': `${tilt}deg`,
        animation: 'stamp-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      }}
    >
      {def.label}
    </span>
  )
}
