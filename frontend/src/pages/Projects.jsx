/*
 * ─────────────────────────────────────────────────────────────────────────
 * PROJECT TRACK — System-wide project monitoring & tracking
 *
 * Allows admin/DM to track all projects across external companies and
 * internal users. Shows status distribution, problem indicators (stuck
 * projects, unassigned, overdue), and organization breakdown.
 *
 * ROLE ACCESS:
 *   ADMIN / DIVISION_MANAGER — full view (all projects)
 *   REVIEWER — only assigned projects
 *   EXTERNAL_USER — only their own projects
 * ─────────────────────────────────────────────────────────────────────────
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUpRight, AlertTriangle, Building2, Clock, Filter,
  FolderKanban, Search, UserCheck, Users, XCircle,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { api } from '../lib/api'
import AppShell from '../components/AppShell'
import RubberStamp from '../components/RubberStamp'
import { Alert, Card, labelCls } from '../components/ui'
import { PageHeader, Panel } from '../components/dashboard'
import { StaggerContainer, StaggerItem } from '../components/AnimatedPage'
import AnimatedCounter from '../components/AnimatedCounter'
import { fmtDate, fmtTime } from '../lib/format'

const FILTERS = ['ALL', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMITTED', 'ARCHIVED']

const STATUS_TONES = {
  SUBMITTED: 'bg-amber-light/50 text-amber-dark',
  IN_REVIEW: 'bg-accent-soft text-accent',
  APPROVED: 'bg-sage-light/60 text-sage-dark',
  REJECTED: 'bg-brick-light/40 text-brick',
  RESUBMITTED: 'bg-amber-light/50 text-amber-dark',
  ARCHIVED: 'bg-surface-muted text-muted',
}

/* ── Stat Card ──────────────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, tone, onClick }) {
  const tones = {
    navy: 'text-ink',
    amber: 'text-amber-dark',
    sage: 'text-sage',
    brick: 'text-brick',
  }
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={onClick}
      className={`rounded-xl border border-line bg-surface p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <p className={labelCls}>{label}</p>
        <span className={`rounded-md bg-surface-muted p-1.5 ${tones[tone]}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className={`mt-2 font-mono text-3xl font-semibold tabular-nums ${tones[tone]}`}>
        <AnimatedCounter value={value} className={tones[tone]} />
      </p>
    </motion.div>
  )
}

/* ── Problem Indicator ──────────────────────────────────────────────── */
function ProblemCard({ icon: Icon, title, count, description, color, onClick }) {
  if (count === 0) return null
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`flex items-center gap-4 rounded-xl border p-4 transition-all cursor-pointer ${color}`}
    >
      <div className="rounded-lg bg-white/60 p-2">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{title}</p>
          <span className="font-mono text-lg font-bold tabular-nums">{count}</span>
        </div>
        <p className="text-xs opacity-75">{description}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 opacity-50" aria-hidden="true" />
    </motion.div>
  )
}

export default function Projects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [problemFilter, setProblemFilter] = useState(null) // null | 'unassigned' | 'stuck' | 'old'

  const load = useCallback(async () => {
    try {
      setProjects(await api('/projects'))
    } catch (err) {
      setError(err.message || 'Unable to load projects.')
    }
  }, [])

  useEffect(() => { load() }, [load])

  const role = user?.role
  const isAdmin = role === 'ADMIN' || role === 'DIVISION_MANAGER'

  /* ── Computed data ──────────────────────────────────────────────── */
  const all = projects || []

  const byStatus = useMemo(() => {
    const counts = {}
    for (const p of all) {
      counts[p.status] = (counts[p.status] || 0) + 1
    }
    return counts
  }, [all])

  const orgBreakdown = useMemo(() => {
    const orgs = {}
    for (const p of all) {
      const org = p.organizationName || 'Unknown'
      orgs[org] = (orgs[org] || 0) + 1
    }
    return Object.entries(orgs).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [all])

  /* ── Problem detection ──────────────────────────────────────────── */
  const problems = useMemo(() => {
    const now = Date.now()
    const DAY = 86400000

    const unassigned = all.filter((p) =>
      ['SUBMITTED', 'RESUBMITTED'].includes(p.status) && !p.reviewerName
    )
    const stuck = all.filter((p) => {
      if (p.status !== 'IN_REVIEW') return false
      const lastUpdate = p.updatedAt || p.submittedAt || p.createdAt
      return lastUpdate && (now - new Date(lastUpdate).getTime()) > 14 * DAY
    })
    const old = all.filter((p) => {
      if (['APPROVED', 'REJECTED', 'ARCHIVED'].includes(p.status)) return false
      const created = p.createdAt
      return created && (now - new Date(created).getTime()) > 30 * DAY
    })

    return { unassigned, stuck, old }
  }, [all])

  /* ── Filtered list ──────────────────────────────────────────────── */
  const list = useMemo(() => {
    let result = all

    // Status filter
    if (filter !== 'ALL') {
      result = result.filter((p) => p.status === filter)
    }

    // Problem filter
    if (problemFilter === 'unassigned') {
      result = problems.unassigned
    } else if (problemFilter === 'stuck') {
      result = problems.stuck
    } else if (problemFilter === 'old') {
      result = problems.old
    }

    // Search
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((p) =>
        p.title?.toLowerCase().includes(q) ||
        p.docketNumber?.toLowerCase().includes(q) ||
        p.organizationName?.toLowerCase().includes(q) ||
        p.reviewerName?.toLowerCase().includes(q)
      )
    }

    return result
  }, [all, filter, problemFilter, search])

  return (
    <AppShell>
      <PageHeader
        eyebrow="Review Ledger"
        title="Project Track"
        subtitle="Monitor all projects across external companies and internal teams. Track status, identify issues, and oversee the review pipeline."
      />

      {error && <Alert kind="error">{error}</Alert>}

      {/* ── Stats Row ──────────────────────────────────────────────── */}
      <StaggerContainer className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StaggerItem>
          <StatCard label="Total Projects" value={all.length} icon={FolderKanban} tone="navy" />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Submitted"
            value={byStatus.SUBMITTED || 0}
            icon={Clock}
            tone="amber"
            onClick={() => { setFilter('SUBMITTED'); setProblemFilter(null) }}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="In Review"
            value={byStatus.IN_REVIEW || 0}
            icon={FolderKanban}
            tone="navy"
            onClick={() => { setFilter('IN_REVIEW'); setProblemFilter(null) }}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Approved"
            value={byStatus.APPROVED || 0}
            icon={UserCheck}
            tone="sage"
            onClick={() => { setFilter('APPROVED'); setProblemFilter(null) }}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Rejected"
            value={byStatus.REJECTED || 0}
            icon={XCircle}
            tone="brick"
            onClick={() => { setFilter('REJECTED'); setProblemFilter(null) }}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Resubmitted"
            value={byStatus.RESUBMITTED || 0}
            icon={Clock}
            tone="amber"
            onClick={() => { setFilter('RESUBMITTED'); setProblemFilter(null) }}
          />
        </StaggerItem>
      </StaggerContainer>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* ── Problem Indicators (admin/DM only) ──────────────────── */}
          {isAdmin && (
            <Panel title="Issues Requiring Attention">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <ProblemCard
                  icon={AlertTriangle}
                  title="Unassigned"
                  count={problems.unassigned.length}
                  description="Projects waiting for a reviewer"
                  color="border-amber/30 bg-amber-light/15 text-amber-dark"
                  onClick={() => { setProblemFilter(problemFilter === 'unassigned' ? null : 'unassigned'); setFilter('ALL') }}
                />
                <ProblemCard
                  icon={Clock}
                  title="Stuck (>14 days)"
                  count={problems.stuck.length}
                  description="In review too long"
                  color="border-brick/30 bg-brick-light/15 text-brick"
                  onClick={() => { setProblemFilter(problemFilter === 'stuck' ? null : 'stuck'); setFilter('ALL') }}
                />
                <ProblemCard
                  icon={AlertTriangle}
                  title="Old (>30 days)"
                  count={problems.old.length}
                  description="Open projects aging out"
                  color="border-amber-dark/30 bg-amber/10 text-amber-dark"
                  onClick={() => { setProblemFilter(problemFilter === 'old' ? null : 'old'); setFilter('ALL') }}
                />
              </div>
              {problemFilter && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-muted">Showing:</span>
                  <button
                    onClick={() => setProblemFilter(null)}
                    className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
                  >
                    {problemFilter === 'unassigned' ? 'Unassigned Projects' : problemFilter === 'stuck' ? 'Stuck Projects' : 'Old Projects'}
                    <XCircle className="h-3 w-3" />
                  </button>
                </div>
              )}
            </Panel>
          )}

          {/* ── Project Table ───────────────────────────────────────── */}
          <Card className="overflow-hidden">
            {/* Filters + Search */}
            <div className="border-b border-line px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Search projects…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm outline-none transition-colors focus:border-accent"
                    aria-label="Search projects"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
                      <XCircle className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {FILTERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => { setFilter(f); setProblemFilter(null) }}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                        filter === f && !problemFilter ? 'bg-accent text-white' : 'bg-surface text-ink-700/70 ring-1 ring-line hover:bg-surface-muted'
                      }`}
                    >
                      {f === 'ALL' ? 'All' : f.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            {projects === null ? (
              <div className="p-6">
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-muted" />
                  ))}
                </div>
              </div>
            ) : list.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className={`border-b border-line bg-surface-muted/50 ${labelCls}`}>
                      <th className="px-4 py-3 font-medium">Project ID</th>
                      <th className="px-4 py-3 font-medium">Project</th>
                      <th className="px-4 py-3 font-medium">Organization</th>
                      <th className="px-4 py-3 font-medium">Reviewer</th>
                      <th className="px-4 py-3 font-medium">Submitted</th>
                      <th className="px-4 py-3 text-right font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((p, i) => (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.2 }}
                        className="border-b border-ink/5 last:border-0 hover:bg-ink-50/50 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <Link to={`/projects/${p.id}`} className="font-mono text-xs font-medium text-ink-700 underline-offset-4 hover:text-accent hover:underline">
                            {p.docketNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5">
                          <Link to={`/projects/${p.id}`} className="font-medium text-ink underline-offset-4 hover:text-accent hover:underline">
                            {p.title}
                          </Link>
                          <p className={labelCls}>{p.category || 'Uncategorized'}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-muted shrink-0" aria-hidden="true" />
                            <span className="text-ink-700/90 truncate max-w-[140px]">{p.organizationName || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {p.reviewerName ? (
                            <div className="flex items-center gap-1.5">
                              <div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center text-[9px] font-bold text-accent">
                                {p.reviewerName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                              </div>
                              <span className="text-ink-700/90 text-xs">{p.reviewerName}</span>
                            </div>
                          ) : (
                            <span className="text-ink-700/45 text-xs italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-ink-700/75">
                          <span className="tabular-nums">{fmtDate(p.submittedAt || p.createdAt)}</span>{' '}
                          <span className="text-ink-700/45 tabular-nums">{fmtTime(p.submittedAt || p.createdAt)}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_TONES[p.status] || 'bg-surface-muted text-muted'}`}>
                            {p.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
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
            ) : (
              <div className="py-14 text-center">
                <FolderKanban className="mx-auto mb-3 h-10 w-10 text-ink-700/20" aria-hidden="true" />
                <p className={`text-sm font-medium ${labelCls}`}>
                  {search ? 'No projects match your search' : problemFilter ? 'No projects with this issue' : 'No dockets on file'}
                </p>
                {(search || problemFilter) && (
                  <button
                    onClick={() => { setSearch(''); setProblemFilter(null); setFilter('ALL') }}
                    className="mt-2 text-xs font-semibold text-accent hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* ── Sidebar Panels ─────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Organization Breakdown */}
          <Panel title="Projects by Organization">
            {orgBreakdown.length > 0 ? (
              <dl className="space-y-2">
                {orgBreakdown.map(([org, count]) => (
                  <div key={org} className="flex items-center justify-between rounded-lg bg-surface-muted/50 px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-accent/10 text-[9px] font-bold text-accent">
                        {org.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-sm text-ink truncate">{org}</span>
                    </div>
                    <span className="font-mono text-sm font-semibold text-ink tabular-nums">{count}</span>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="py-6 text-center text-sm text-muted">No projects yet</p>
            )}
          </Panel>

          {/* Status Summary */}
          <Panel title="Status Summary">
            <dl className="space-y-2">
              {Object.entries(byStatus).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between rounded-lg bg-surface-muted/50 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <RubberStamp status={status} size="sm" />
                    <span className="text-sm text-ink">{status.replace('_', ' ')}</span>
                  </div>
                  <span className="font-mono text-sm font-semibold text-ink tabular-nums">{count}</span>
                </div>
              ))}
            </dl>
          </Panel>

          {/* Quick Actions */}
          <Panel title="Quick Actions">
            <div className="grid grid-cols-1 gap-2">
              <Link
                to="/reviews"
                className="flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
              >
                Open Review Queue
                <ArrowUpRight className="h-4 w-4 text-muted" />
              </Link>
              <Link
                to="/reports"
                className="flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
              >
                Generate Report
                <ArrowUpRight className="h-4 w-4 text-muted" />
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  )
}
