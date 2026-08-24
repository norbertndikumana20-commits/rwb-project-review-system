/** Skeleton pulse block — reusable base */
function Pulse({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-ink/8 ${className}`}
      aria-hidden="true"
    />
  )
}

/** 4-column stat card skeleton */
export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-line bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <div className="flex items-start justify-between">
        <Pulse className="h-3 w-24" />
        <Pulse className="h-8 w-8 rounded-md" />
      </div>
      <Pulse className="mt-3 h-9 w-16" />
      <Pulse className="mt-2 h-3 w-20" />
    </div>
  )
}

/** Table skeleton — N rows */
export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Pulse key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Pulse key={c} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Chart skeleton — rectangular area */
export function ChartSkeleton() {
  return (
    <div className="flex items-end gap-2 px-4 pt-6 pb-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Pulse
          key={i}
          className="flex-1 rounded-t"
          style={{ height: `${20 + Math.random() * 60}%` }}
        />
      ))}
    </div>
  )
}

/** Panel skeleton — wraps a title + content area */
export function PanelSkeleton() {
  return (
    <div className="rounded-xl border border-line bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <Pulse className="mb-4 h-4 w-32" />
      <Pulse className="h-40 w-full rounded-lg" />
    </div>
  )
}

/** Full dashboard skeleton — grid of stat cards + panels */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <PanelSkeleton />
            <PanelSkeleton />
          </div>
          <PanelSkeleton />
        </div>
        <div className="space-y-6">
          <PanelSkeleton />
          <PanelSkeleton />
        </div>
      </div>
    </div>
  )
}
