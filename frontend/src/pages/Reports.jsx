import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, FileBarChart2 } from 'lucide-react'
import { api } from '../lib/api'
import AppShell from '../components/AppShell'
import { Alert, Button, Card, labelCls } from '../components/ui'
import { PageHeader, Panel } from '../components/dashboard'
import AnimatedCounter from '../components/AnimatedCounter'

function downloadCsv(projects) {
  const header = ['Docket', 'Title', 'Category', 'Organization', 'Owner', 'Reviewer', 'Status', 'SubmittedAt']
  const rows = projects.map((p) => [
    p.docketNumber,
    `"${(p.title || '').replaceAll('"', '""')}"`,
    p.category || '',
    p.organizationName || '',
    p.ownerName || '',
    p.reviewerName || '',
    p.status,
    p.submittedAt || p.createdAt || '',
  ])
  const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rwb-ledger-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Reports() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setStats(await api('/projects/stats'))
    } catch (err) {
      setError(err.message || 'Unable to load report data.')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const byStatus = stats?.byStatus || {}
  const facts = stats
    ? [
        { label: 'Total dockets', value: stats.total },
        { label: 'Awaiting review', value: stats.pendingReviews },
        { label: 'Approved', value: byStatus.APPROVED || 0 },
        { label: 'Returned', value: byStatus.REJECTED || 0 },
        { label: 'Resubmitted', value: byStatus.RESUBMITTED || 0 },
        { label: 'Archived', value: byStatus.ARCHIVED || 0 },
      ]
    : []

  return (
    <AppShell>
      <PageHeader
        eyebrow="Reporting"
        title="Reports"
        subtitle="Ledger summaries and export. Scheduled reports and PDF rendering are on the roadmap."
      />
      {error && <Alert kind="error">{error}</Alert>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Ledger snapshot">
          {stats ? (
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {facts.map((f) => (
                <div key={f.label} className="rounded-md bg-surface-muted px-4 py-3">
                  <dt className={labelCls}>{f.label}</dt>
                  <dd className="mt-1 font-mono text-2xl font-semibold text-ink tabular-nums"><AnimatedCounter value={f.value} /></dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className={`py-10 text-center ${labelCls}`}>Loading…</p>
          )}
        </Panel>

        <Panel title="Export">
          <div className="flex h-full flex-col items-start justify-center gap-4">
            <p className="text-sm leading-relaxed text-ink-700/80">
              Download the full ledger as a comma-separated file for use in external systems and
              archival records. Timestamps are in UTC.
            </p>
            <Button
              onClick={async () => {
                const projects = await api('/projects')
                downloadCsv(projects || [])
              }}
              disabled={!stats}
            >
              <Download className="h-4 w-4" aria-hidden="true" /> Download ledger CSV
            </Button>
            <p className={`flex items-center gap-2 ${labelCls}`}>
              <FileBarChart2 className="h-3.5 w-3.5" aria-hidden="true" /> PDF reports — scheduled
            </p>
          </div>
        </Panel>
      </div>
    </AppShell>
  )
}
