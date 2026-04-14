import { format } from 'date-fns'
import { Clock3, FileText, RefreshCw, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { STATUS_COLOR } from './constants'
import { Quote } from './types'

type CPQHeaderProps = {
  selectedQuote: Quote | null
  onRefresh: () => void
}

export function CPQHeader({ selectedQuote, onRefresh }: CPQHeaderProps) {
  return (
    <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800" data-testid="cpq-header">
      <CardContent className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {selectedQuote?.deal?.name ?? 'Configure-Price-Quote Workspace'}
            </h1>
            <Badge className={STATUS_COLOR[selectedQuote?.status ?? 'draft'] ?? STATUS_COLOR.draft}>
              {(selectedQuote?.status ?? 'draft').replace('_', ' ')}
            </Badge>
            {selectedQuote?.quoteNumber ? <Badge variant="outline">#{selectedQuote.quoteNumber}</Badge> : null}
          </div>
          <div className="text-xs text-slate-500 flex flex-wrap gap-3">
            <span>Customer: {selectedQuote?.contact?.name ?? 'N/A'}</span>
            <span>Deal stage: {selectedQuote?.deal?.stage ?? 'proposal'}</span>
            <span>Valid until: {selectedQuote?.validUntil ? format(new Date(selectedQuote.validUntil), 'dd MMM yyyy') : 'Not set'}</span>
            <span>Owner: Revenue Team</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-1" /> Save
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-1" /> Preview
          </Button>
          <Button variant="outline" size="sm" disabled={!selectedQuote}>
            <Clock3 className="w-4 h-4 mr-1" /> Request Approval
          </Button>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700" disabled={!selectedQuote}>
            <Send className="w-4 h-4 mr-1" /> Send Quote
          </Button>
          <Button variant="outline" size="sm">More</Button>
        </div>
      </CardContent>
    </Card>
  )
}
