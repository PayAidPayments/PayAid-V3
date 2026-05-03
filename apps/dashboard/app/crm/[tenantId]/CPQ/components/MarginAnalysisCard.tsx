import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatINR } from './utils'

type MarginAnalysisCardProps = {
  margin: {
    listPrice: number
    soldPrice: number
    discountPct: number
    marginPct: number
  }
  approvalRequired: boolean
}

export function MarginAnalysisCard({ margin, approvalRequired }: MarginAnalysisCardProps) {
  return (
    <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800" data-testid="cpq-margin-analysis">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Margin Analysis</CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-1">
        <div className="flex justify-between"><span>List Price</span><span>{formatINR(margin.listPrice)}</span></div>
        <div className="flex justify-between"><span>Sold Price</span><span>{formatINR(margin.soldPrice)}</span></div>
        <div className="flex justify-between"><span>Discount %</span><span>{margin.discountPct.toFixed(1)}%</span></div>
        <div className="flex justify-between"><span>Margin %</span><span>{margin.marginPct.toFixed(1)}%</span></div>
        <div className="pt-2">
          <Badge className={approvalRequired ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}>
            {approvalRequired ? 'Approval threshold triggered' : 'Within policy range'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
