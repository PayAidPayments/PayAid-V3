import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Quote } from './types'
import { formatINR } from './utils'

type CustomerDealContextCardProps = {
  selectedQuote: Quote | null
}

export function CustomerDealContextCard({ selectedQuote }: CustomerDealContextCardProps) {
  return (
    <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Customer & Deal Context</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p><span className="text-slate-500">Company/Contact:</span> {selectedQuote?.contact?.name ?? 'N/A'}</p>
        <p><span className="text-slate-500">Email:</span> {selectedQuote?.contact?.email ?? 'N/A'}</p>
        <p><span className="text-slate-500">Deal:</span> {selectedQuote?.deal?.name ?? 'N/A'}</p>
        <p><span className="text-slate-500">Deal Value:</span> {formatINR(selectedQuote?.deal?.value ?? selectedQuote?.total ?? 0)}</p>
        <p><span className="text-slate-500">Stage:</span> {selectedQuote?.deal?.stage ?? 'proposal'}</p>
      </CardContent>
    </Card>
  )
}
