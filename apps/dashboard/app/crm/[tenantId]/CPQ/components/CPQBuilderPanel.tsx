import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DraftLineItem } from './types'
import { MarginAnalysisCard } from './MarginAnalysisCard'
import { PricingBreakdownCard } from './PricingBreakdownCard'
import { PricingRuleSummaryCard } from './PricingRuleSummaryCard'
import { QuoteLineItemsTable } from './QuoteLineItemsTable'

type CPQBuilderPanelProps = {
  draftLineItems: DraftLineItem[]
  onQtyChange: (id: string, qty: number) => void
  pricing: {
    subtotal: number
    discount: number
    tax: number
    recurringTotal: number
    oneTimeTotal: number
    total: number
  }
  margin: {
    listPrice: number
    soldPrice: number
    discountPct: number
    marginPct: number
  }
  approvalRequired: boolean
  approvalReason: string
}

export function CPQBuilderPanel({
  draftLineItems,
  onQtyChange,
  pricing,
  margin,
  approvalRequired,
  approvalReason,
}: CPQBuilderPanelProps) {
  return (
    <section className="xl:col-span-5 space-y-4">
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Quote Builder</CardTitle>
          <CardDescription>Inline-edit quantity and see totals update instantly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <QuoteLineItemsTable draftLineItems={draftLineItems} onQtyChange={onQtyChange} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PricingBreakdownCard pricing={pricing} />
        <MarginAnalysisCard margin={margin} approvalRequired={approvalRequired} />
      </div>

      <PricingRuleSummaryCard approvalRequired={approvalRequired} approvalReason={approvalReason} />
    </section>
  )
}
