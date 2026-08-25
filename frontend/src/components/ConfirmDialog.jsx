import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Ban, AlertCircle, X } from 'lucide-react'

/**
 * Reusable confirmation dialog for destructive/irreversible actions.
 * Satisfies NFR-4.3: "A confirmation dialog shall precede any destructive or irreversible action."
 *
 * Props:
 *  - open: boolean — whether the dialog is visible
 *  - onClose: () => void — called when user cancels or clicks backdrop
 *  - onConfirm: () => void — called when user confirms
 *  - title: string — short, specific title (e.g. "Disable this account?")
 *  - message: string — explains the consequence
 *  - confirmLabel: string — button text for the confirm action
 *  - variant: 'danger' | 'warning' | 'info' — controls color scheme
 *  - loading: boolean — shows spinner on confirm button while async action runs
 *  - requireConfirm: { label: string, placeholder: string } | null — optional: require typing to confirm
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  loading = false,
  requireConfirm = null,
}) {
  const [typedValue, setTypedValue] = React.useState('')

  const icons = {
    danger: <Trash2 className="h-6 w-6" />,
    warning: <Ban className="h-6 w-6" />,
    info: <AlertCircle className="h-6 w-6" />,
  }

  const colors = {
    danger: { iconBg: 'bg-brick-light/40', iconText: 'text-brick', btn: 'bg-brick hover:bg-brick/90 text-white' },
    warning: { iconBg: 'bg-amber-light/50', iconText: 'text-amber-dark', btn: 'bg-amber-dark hover:bg-amber-dark/90 text-white' },
    info: { iconBg: 'bg-blue-100', iconText: 'text-blue-700', btn: 'bg-blue-600 hover:bg-blue-700 text-white' },
  }

  const c = colors[variant] || colors.danger
  const isConfirmDisabled = requireConfirm && typedValue !== requireConfirm.label

  function handleConfirm() {
    if (requireConfirm && typedValue !== requireConfirm.label) return
    onConfirm()
    setTypedValue('')
  }

  function handleClose() {
    setTypedValue('')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between border-b border-line px-6 pt-5 pb-0">
              <div className="flex items-center gap-2">
                <img src="/assets/rwb-logo-vertical.png" alt="RWB" className="h-8 w-8 rounded-lg object-contain" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">RWB System</span>
              </div>
              <button onClick={handleClose} className="rounded-lg p-1 text-muted hover:bg-ink-50 hover:text-ink transition-colors" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5">
              {/* Icon + Title */}
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${c.iconBg} ${c.iconText}`}>
                  {icons[variant]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 id="confirm-dialog-title" className="text-lg font-bold text-ink">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{message}</p>
                </div>
              </div>

              {/* Optional: require typing to confirm */}
              {requireConfirm && (
                <div className="mt-5 rounded-xl border border-line bg-surface-muted/30 p-4">
                  <label className="block text-xs font-semibold text-ink-700/75 mb-1.5">
                    Type <span className="font-bold text-ink">"{requireConfirm.label}"</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={typedValue}
                    onChange={(e) => setTypedValue(e.target.value)}
                    placeholder={requireConfirm.placeholder}
                    className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/50 focus:border-brick focus:outline-none focus:ring-1 focus:ring-brick/30"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">
              <button
                onClick={handleClose}
                disabled={loading}
                className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink-700/75 hover:bg-ink-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading || isConfirmDisabled}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${c.btn}`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Processing…
                  </span>
                ) : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Need React import for useState
import React from 'react'
