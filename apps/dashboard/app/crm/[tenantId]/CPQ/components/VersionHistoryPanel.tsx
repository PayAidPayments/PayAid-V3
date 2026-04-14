import { format } from 'date-fns'
import { Quote } from './types'

type VersionHistoryPanelProps = {
  quotes: Quote[]
}

export function VersionHistoryPanel({ quotes }: VersionHistoryPanelProps) {
  return (
    <div data-testid="cpq-version-history" className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2">
      {quotes.slice(0, 5).map((q) => (
        <div key={q.id} className="flex items-center justify-between text-xs">
          <span>{q.quoteNumber ?? q.id.slice(0, 8)}</span>
          <span className="text-slate-500">{q.status}</span>
          <span className="text-slate-400">{format(new Date(q.createdAt), 'dd MMM yyyy')}</span>
        </div>
      ))}
    </div>
  )
}
