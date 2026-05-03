import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DraftLineItem } from './types'
import { QuoteLineItemsTable } from './QuoteLineItemsTable'

type CPQBuilderPanelProps = {
  draftLineItems: DraftLineItem[]
  onQtyChange: (id: string, qty: number) => void
}

export function CPQBuilderPanel({ draftLineItems, onQtyChange }: CPQBuilderPanelProps) {
  return (
    <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Line items</CardTitle>
        <CardDescription>Edit quantities; pricing updates live in the inspector.</CardDescription>
      </CardHeader>
      <CardContent>
        <QuoteLineItemsTable draftLineItems={draftLineItems} onQtyChange={onQtyChange} />
      </CardContent>
    </Card>
  )
}
