import { timeAgo } from '../lib/format'
import { labelCls } from './ui'

const ACTION_TEXT = {
  PROJECT_SUBMIT: 'Project submitted',
  FIRST_PROJECT: 'First project received',
  PROJECT_RESUBMIT: 'Project resubmitted',
  ASSIGN_REVIEWER: 'Reviewer assigned',
  REVIEWER_RECOMMEND: 'Reviewer recommendation',
  PROJECT_APPROVE: 'Project approved',
  PROJECT_REJECT: 'Project returned',
  PROJECT_ARCHIVE: 'Project archived',
  ADMIN_APPROVE: 'Registration approved',
  ADMIN_REJECT: 'Registration declined',
  VERIFY_EMAIL: 'Email verified',
  REGISTER: 'Registration filed',
}

function dotFor(action) {
  if (action === 'PROJECT_APPROVE' || action === 'FIRST_PROJECT') return 'bg-sage'
  if (action === 'PROJECT_REJECT' || action === 'ADMIN_REJECT') return 'bg-brick'
  if (action === 'ASSIGN_REVIEWER') return 'bg-ink'
  return 'bg-amber'
}

export default function ActivityFeed({ items = [], limit = 8 }) {
  const list = items.slice(0, limit)
  if (list.length === 0) {
    return <p className={`py-4 text-center ${labelCls}`}>No activity recorded</p>
  }

  return (
    <ol className="relative space-y-0">
      {list.map((item, i) => {
        const title = ACTION_TEXT[item.action] || item.action.replaceAll('_', ' ').toLowerCase()
        return (
          <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
            {i < list.length - 1 && (
              <span className="absolute left-[5px] top-4 h-full w-px bg-line" aria-hidden="true" />
            )}
            <span
              className={`relative mt-1 h-[11px] w-[11px] shrink-0 rounded-full ring-2 ring-surface ${dotFor(item.action)}`}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-medium text-ink">{title}</p>
                <span className="shrink-0 font-mono text-[10px] text-ink-700/50 tabular-nums">
                  {timeAgo(item.createdAt)}
                </span>
              </div>
              <p className="truncate text-xs text-ink-700/70">{item.detail || item.actorEmail}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
