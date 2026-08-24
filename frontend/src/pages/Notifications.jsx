import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Bell } from 'lucide-react'
import { api } from '../lib/api'
import AppShell from '../components/AppShell'
import { Alert, Card, labelCls } from '../components/ui'
import { PageHeader } from '../components/dashboard'
import { StaggerContainer, StaggerItem } from '../components/AnimatedPage'
import { timeAgo } from '../lib/format'

export default function Notifications() {
  const navigate = useNavigate()
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setItems(await api('/notifications?limit=50'))
    } catch (err) {
      setError(err.message || 'Unable to load notifications.')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function open(n) {
    if (!n.read) {
      try {
        await api(`/notifications/${n.id}/read`, { method: 'POST' })
      } catch {
        /* still navigate even if marking read fails */
      }
      load()
    }
    // Notifications about a docket open the project; message alerts have no
    // project link, so they just get marked read.
    if (n.projectId) navigate(`/projects/${n.projectId}`)
  }

  const unread = (items || []).filter((n) => !n.read).length

  return (
    <AppShell>
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        subtitle={`${unread} unread · decisions and assignments land here. Click any notification to open its project.`}
      />
      {error && <Alert kind="error">{error}</Alert>}

      <Card className="overflow-hidden">
        {items && items.length > 0 ? (
          <StaggerContainer className="divide-y divide-line">
            {items.map((n) => (
              <StaggerItem key={n.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => open(n)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      open(n)
                    }
                  }}
                  className={`group flex w-full cursor-pointer items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-ink-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:gap-4 sm:px-5 ${
                    n.read ? 'opacity-60' : ''
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                      n.read ? 'bg-surface-muted text-muted' : 'bg-amber-light/50 text-amber-dark'
                    }`}
                  >
                    <Bell className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{n.subject}</span>
                    {n.body && <span className="mt-0.5 block text-sm text-ink-700/75 line-clamp-2">{n.body}</span>}
                    <span className={`mt-1.5 block ${labelCls}`}>{timeAgo(n.createdAt)}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 self-start sm:gap-3 sm:self-center">
                    {n.projectId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          open(n)
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1.5 text-xs font-semibold text-accent transition-colors hover:border-accent/40 hover:bg-accent-soft sm:px-2.5"
                      >
                        <span className="hidden sm:inline">Open more details</span>
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                    <span className="hidden font-mono text-[10px] text-ink-700/50 tabular-nums sm:block">
                      {n.docketNumber ? n.docketNumber : ''}
                    </span>
                  </span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <p className={`py-14 text-center ${labelCls}`}>
            {items ? 'Inbox empty — no notifications yet' : 'Loading…'}
          </p>
        )}
      </Card>
    </AppShell>
  )
}
