import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Check, Info, UserPlus } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { api } from '../lib/api'
import AppShell from '../components/AppShell'
import RubberStamp from '../components/RubberStamp'
import { Alert, Button, Card, labelCls } from '../components/ui'
import { PageHeader } from '../components/dashboard'
import { TableSkeleton } from '../components/Skeleton'
import { AssignModal, DecisionModal, FINAL_OPTIONS, RECOMMEND_OPTIONS } from '../components/ReviewModals'
import { fmtDate } from '../lib/format'

export default function Reviews() {
  const { user } = useAuth()
  const [projects, setProjects] = useState(null)
  const [error, setError] = useState('')
  const [assigning, setAssigning] = useState(null)
  const [decisionTarget, setDecisionTarget] = useState(null)

  const load = useCallback(async () => {
    try {
      setProjects(await api('/projects'))
    } catch (err) {
      setError(err.message || 'Unable to load the review queue.')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const role = user?.role
  const isManagerial = role === 'DIVISION_MANAGER'
  const isReviewer = role === 'REVIEWER'

  async function submitDecision(decision, comments) {
    const { project, kind } = decisionTarget
    if (kind === 'recommend') {
      await api(`/projects/${project.id}/recommend`, { method: 'POST', body: { decision, comments } })
    } else {
      const action = decision === 'APPROVED' ? 'approve' : 'reject'
      await api(`/projects/${project.id}/${action}`, { method: 'POST', body: { comments } })
    }
    setDecisionTarget(null)
    load()
  }

  const queue = (projects || []).filter((p) => ['SUBMITTED', 'IN_REVIEW', 'RESUBMITTED'].includes(p.status))
  const decided = (projects || []).filter((p) => ['APPROVED', 'REJECTED', 'ARCHIVED'].includes(p.status))

  return (
    <AppShell>
      <PageHeader
        eyebrow="Review Workflow"
        title="Reviews"
        subtitle="Division Managers assign and decide; reviewers submit recommendations on dockets assigned to them."
      />
      {error && <Alert kind="error">{error}</Alert>}

      {assigning && (
        <AssignModal
          project={assigning}
          onClose={() => setAssigning(null)}
          onAssigned={() => {
            setAssigning(null)
            load()
          }}
        />
      )}

      {decisionTarget && (
        <DecisionModal
          project={decisionTarget.project}
          options={decisionTarget.kind === 'recommend' ? RECOMMEND_OPTIONS : FINAL_OPTIONS}
          preset={decisionTarget.preset}
          onClose={() => setDecisionTarget(null)}
          onSubmit={submitDecision}
        />
      )}

      <h2 className="mb-3 text-base font-semibold text-ink">Review queue · {queue.length}</h2>
      <Card className="overflow-hidden">
        {!projects ? (
          <div className="p-6"><TableSkeleton rows={5} cols={6} /></div>
        ) : queue.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className={`border-b border-line bg-surface-muted/50 ${labelCls}`}>
                    <th className="px-4 py-3 font-medium">Project ID</th>
                    <th className="px-4 py-3 font-medium">Project</th>
                    <th className="px-4 py-3 font-medium">Organization</th>
                    <th className="px-4 py-3 font-medium">Reviewer</th>
                    <th className="px-4 py-3 font-medium">Received</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((p, i) => {
                    const mine = isReviewer && p.reviewerName === user?.fullName && p.status === 'IN_REVIEW'
                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.25 }}
                        className="border-b border-ink/5 last:border-0 hover:bg-ink-50/50"
                      >
                        <td className="px-4 py-3">
                          <Link to={`/projects/${p.id}`} className="font-mono text-xs font-medium text-ink-700 underline-offset-4 hover:text-accent hover:underline">
                            {p.docketNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`/projects/${p.id}`} className="font-medium text-ink underline-offset-4 hover:text-accent hover:underline">
                            {p.title}
                          </Link>
                          <p className={`mt-0.5 ${labelCls}`}>{p.category || 'Uncategorized'}</p>
                        </td>
                        <td className="px-4 py-3 text-ink-700/90">{p.organizationName || '—'}</td>
                        <td className="px-4 py-3">
                          {p.reviewerName ? (
                            <span className="text-ink-700/90">{p.reviewerName}</span>
                          ) : (
                            <span className="font-mono text-[10px] uppercase tracking-wider text-amber-dark">Awaiting assignment</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-ink-700/75 tabular-nums">
                          {fmtDate(p.submittedAt || p.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <RubberStamp status={p.status} size="sm" tilt={-3} />
                            <Link
                              to={`/projects/${p.id}`}
                              className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs font-semibold text-accent transition-colors hover:border-accent/40 hover:bg-accent-soft"
                            >
                              Open
                              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </Link>
                            {isManagerial && !p.reviewerName && (
                              <Button variant="secondary" className="px-2.5 py-1.5 text-xs" onClick={() => setAssigning(p)}>
                                <UserPlus className="h-3.5 w-3.5" aria-hidden="true" /> Assign Reviewer
                              </Button>
                            )}
                            {isManagerial && (
                              <>
                                <Button variant="success" className="px-2.5 py-1.5 text-xs" onClick={() => setDecisionTarget({ project: p, kind: 'final', preset: 'APPROVED' })}>
                                  <Check className="h-3.5 w-3.5" aria-hidden="true" /> Approve
                                </Button>
                                <Button variant="danger" className="px-2.5 py-1.5 text-xs" onClick={() => setDecisionTarget({ project: p, kind: 'final', preset: 'REJECTED' })}>
                                  Return for Revision
                                </Button>
                              </>
                            )}
                            {mine && (
                              <Button variant="secondary" className="px-2.5 py-1.5 text-xs" onClick={() => setDecisionTarget({ project: p, kind: 'recommend' })}>
                                <Info className="h-3.5 w-3.5" aria-hidden="true" /> Submit Recommendation
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-line md:hidden">
              {queue.map((p, i) => {
                const mine = isReviewer && p.reviewerName === user?.fullName && p.status === 'IN_REVIEW'
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Link to={`/projects/${p.id}`} className="font-medium text-ink underline-offset-4 hover:text-accent hover:underline">
                          {p.title}
                        </Link>
                        <p className="mt-0.5 font-mono text-[11px] text-ink-700/60 tabular-nums">{p.docketNumber}</p>
                      </div>
                      <RubberStamp status={p.status} size="sm" tilt={-3} />
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-ink-700/75">{p.organizationName || '—'}{p.category ? ` · ${p.category}` : ''}</p>
                      <p className="text-xs text-ink-700/60">
                        {p.reviewerName || <span className="text-amber-dark">Awaiting assignment</span>} · {fmtDate(p.submittedAt || p.createdAt)}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Link
                        to={`/projects/${p.id}`}
                        className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs font-semibold text-accent transition-colors hover:border-accent/40 hover:bg-accent-soft"
                      >
                        Open <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                      {isManagerial && !p.reviewerName && (
                        <Button variant="secondary" className="px-2.5 py-1.5 text-xs" onClick={() => setAssigning(p)}>
                          <UserPlus className="h-3.5 w-3.5" aria-hidden="true" /> Assign Reviewer
                        </Button>
                      )}
                      {isManagerial && (
                        <>
                          <Button variant="success" className="px-2.5 py-1.5 text-xs" onClick={() => setDecisionTarget({ project: p, kind: 'final', preset: 'APPROVED' })}>
                            <Check className="h-3.5 w-3.5" aria-hidden="true" /> Approve
                          </Button>
                          <Button variant="danger" className="px-2.5 py-1.5 text-xs" onClick={() => setDecisionTarget({ project: p, kind: 'final', preset: 'REJECTED' })}>
                            Return for Revision
                          </Button>
                        </>
                      )}
                      {mine && (
                        <Button variant="secondary" className="px-2.5 py-1.5 text-xs" onClick={() => setDecisionTarget({ project: p, kind: 'recommend' })}>
                          <Info className="h-3.5 w-3.5" aria-hidden="true" /> Submit Recommendation
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </>
        ) : (
          <p className={`py-14 text-center ${labelCls}`}>
            The review queue is clear
          </p>
        )}
      </Card>

      <h2 className="mb-3 mt-8 text-base font-semibold text-ink">Decided · {decided.length}</h2>
      <Card className="overflow-hidden">
        {decided.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className={`border-b border-line bg-surface-muted/50 ${labelCls}`}>
                    <th className="px-4 py-3 font-medium">Project ID</th>
                    <th className="px-4 py-3 font-medium">Project</th>
                    <th className="px-4 py-3 font-medium">Reviewer</th>
                    <th className="px-4 py-3 text-right font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {decided.map((p, i) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.2 }}
                      className="border-b border-ink/5 last:border-0 hover:bg-ink-50/50"
                    >
                      <td className="px-4 py-3">
                        <Link to={`/projects/${p.id}`} className="font-mono text-xs font-medium text-ink-700 underline-offset-4 hover:text-accent hover:underline">
                          {p.docketNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/projects/${p.id}`} className="font-medium text-ink underline-offset-4 hover:text-accent hover:underline">
                          {p.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-ink-700/90">{p.reviewerName || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-block">
                          <RubberStamp status={p.status} size="sm" tilt={-3} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/projects/${p.id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs font-semibold text-accent transition-colors hover:border-accent/40 hover:bg-accent-soft"
                        >
                          Open
                          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-line md:hidden">
              {decided.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  className="px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link to={`/projects/${p.id}`} className="font-medium text-ink underline-offset-4 hover:text-accent hover:underline">
                        {p.title}
                      </Link>
                      <p className="mt-0.5 font-mono text-[11px] text-ink-700/60 tabular-nums">{p.docketNumber}</p>
                    </div>
                    <RubberStamp status={p.status} size="sm" tilt={-3} />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-ink-700/60">{p.reviewerName || '—'}</p>
                    <Link
                      to={`/projects/${p.id}`}
                      className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs font-semibold text-accent transition-colors hover:border-accent/40 hover:bg-accent-soft"
                    >
                      Open <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <p className={`py-10 text-center ${labelCls}`}>No decisions recorded</p>
        )}
      </Card>
    </AppShell>
  )
}
