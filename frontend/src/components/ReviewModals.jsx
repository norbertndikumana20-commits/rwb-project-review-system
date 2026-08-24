import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Check, FileQuestion, Info, UserPlus, X, AlertTriangle } from 'lucide-react'
import { api } from '../lib/api'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { Alert, Button, labelCls } from './ui'

/**
 * Options for a Division Manager's final decision.
 * These are binding — the project status changes immediately.
 */
export const FINAL_OPTIONS = [
  {
    value: 'APPROVED',
    label: 'Approve Project',
    hint: 'Grant final approval. The project moves to APPROVED status and the submitting organization is notified.',
    icon: Check,
    color: 'border-sage/40 bg-sage-light/30 text-sage-dark',
    activeColor: 'border-sage bg-sage-light/50',
    iconColor: 'text-sage',
  },
  {
    value: 'REJECTED',
    label: 'Return for Revision',
    hint: 'Send back to the submitting organization with your feedback. They can resubmit after making changes.',
    icon: AlertTriangle,
    color: 'border-brick/30 bg-brick-light/20 text-brick',
    activeColor: 'border-brick bg-brick-light/40',
    iconColor: 'text-brick',
  },
]

/**
 * Options for a reviewer's recommendation.
 * These are non-binding — the DM makes the final call.
 */
export const RECOMMEND_OPTIONS = [
  {
    value: 'APPROVED',
    label: 'Recommend Approval',
    hint: 'You believe this project meets the criteria. The Division Manager will make the final decision.',
    icon: Check,
    color: 'border-sage/40 bg-sage-light/30 text-sage-dark',
    activeColor: 'border-sage bg-sage-light/50',
    iconColor: 'text-sage',
  },
  {
    value: 'REQUEST_INFO',
    label: 'Request More Information',
    hint: 'Ask the submitting organization for additional details or clarification before proceeding.',
    icon: FileQuestion,
    color: 'border-accent/30 bg-accent-soft/30 text-accent',
    activeColor: 'border-accent bg-accent-soft/50',
    iconColor: 'text-accent',
  },
  {
    value: 'REJECTED',
    label: 'Recommend Return',
    hint: 'You believe the project needs significant changes. The Division Manager will make the final decision.',
    icon: X,
    color: 'border-brick/30 bg-brick-light/20 text-brick',
    activeColor: 'border-brick bg-brick-light/40',
    iconColor: 'text-brick',
  },
]

export function AssignModal({ project, onClose, onAssigned }) {
  const [reviewers, setReviewers] = useState([])
  const [selected, setSelected] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/directory/reviewers')
      .then(setReviewers)
      .catch((err) => setError(err.message))
  }, [])

  async function submit() {
    if (!selected) return
    setBusy(true)
    setError('')
    try {
      await api(`/projects/${project.id}/assign`, { method: 'POST', body: { reviewerId: Number(selected) } })
      onAssigned()
    } catch (err) {
      setError(err.message || 'Assignment failed.')
      setBusy(false)
    }
  }

  const trapRef = useFocusTrap(onClose)

  return (
    <AnimatePresence>
    <motion.div ref={trapRef} className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Assign reviewer">
      <motion.div className="absolute inset-0 bg-ink/50" onClick={onClose} aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="relative w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">Assign Reviewer</h2>
            <p className="mt-0.5 text-[12px] text-muted">Choose who will review this project</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-ink-700 hover:bg-ink/5" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded-lg bg-surface-muted/50 px-4 py-3">
          <p className="font-mono text-[11px] text-muted">{project.docketNumber}</p>
          <p className="mt-0.5 text-sm font-medium text-ink">{project.title}</p>
        </div>

        {error && (
          <div className="mt-3">
            <Alert kind="error">{error}</Alert>
          </div>
        )}

        <div className="mt-4">
          <label htmlFor="reviewer-select" className={labelCls}>Select Reviewer</label>
          <select
            id="reviewer-select"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          >
            <option value="">Choose a reviewer…</option>
            {reviewers.map((r) => (
              <option key={r.id} value={r.id}>{r.fullName} — {r.organizationName || 'RWB'}</option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px] text-muted">The reviewer will be notified and the project will appear in their queue.</p>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy || !selected}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            {busy ? 'Assigning…' : 'Assign Reviewer'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
    </AnimatePresence>
  )
}

export function DecisionModal({ project, options, preset, onClose, onSubmit }) {
  const initial = options.some((o) => o.value === preset) ? preset : options[0]?.value
  const [decision, setDecision] = useState(initial)
  const [comments, setComments] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const isRecommendation = options === RECOMMEND_OPTIONS
  const selectedOption = options.find((o) => o.value === decision)

  async function submit() {
    if (!decision) return
    setBusy(true)
    setError('')
    try {
      await onSubmit(decision, comments)
    } catch (err) {
      setError(err.message || 'Action failed.')
      setBusy(false)
    }
  }

  const trapRef = useFocusTrap(onClose)

  return (
    <AnimatePresence>
    <motion.div ref={trapRef} className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Decision">
      <motion.div className="absolute inset-0 bg-ink/50" onClick={onClose} aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="relative w-full max-w-lg rounded-xl border border-line bg-surface p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">
              {isRecommendation ? 'Submit Your Recommendation' : 'Make Final Decision'}
            </h2>
            <p className="mt-0.5 text-[12px] text-muted">
              {isRecommendation
                ? 'Your recommendation will be sent to the Division Manager for review'
                : 'This action will change the project status immediately'}
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-ink-700 hover:bg-ink/5" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded-lg bg-surface-muted/50 px-4 py-3">
          <p className="font-mono text-[11px] text-muted">{project.docketNumber}</p>
          <p className="mt-0.5 text-sm font-medium text-ink">{project.title}</p>
          {project.organizationName && (
            <p className="mt-0.5 text-[11px] text-muted">{project.organizationName}</p>
          )}
        </div>

        {error && (
          <div className="mt-3">
            <Alert kind="error">{error}</Alert>
          </div>
        )}

        <div className="mt-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Select Action</p>
          {options.map((o) => (
            <label
              key={o.value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-all ${
                decision === o.value
                  ? `${o.activeColor} shadow-sm`
                  : `${o.color} hover:shadow-sm`
              }`}
            >
              <input
                type="radio"
                name="decision"
                value={o.value}
                checked={decision === o.value}
                onChange={() => setDecision(o.value)}
                className="mt-0.5 h-4 w-4 accent-accent"
              />
              <span className="flex-1">
                <span className={`block text-sm font-semibold ${decision === o.value ? 'text-ink' : 'text-ink/80'}`}>{o.label}</span>
                <span className="block mt-0.5 text-[12px] leading-relaxed text-ink-700/60">{o.hint}</span>
              </span>
              <o.icon className={`mt-0.5 h-4 w-4 shrink-0 ${o.iconColor}`} aria-hidden="true" />
            </label>
          ))}
        </div>

        <div className="mt-5">
          <label htmlFor="decision-comments" className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Comments {isRecommendation ? '(recommended)' : '(required for rejection)'}
          </label>
          <textarea
            id="decision-comments"
            rows={3}
            maxLength={2000}
            className="mt-1.5 w-full resize-y rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder={
              decision === 'REJECTED'
                ? 'Explain what needs to be changed…'
                : decision === 'REQUEST_INFO'
                ? 'What additional information do you need?'
                : 'Add any notes for the record…'
            }
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy || (decision === 'REJECTED' && !comments.trim())}>
            {busy ? (
              <>Recording…</>
            ) : isRecommendation ? (
              <><Info className="h-4 w-4" aria-hidden="true" /> Submit Recommendation</>
            ) : decision === 'APPROVED' ? (
              <><Check className="h-4 w-4" aria-hidden="true" /> Approve Project</>
            ) : (
              <><AlertTriangle className="h-4 w-4" aria-hidden="true" /> Return for Revision</>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
    </AnimatePresence>
  )
}
