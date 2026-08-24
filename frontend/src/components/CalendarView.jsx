import { labelCls } from './ui'

/**
 * Current-month review calendar. Highlights days on which dockets were
 * received (real data from the ledger) and marks today.
 */
export default function CalendarView({ submissionDates = [] }) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const first = new Date(year, month, 1)
  const startPad = first.getDay() // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const received = new Set(
    submissionDates
      .filter(Boolean)
      .map((iso) => {
        const d = new Date(iso)
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      }),
  )

  const grid = []
  for (let i = 0; i < startPad; i++) grid.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    grid.push({
      day,
      isToday: day === now.getDate(),
      hasSubmission: received.has(`${year}-${month}-${day}`),
    })
  }
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(now)
  const today = now.getDate()

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-base font-semibold text-ink">{monthLabel}</p>
        <span className={labelCls}>Today: {today}</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className={`pb-1 ${labelCls}`}>
            {d}
          </span>
        ))}
        {grid.map((cell, i) =>
          cell === null ? (
            <span key={i} />
          ) : (
            <span
              key={i}
              className={`relative flex h-8 items-center justify-center rounded ${
                cell.isToday
                  ? 'bg-accent font-semibold text-white'
                  : cell.hasSubmission
                    ? 'bg-accent-soft font-semibold text-ink'
                    : 'text-ink-700/70 hover:bg-ink/5'
              }`}
            >
              {cell.day}
              {cell.hasSubmission && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-accent" aria-label="docket received" />
              )}
            </span>
          ),
        )}
      </div>
      <div className="mt-2 flex items-center gap-4">
        <span className={`inline-flex items-center gap-1.5 ${labelCls}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Docket received
        </span>
        <span className={`inline-flex items-center gap-1.5 ${labelCls}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Today
        </span>
      </div>
    </div>
  )
}
