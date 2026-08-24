/*
 * ─────────────────────────────────────────────────────────────────────────
 * RWB PROJECT REVIEW SYSTEM — ROLE-SPECIFIC DASHBOARD
 *
 * Each role gets a tailored dashboard showing only what matters to them:
 *
 *   ADMIN             — system-wide stats, pending user approvals, monthly
 *                       charts, recent projects, activity feed, quick actions
 *   DIVISION_MANAGER  — project oversight, assignment queue, review progress
 *   REVIEWER          — personal queue focus, assigned projects, completion
 *   EXTERNAL_USER     — my projects focus, submission status, create CTA
 *   SUPER_REVIEWER    — broader oversight, team performance, review queue
 *
 * All tokens live in index.css @theme (single shared style source):
 *   SURFACES  — canvas #F7F6F3 · cards #FFFFFF · info tiles #F0EEEA
 *   TEXT      — primary #1A2332 · micro-labels #8A8F98 (11px/uppercase/.05em)
 *   ACCENT    — navy #1F3A5F ONLY (links, active nav, primary actions)
 *   STATES    — success #4A7C59 · danger #B34A4A · warning #D99A3F
 *   BORDERS   — hairline #E4E2DE
 *
 * FONTS — Inter for everything (400/500/600/700): page titles 28px bold,
 * section headers 16px semibold, labels 11px / medium / uppercase / 0.05em
 * muted, body 14px. IBM Plex Mono is used ONLY for numerals (stat values,
 * counts, docket IDs, dates) via font-mono + tabular-nums.
 *
 * STATUS MEANING — one meaning everywhere (badges, icons, legends, progress):
 *   Pending / Awaiting     amber (#D99A3F) — SUBMITTED, RESUBMITTED, awaiting
 *                           assignment, pending approvals, remaining reviews
 *   Approved / Completed   sage (#4A7C59)  — APPROVED, completed counts,
 *                           chart "completed" series, donut
 *   Rejected               brick (#B34A4A) — REJECTED
 *   Informational/Neutral  accent navy (#1F3A5F) — IN_REVIEW, received,
 *                           assigned, calendar "docket received" markers
 * ─────────────────────────────────────────────────────────────────────────
 */

import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  FileCheck2,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { api } from '../lib/api'
import AppShell from '../components/AppShell'
import RubberStamp from '../components/RubberStamp'
import { Alert, Button, labelCls } from '../components/ui'
import { PageHeader, Panel, Legend, EmptyChart } from '../components/dashboard'
import BarChart from '../components/charts/BarChart'
import TrendChart from '../components/charts/TrendChart'
import Donut from '../components/charts/Donut'
import CalendarView from '../components/CalendarView'
import ActivityFeed from '../components/ActivityFeed'
import AnimatedCounter from '../components/AnimatedCounter'
import { DashboardSkeleton } from '../components/Skeleton'
import { StaggerContainer, StaggerItem } from '../components/AnimatedPage'
import { fmtDate, fmtTime } from '../lib/format'

/* ── Role-specific titles and subtitles ──────────────────────────────── */
const ROLE_TITLES = {
  ADMIN: 'System Administrator Dashboard',
  EXTERNAL_USER: 'External User Dashboard',
  REVIEWER: 'Reviewer Dashboard',
  DIVISION_MANAGER: 'Division Manager Dashboard',
  SUPER_REVIEWER: 'Super Reviewer Dashboard',
}

const ROLE_SUBTITLES = {
  ADMIN: (name) => `Welcome back, ${name}. System-wide overview and pending approvals.`,
  DIVISION_MANAGER: (name) => `Welcome back, ${name}. Project oversight and assignment queue.`,
  REVIEWER: (name) => `Welcome back, ${name}. Your personal review queue.`,
  EXTERNAL_USER: (name) => `Welcome back, ${name}. Track your submitted projects.`,
  SUPER_REVIEWER: (name) => `Welcome back, ${name}. Team performance and review overview.`,
}

/* ── Animated counter hook ───────────────────────────────────────────── */
function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0)
  const ref = useState(null)
  const started = useState(false)

  useEffect(() => {
    if (!ref[0]) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started[0]) {
          started[1](true)
          const start = Date.now()
          const tick = () => {
            const elapsed = Date.now() - start
            const progress = Math.min(elapsed / duration, 1)
            setCount(Math.floor(progress * target))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(ref[0])
    return () => observer.disconnect()
  }, [target, duration, ref[0], started[0]])

  return { count, ref: ref[1] }
}

/* ── Stat card ───────────────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, tone, trend, onClick }) {
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
      className={`rounded-xl border border-line bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] ${onClick ? 'cursor-pointer' : ''}`}
      aria-live="polite"
    >
      <div className="flex items-start justify-between">
        <p className={labelCls}>{label}</p>
        <motion.span
          whileHover={{ rotate: 8, scale: 1.15 }}
          className={`rounded-md bg-surface-muted p-1.5 ${tones[tone]}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </motion.span>
      </div>
      <p className={`mt-2 font-mono text-3xl font-semibold tabular-nums ${tones[tone]}`}>
        <AnimatedCounter value={value} className={tones[tone]} />
      </p>
      {trend && (
        <p className={`mt-1 text-[11px] font-medium ${trend === 'even' ? 'text-ink-700/45' : 'text-sage'}`}>
          {trend === 'even' ? '— steady' : `▲ ${trend}`}
        </p>
      )}
    </motion.div>
  )
}

/* ── Role labels (used by admin dashboard) ────────────────────────── */
const ROLES = {
  ADMIN: 'System Administrator',
  DIVISION_MANAGER: 'Division Manager',
  REVIEWER: 'Reviewer',
  SUPER_REVIEWER: 'Super Reviewer',
  EXTERNAL_USER: 'External User',
}

/* ── Helper: trend calculation ───────────────────────────────────────── */
function trendOf(monthly) {
  if (!monthly || monthly.length < 2) return null
  const last = monthly[monthly.length - 1]
  const prev = monthly[monthly.length - 2]
  const delta = last.received - prev.received
  if (delta === 0) return 'even'
  return delta > 0 ? `+${delta} vs last month` : `${delta} vs last month`
}

/* ═══════════════════════════════════════════════════════════════════════
 * ADMIN DASHBOARD
 * Admin-focused: user management overview, system health, activity feed
 * No project charts — that's for Division Managers and Reviewers
 * ═══════════════════════════════════════════════════════════════════════ */
function AdminDashboard({ stats, activity, pendingUsers, allUsers, navigate }) {
  const byStatus = stats.byStatus || {}
  const monthly = stats.monthlySubmissions || []
  const totalUsers = allUsers?.length || 0
  const activeUsers = allUsers?.filter((u) => u.accountStatus === 'ACTIVE').length || 0
  const disabledUsers = allUsers?.filter((u) => u.accountStatus === 'DISABLED').length || 0

  const cards = [
    { label: 'Total Users', value: totalUsers, icon: Users, tone: 'navy', trend: null },
    { label: 'Pending Approvals', value: pendingUsers, icon: UserCheck, tone: 'amber', trend: null },
    { label: 'Active Users', value: activeUsers, icon: UserCheck, tone: 'sage', trend: null },
    { label: 'Total Projects', value: stats.total, icon: FolderKanban, tone: 'navy', trend: null },
  ]

  const recentActivity = activity || []
  const recentDates = (stats.recent || []).map((p) => p.submittedAt || p.createdAt)

  return (
    <>
      <StaggerContainer className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <StaggerItem key={c.label}>
            <StatCard {...c} onClick={c.label === 'Pending Approvals' ? () => navigate('/app-management') : undefined} />
          </StaggerItem>
        ))}
      </StaggerContainer>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* Charts — system-level project health */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel
              title="Monthly Project Submissions"
              action={<Legend items={[{ label: 'Received', color: '#1f3a5f' }, { label: 'Completed', color: '#4a7c59' }]} />}
            >
              {monthly.length >= 4 ? <BarChart data={monthly} height={190} /> : <EmptyChart />}
            </Panel>
            <Panel
              title="Project Status Distribution"
            >
              <div className="flex items-center justify-center">
                <Donut
                  percent={stats.total > 0 ? Math.round(((byStatus.APPROVED || 0) / stats.total) * 100) : 0}
                  label="Approved"
                />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-md bg-surface-muted px-2 py-2">
                  <dt className={labelCls}>Pending</dt>
                  <dd className="font-mono text-sm font-semibold text-ink tabular-nums">
                    {(byStatus.SUBMITTED || 0) + (byStatus.IN_REVIEW || 0) + (byStatus.RESUBMITTED || 0)}
                  </dd>
                </div>
                <div className="rounded-md bg-sage-light/60 px-2 py-2">
                  <dt className={`${labelCls} text-sage-dark`}>Approved</dt>
                  <dd className="font-mono text-sm font-semibold text-sage-dark tabular-nums">{byStatus.APPROVED || 0}</dd>
                </div>
                <div className="rounded-md bg-brick-light/40 px-2 py-2">
                  <dt className={`${labelCls} text-brick`}>Rejected</dt>
                  <dd className="font-mono text-sm font-semibold text-brick tabular-nums">{byStatus.REJECTED || 0}</dd>
                </div>
                <div className="rounded-md bg-amber-light/40 px-2 py-2">
                  <dt className={`${labelCls} text-amber-dark`}>Archived</dt>
                  <dd className="font-mono text-sm font-semibold text-amber-dark tabular-nums">{byStatus.ARCHIVED || 0}</dd>
                </div>
              </dl>
            </Panel>
          </div>

          {/* System Overview — user breakdown by role */}
          <Panel title="System Overview">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {Object.entries(ROLES).map(([role, label]) => {
                const count = allUsers?.filter((u) => u.role === role).length || 0
                return (
                  <div key={role} className="rounded-lg border border-line bg-surface-muted/50 p-3 text-center">
                    <p className="font-mono text-2xl font-semibold text-ink tabular-nums">{count}</p>
                    <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted">{label.split(' ')[0]}</p>
                  </div>
                )
              })}
            </div>
          </Panel>

          {/* Recent projects — quick awareness for admin */}
          <RecentProjectsTable projects={stats.recent} />
        </div>

        <div className="space-y-6">
          {/* Pending Approvals — the admin's primary concern */}
          {pendingUsers > 0 && (
            <Panel title="Pending Approvals">
              <div className="rounded-lg border border-amber/30 bg-amber-light/20 p-4 text-center">
                <p className="font-mono text-3xl font-semibold text-amber-dark tabular-nums">{pendingUsers}</p>
                <p className="mt-1 text-sm text-amber-dark">accounts awaiting review</p>
                <Button variant="secondary" className="mt-3 w-full" onClick={() => navigate('/app-management')}>
                  Review Now <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </Panel>
          )}

          {/* Review Calendar */}
          <Panel title="Project Calendar">
            <CalendarView submissionDates={recentDates} />
          </Panel>

          {/* User Status Breakdown */}
          <Panel title="User Status">
            <dl className="space-y-2">
              <div className="flex items-center justify-between rounded-md bg-sage-light/40 px-3 py-2.5">
                <dt className={labelCls}>Active</dt>
                <dd className="font-mono text-lg font-semibold text-sage-dark tabular-nums">{activeUsers}</dd>
              </div>
              <div className="flex items-center justify-between rounded-md bg-amber-light/40 px-3 py-2.5">
                <dt className={`${labelCls} text-amber-dark`}>Pending</dt>
                <dd className="font-mono text-lg font-semibold text-amber-dark tabular-nums">{pendingUsers}</dd>
              </div>
              {disabledUsers > 0 && (
                <div className="flex items-center justify-between rounded-md bg-brick-light/30 px-3 py-2.5">
                  <dt className={`${labelCls} text-brick`}>Disabled</dt>
                  <dd className="font-mono text-lg font-semibold text-brick tabular-nums">{disabledUsers}</dd>
                </div>
              )}
            </dl>
          </Panel>

          {/* Recent Activity Feed */}
          <Panel title="Recent Activity">
            {recentActivity.length > 0 ? (
              <ActivityFeed items={recentActivity} limit={6} />
            ) : (
              <div className="py-8 text-center">
                <Clock className="mx-auto mb-3 h-8 w-8 text-ink-700/20" aria-hidden="true" />
                <p className="text-sm text-muted">No recent activity</p>
              </div>
            )}
          </Panel>

          {/* Quick Actions */}
          <Panel title="Quick Actions">
            <div className="grid grid-cols-1 gap-2">
              <Button variant="secondary" onClick={() => navigate('/app-management')}>
                Manage Users & Settings <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button variant="secondary" onClick={() => navigate('/reports')}>
                View Reports & Analytics <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
 * DIVISION MANAGER DASHBOARD
 * Project oversight, assignment queue, review progress
 * ═══════════════════════════════════════════════════════════════════════ */
function DivisionManagerDashboard({ stats, activity, navigate }) {
  const byStatus = stats.byStatus || {}
  const monthly = stats.monthlySubmissions || []
  const workload = stats.workload || {}
  const trend = trendOf(monthly)

  const cards = [
    { label: 'Projects Received', value: stats.total, icon: Inbox, tone: 'navy', trend },
    { label: 'Awaiting Assignment', value: stats.pendingAssignments ?? 0, icon: Clock, tone: 'amber', trend: null },
    { label: 'Under Review', value: (byStatus.IN_REVIEW || 0) + (byStatus.RESUBMITTED || 0), icon: FileCheck2, tone: 'navy', trend: null },
    { label: 'Approved', value: byStatus.APPROVED || 0, icon: UserCheck, tone: 'sage', trend: null },
  ]

  const recentDates = (stats.recent || []).map((p) => p.submittedAt || p.createdAt)

  return (
    <>
      <StaggerContainer className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <StaggerItem key={c.label}>
            <StatCard
              {...c}
              onClick={c.label === 'Awaiting Assignment' && (stats.pendingAssignments ?? 0) > 0 ? () => navigate('/reviews') : undefined}
            />
          </StaggerItem>
        ))}
      </StaggerContainer>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* Charts — DM sees submission trends for oversight */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel
              title="Monthly Project Submissions"
              action={<Legend items={[{ label: 'Received', color: '#1f3a5f' }, { label: 'Completed', color: '#4a7c59' }]} />}
            >
              {monthly.length >= 4 ? <BarChart data={monthly} height={190} /> : <EmptyChart />}
            </Panel>
            <Panel
              title="Review Completion Trend"
              action={<Legend items={[{ label: 'Received', color: '#1f3a5f' }, { label: 'Completed', color: '#4a7c59' }]} />}
            >
              {monthly.length >= 4 ? <TrendChart data={monthly} height={190} /> : <EmptyChart />}
            </Panel>
          </div>

          {/* Recent projects — DM reviews all */}
          <RecentProjectsTable projects={stats.recent} />
        </div>

        <div className="space-y-6">
          <Panel title="Review Progress">
            <div className="flex items-center justify-center">
              <Donut percent={workload.progressPercent || 0} label="Completed" />
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-surface-muted px-2 py-2.5">
                <dt className={labelCls}>Assigned</dt>
                <dd className="font-mono text-lg font-semibold text-ink tabular-nums">{workload.assignedReviews ?? 0}</dd>
              </div>
              <div className="rounded-md bg-sage-light/60 px-2 py-2.5">
                <dt className={`${labelCls} text-sage-dark`}>Completed</dt>
                <dd className="font-mono text-lg font-semibold text-sage-dark tabular-nums">{workload.completedReviews ?? 0}</dd>
              </div>
              <div className="rounded-md bg-amber-light/50 px-2 py-2.5">
                <dt className={`${labelCls} text-amber-dark`}>Remaining</dt>
                <dd className="font-mono text-lg font-semibold text-amber-dark tabular-nums">{workload.remainingReviews ?? 0}</dd>
              </div>
            </dl>
            <Button variant="secondary" className="mt-4 w-full" onClick={() => navigate('/reviews')}>
              View Queue <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Panel>

          <Panel title="Review Calendar">
            <CalendarView submissionDates={recentDates} />
          </Panel>

          <Panel title="Recent Activity">
            <ActivityFeed items={activity} limit={6} />
          </Panel>

          <Panel title="Quick Actions">
            <div className="grid grid-cols-1 gap-2">
              <Button variant="secondary" onClick={() => navigate('/reviews')}>Assign Reviewer to Project</Button>
              <Button variant="secondary" onClick={() => navigate('/reports')}>View Reports & Analytics</Button>
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
 * REVIEWER DASHBOARD
 * Personal queue focus — assigned projects, completion stats
 * No system-wide charts, no activity feed (too broad for a reviewer)
 * ═══════════════════════════════════════════════════════════════════════ */
function ReviewerDashboard({ projects, user, navigate }) {
  const mine = projects.filter((p) => p.reviewerName === user?.fullName)
  const mineActive = mine.filter((p) => ['IN_REVIEW', 'SUBMITTED', 'RESUBMITTED'].includes(p.status))
  const mineCompleted = mine.filter((p) => ['APPROVED', 'REJECTED'].includes(p.status))
  const mineApproved = mine.filter((p) => p.status === 'APPROVED')
  const mineRejected = mine.filter((p) => p.status === 'REJECTED')

  const completionPct = mine.length > 0 ? Math.round((mineCompleted.length / mine.length) * 100) : 0

  const cards = [
    { label: 'Assigned to Me', value: mine.length, icon: FolderKanban, tone: 'navy', trend: null },
    { label: 'Pending Reviews', value: mineActive.length, icon: FileCheck2, tone: 'amber', trend: null },
    { label: 'Completed', value: mineCompleted.length, icon: UserCheck, tone: 'sage', trend: null },
    { label: 'Rejected', value: mineRejected.length, icon: XCircle, tone: 'brick', trend: null },
  ]

  return (
    <>
      <StaggerContainer className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <StaggerItem key={c.label}>
            <StatCard {...c} />
          </StaggerItem>
        ))}
      </StaggerContainer>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* My assigned projects — the reviewer's primary view */}
          <Panel title="My Assigned Projects">
            {mine.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px] text-left text-sm">
                  <thead>
                    <tr className={`border-b border-line ${labelCls}`}>
                      <th className="pb-2.5 pr-3 font-medium">Project ID</th>
                      <th className="pb-2.5 pr-3 font-medium">Project</th>
                      <th className="pb-2.5 pr-3 font-medium">Submitted</th>
                      <th className="pb-2.5 pr-3 text-right font-medium">Status</th>
                      <th className="pb-2.5 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mine.map((p) => (
                      <tr key={p.id} className="border-b border-ink/5 last:border-0 hover:bg-ink-50/50">
                        <td className="py-3 pr-3">
                          <Link to={`/projects/${p.id}`} className="font-mono text-xs font-medium text-ink-700 underline-offset-4 hover:text-accent hover:underline">
                            {p.docketNumber}
                          </Link>
                        </td>
                        <td className="py-3 pr-3">
                          <Link to={`/projects/${p.id}`} className="font-medium text-ink underline-offset-4 hover:text-accent hover:underline">
                            {p.title}
                          </Link>
                          <p className={labelCls}>{p.organizationName || '—'}</p>
                        </td>
                        <td className="py-3 pr-3 font-mono text-[11px] text-ink-700/75">
                          <span className="tabular-nums">{fmtDate(p.submittedAt || p.createdAt)}</span>{' '}
                          <span className="text-ink-700/45 tabular-nums">{fmtTime(p.submittedAt || p.createdAt)}</span>
                        </td>
                        <td className="py-3 pr-3 text-right">
                          <div className="inline-block">
                            <RubberStamp status={p.status} size="sm" tilt={-3} />
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            to={`/projects/${p.id}`}
                            className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs font-semibold text-accent transition-colors hover:border-accent/40 hover:bg-accent-soft"
                          >
                            Review
                            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center">
                <Inbox className="mx-auto mb-3 h-10 w-10 text-ink-700/20" aria-hidden="true" />
                <p className="text-sm font-medium text-ink-700/50">No projects assigned to you yet</p>
                <p className="mt-1 text-xs text-ink-700/35">Projects will appear here when a Division Manager assigns them to you.</p>
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          {/* Personal completion progress */}
          <Panel title="My Review Progress">
            <div className="flex items-center justify-center">
              <Donut percent={completionPct} label="Completed" />
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-surface-muted px-2 py-2.5">
                <dt className={labelCls}>Total</dt>
                <dd className="font-mono text-lg font-semibold text-ink tabular-nums">{mine.length}</dd>
              </div>
              <div className="rounded-md bg-sage-light/60 px-2 py-2.5">
                <dt className={`${labelCls} text-sage-dark`}>Done</dt>
                <dd className="font-mono text-lg font-semibold text-sage-dark tabular-nums">{mineCompleted.length}</dd>
              </div>
              <div className="rounded-md bg-amber-light/50 px-2 py-2.5">
                <dt className={`${labelCls} text-amber-dark`}>Active</dt>
                <dd className="font-mono text-lg font-semibold text-amber-dark tabular-nums">{mineActive.length}</dd>
              </div>
            </dl>
          </Panel>

          {/* Quick action — go to review queue */}
          <Panel title="Quick Actions">
            <div className="grid grid-cols-1 gap-2">
              <Button variant="secondary" onClick={() => navigate('/reviews')}>
                Open My Review Queue <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
 * EXTERNAL USER DASHBOARD
 * My projects focus — submission status, create CTA
 * No system-wide charts, no review progress (not their concern)
 * ═══════════════════════════════════════════════════════════════════════ */
function ExternalUserDashboard({ stats, projects, navigate }) {
  const byStatus = stats.byStatus || {}

  const cards = [
    { label: 'My Projects', value: stats.total, icon: Inbox, tone: 'navy', trend: null },
    { label: 'Under Review', value: (byStatus.IN_REVIEW || 0) + (byStatus.RESUBMITTED || 0), icon: FileCheck2, tone: 'navy', trend: null },
    { label: 'Approved', value: byStatus.APPROVED || 0, icon: UserCheck, tone: 'sage', trend: null },
    { label: 'Rejected', value: byStatus.REJECTED || 0, icon: XCircle, tone: 'brick', trend: null },
  ]

  return (
    <>
      {/* Prominent CTA — external users' primary action is creating projects */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-xl border border-accent/20 bg-accent/5 p-5"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Ready to submit a new project?</p>
            <p className="mt-0.5 text-xs text-ink-700/60">Fill out the submission form with project details and attachments.</p>
          </div>
          <Button onClick={() => navigate('/projects/new')}>
            <span aria-hidden="true">+</span> Submit New Project
          </Button>
        </div>
      </motion.div>

      <StaggerContainer className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <StaggerItem key={c.label}>
            <StatCard {...c} />
          </StaggerItem>
        ))}
      </StaggerContainer>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* My projects list — external users see only their own */}
          <Panel title="My Projects">
            {stats.recent && stats.recent.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px] text-left text-sm">
                  <thead>
                    <tr className={`border-b border-line ${labelCls}`}>
                      <th className="pb-2.5 pr-3 font-medium">Project ID</th>
                      <th className="pb-2.5 pr-3 font-medium">Project</th>
                      <th className="pb-2.5 pr-3 font-medium">Submitted</th>
                      <th className="pb-2.5 pr-3 text-right font-medium">Status</th>
                      <th className="pb-2.5 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent.map((p) => (
                      <tr key={p.id} className="border-b border-ink/5 last:border-0 hover:bg-ink-50/50">
                        <td className="py-3 pr-3">
                          <Link to={`/projects/${p.id}`} className="font-mono text-xs font-medium text-ink-700 underline-offset-4 hover:text-accent hover:underline">
                            {p.docketNumber}
                          </Link>
                        </td>
                        <td className="py-3 pr-3">
                          <Link to={`/projects/${p.id}`} className="font-medium text-ink underline-offset-4 hover:text-accent hover:underline">
                            {p.title}
                          </Link>
                        </td>
                        <td className="py-3 pr-3 font-mono text-[11px] text-ink-700/75">
                          <span className="tabular-nums">{fmtDate(p.submittedAt || p.createdAt)}</span>{' '}
                          <span className="text-ink-700/45 tabular-nums">{fmtTime(p.submittedAt || p.createdAt)}</span>
                        </td>
                        <td className="py-3 pr-3 text-right">
                          <div className="inline-block">
                            <RubberStamp status={p.status} size="sm" tilt={-3} />
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            to={`/projects/${p.id}`}
                            className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs font-semibold text-accent transition-colors hover:border-accent/40 hover:bg-accent-soft"
                          >
                            View
                            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center">
                <Inbox className="mx-auto mb-3 h-10 w-10 text-ink-700/20" aria-hidden="true" />
                <p className="text-sm font-medium text-ink-700/50">No projects yet</p>
                <p className="mt-1 text-xs text-ink-700/35">Submit your first project to get started.</p>
                <Button className="mt-4" onClick={() => navigate('/projects/new')}>+ Submit Your First Project</Button>
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Submission Status">
            <dl className="space-y-3">
              <div className="flex items-center justify-between rounded-md bg-surface-muted px-3 py-2.5">
                <dt className={labelCls}>Total Submitted</dt>
                <dd className="font-mono text-lg font-semibold text-ink tabular-nums">{stats.total}</dd>
              </div>
              <div className="flex items-center justify-between rounded-md bg-amber-light/50 px-3 py-2.5">
                <dt className={`${labelCls} text-amber-dark`}>Awaiting Decision</dt>
                <dd className="font-mono text-lg font-semibold text-amber-dark tabular-nums">
                  {(byStatus.SUBMITTED || 0) + (byStatus.IN_REVIEW || 0) + (byStatus.RESUBMITTED || 0)}
                </dd>
              </div>
              <div className="flex items-center justify-between rounded-md bg-sage-light/60 px-3 py-2.5">
                <dt className={`${labelCls} text-sage-dark`}>Approved</dt>
                <dd className="font-mono text-lg font-semibold text-sage-dark tabular-nums">{byStatus.APPROVED || 0}</dd>
              </div>
              <div className="flex items-center justify-between rounded-md bg-brick-light/50 px-3 py-2.5">
                <dt className={`${labelCls} text-brick`}>Rejected</dt>
                <dd className="font-mono text-lg font-semibold text-brick tabular-nums">{byStatus.REJECTED || 0}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Quick Actions">
            <div className="grid grid-cols-1 gap-2">
              <Button onClick={() => navigate('/projects/new')}>+ Submit New Project</Button>
              <Button variant="secondary" onClick={() => navigate('/notifications')}>View Notifications</Button>
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
 * SUPER REVIEWER DASHBOARD
 * Broader oversight — team performance, review queue
 * Similar to reviewer but sees more context
 * ═══════════════════════════════════════════════════════════════════════ */
function SuperReviewerDashboard({ stats, activity, projects, user, navigate }) {
  const byStatus = stats.byStatus || {}
  const workload = stats.workload || {}

  // Super reviewer sees all assigned projects (broader than regular reviewer)
  const allAssigned = projects.filter((p) => p.status === 'IN_REVIEW' || p.status === 'SUBMITTED' || p.status === 'RESUBMITTED')
  const mine = projects.filter((p) => p.reviewerName === user?.fullName)
  const mineActive = mine.filter((p) => ['IN_REVIEW', 'SUBMITTED', 'RESUBMITTED'].includes(p.status))

  const cards = [
    { label: 'All In Review', value: allAssigned.length, icon: FolderKanban, tone: 'navy', trend: null },
    { label: 'My Active Reviews', value: mineActive.length, icon: FileCheck2, tone: 'amber', trend: null },
    { label: 'Approved (All)', value: byStatus.APPROVED || 0, icon: UserCheck, tone: 'sage', trend: null },
    { label: 'Rejected (All)', value: byStatus.REJECTED || 0, icon: XCircle, tone: 'brick', trend: null },
  ]

  return (
    <>
      <StaggerContainer className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <StaggerItem key={c.label}>
            <StatCard {...c} />
          </StaggerItem>
        ))}
      </StaggerContainer>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* All in-review projects — super reviewer oversees the queue */}
          <Panel title="All Projects In Review">
            {allAssigned.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px] text-left text-sm">
                  <thead>
                    <tr className={`border-b border-line ${labelCls}`}>
                      <th className="pb-2.5 pr-3 font-medium">Project ID</th>
                      <th className="pb-2.5 pr-3 font-medium">Project</th>
                      <th className="pb-2.5 pr-3 font-medium">Reviewer</th>
                      <th className="pb-2.5 pr-3 text-right font-medium">Status</th>
                      <th className="pb-2.5 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAssigned.slice(0, 10).map((p) => (
                      <tr key={p.id} className="border-b border-ink/5 last:border-0 hover:bg-ink-50/50">
                        <td className="py-3 pr-3">
                          <Link to={`/projects/${p.id}`} className="font-mono text-xs font-medium text-ink-700 underline-offset-4 hover:text-accent hover:underline">
                            {p.docketNumber}
                          </Link>
                        </td>
                        <td className="py-3 pr-3">
                          <Link to={`/projects/${p.id}`} className="font-medium text-ink underline-offset-4 hover:text-accent hover:underline">
                            {p.title}
                          </Link>
                          <p className={labelCls}>{p.organizationName || '—'}</p>
                        </td>
                        <td className="py-3 pr-3 text-ink-700/90">{p.reviewerName || <span className="text-ink-700/45">Unassigned</span>}</td>
                        <td className="py-3 pr-3 text-right">
                          <div className="inline-block">
                            <RubberStamp status={p.status} size="sm" tilt={-3} />
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            to={`/projects/${p.id}`}
                            className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs font-semibold text-accent transition-colors hover:border-accent/40 hover:bg-accent-soft"
                          >
                            Review
                            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center">
                <Inbox className="mx-auto mb-3 h-10 w-10 text-ink-700/20" aria-hidden="true" />
                <p className="text-sm font-medium text-ink-700/50">No projects currently in review</p>
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Team Review Progress">
            <div className="flex items-center justify-center">
              <Donut percent={workload.progressPercent || 0} label="Completed" />
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-surface-muted px-2 py-2.5">
                <dt className={labelCls}>Assigned</dt>
                <dd className="font-mono text-lg font-semibold text-ink tabular-nums">{workload.assignedReviews ?? 0}</dd>
              </div>
              <div className="rounded-md bg-sage-light/60 px-2 py-2.5">
                <dt className={`${labelCls} text-sage-dark`}>Done</dt>
                <dd className="font-mono text-lg font-semibold text-sage-dark tabular-nums">{workload.completedReviews ?? 0}</dd>
              </div>
              <div className="rounded-md bg-amber-light/50 px-2 py-2.5">
                <dt className={`${labelCls} text-amber-dark`}>Left</dt>
                <dd className="font-mono text-lg font-semibold text-amber-dark tabular-nums">{workload.remainingReviews ?? 0}</dd>
              </div>
            </dl>
            <Button variant="secondary" className="mt-4 w-full" onClick={() => navigate('/reviews')}>
              View Queue <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Panel>

          <Panel title="Recent Activity">
            <ActivityFeed items={activity} limit={6} />
          </Panel>

          <Panel title="Quick Actions">
            <div className="grid grid-cols-1 gap-2">
              <Button variant="secondary" onClick={() => navigate('/reviews')}>Open Team Review Queue</Button>
              <Button variant="secondary" onClick={() => navigate('/reports')}>View Reports & Analytics</Button>
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
 * REUSABLE — Recent Projects Table (used by Admin and DM)
 * ═══════════════════════════════════════════════════════════════════════ */
function RecentProjectsTable({ projects }) {
  return (
    <Panel title="Recent Projects">
      {projects && projects.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className={`border-b border-line ${labelCls}`}>
                <th className="pb-2.5 pr-3 font-medium">Project ID</th>
                <th className="pb-2.5 pr-3 font-medium">Organization</th>
                <th className="pb-2.5 pr-3 font-medium">Reviewer</th>
                <th className="pb-2.5 pr-3 font-medium">Submitted</th>
                <th className="pb-2.5 pr-3 text-right font-medium">Status</th>
                <th className="pb-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-ink/5 last:border-0 hover:bg-ink-50/50">
                  <td className="py-3 pr-3">
                    <Link to={`/projects/${p.id}`} className="font-mono text-xs font-medium text-ink-700 underline-offset-4 hover:text-accent hover:underline">
                      {p.docketNumber}
                    </Link>
                  </td>
                  <td className="py-3 pr-3">
                    <Link to={`/projects/${p.id}`} className="font-medium text-ink underline-offset-4 hover:text-accent hover:underline">
                      {p.title}
                    </Link>
                    <p className={labelCls}>{p.organizationName || '—'}</p>
                  </td>
                  <td className="py-3 pr-3 text-ink-700/90">{p.reviewerName || <span className="text-ink-700/45">Unassigned</span>}</td>
                  <td className="py-3 pr-3 font-mono text-[11px] text-ink-700/75">
                    <span className="tabular-nums">{fmtDate(p.submittedAt || p.createdAt)}</span>{' '}
                    <span className="text-ink-700/45 tabular-nums">{fmtTime(p.submittedAt || p.createdAt)}</span>
                  </td>
                  <td className="py-3 pr-3 text-right">
                    <div className="inline-block">
                      <RubberStamp status={p.status} size="sm" tilt={-3} />
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      to={`/projects/${p.id}`}
                      className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs font-semibold text-accent transition-colors hover:border-accent/40 hover:bg-accent-soft"
                    >
                      Open
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={`py-10 text-center ${labelCls}`}>No dockets on file</p>
      )}
    </Panel>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
 * MAIN DASHBOARD — routes to role-specific component
 * ═══════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [projects, setProjects] = useState([])
  const [pendingUsers, setPendingUsers] = useState(0)
  const [allUsers, setAllUsers] = useState([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([api('/projects/stats'), api('/activity?limit=8')])
      setStats(s)
      setActivity(a || [])

      // Reviewers and super reviewers need the full project list for personal filtering
      if (user?.role === 'REVIEWER' || user?.role === 'SUPER_REVIEWER') {
        const list = await api('/projects')
        setProjects(list || [])
      }

      // Admin needs user list + pending count
      if (user?.role === 'ADMIN') {
        const [pending, users] = await Promise.all([
          api('/admin/users/pending'),
          api('/admin/users'),
        ])
        setPendingUsers(Array.isArray(pending) ? pending.length : 0)
        setAllUsers(Array.isArray(users) ? users : [])
      }
    } catch (err) {
      setError(err.message || 'Unable to load the ledger.')
    }
  }, [user?.role])

  useEffect(() => {
    load()
  }, [load])

  if (!stats) {
    return (
      <AppShell>
        {error && <Alert kind="error">{error}</Alert>}
        <DashboardSkeleton />
      </AppShell>
    )
  }

  const role = user?.role
  const firstName = user?.fullName?.split(' ')[0] || 'colleague'
  const subtitleFn = ROLE_SUBTITLES[role] || ROLE_SUBTITLES.ADMIN

  return (
    <AppShell>
      <PageHeader
        eyebrow="RWB Project Review System"
        title={ROLE_TITLES[role] || 'Dashboard'}
        subtitle={subtitleFn(firstName)}
        actions={
          role === 'EXTERNAL_USER' ? (
            <Button onClick={() => navigate('/projects/new')}>
              <span aria-hidden="true">+</span> New Project
            </Button>
          ) : undefined
        }
      />

      {error && (
        <div className="mb-6">
          <Alert kind="error">{error}</Alert>
        </div>
      )}

      {/* Route to role-specific dashboard */}
      {role === 'ADMIN' && (
        <AdminDashboard stats={stats} activity={activity} pendingUsers={pendingUsers} allUsers={allUsers} navigate={navigate} />
      )}

      {role === 'DIVISION_MANAGER' && (
        <DivisionManagerDashboard stats={stats} activity={activity} navigate={navigate} />
      )}

      {role === 'REVIEWER' && (
        <ReviewerDashboard projects={projects} user={user} navigate={navigate} />
      )}

      {role === 'EXTERNAL_USER' && (
        <ExternalUserDashboard stats={stats} projects={projects} navigate={navigate} />
      )}

      {role === 'SUPER_REVIEWER' && (
        <SuperReviewerDashboard stats={stats} activity={activity} projects={projects} user={user} navigate={navigate} />
      )}
    </AppShell>
  )
}
