import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type PricingRuleSummaryCardProps = {
  approvalRequired: boolean
  approvalReason: string
}

export function PricingRuleSummaryCard({ approvalRequired, approvalReason }: PricingRuleSummaryCardProps) {
  return (
    <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Pricing Rule Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
        {approvalRequired ? (
          <p className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            {approvalReason}. Approval must be completed before send.
          </p>
        ) : (
          <p className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            Discount and pricing rule checks are currently valid.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
