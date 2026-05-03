import { Card, CardContent } from '@/components/ui/card'
import { Quote } from './types'
import { formatINR } from './utils'

type QuoteSelectorPanelProps = {
  quotes: Quote[]
  selectedQuoteId?: string
  onSelectQuote: (quoteId: string) => void
}

export function QuoteSelectorPanel({ quotes, selectedQuoteId, onSelectQuote }: QuoteSelectorPanelProps) {
  return (
    <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-2 p-4">
        {quotes.map((q) => (
          <button
            key={q.id}
            type="button"
            className={`text-left rounded-xl border px-3 py-2 transition ${selectedQuoteId === q.id ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
            onClick={() => onSelectQuote(q.id)}
          >
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{q.deal?.name ?? 'Quote'}</p>
            <p className="text-xs text-slate-500">{q.quoteNumber ?? q.id.slice(0, 8)} - {formatINR(q.total)}</p>
          </button>
        ))}
      </CardContent>
    </Card>
  )
}
