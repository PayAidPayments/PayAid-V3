import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatINR } from './utils'

type PricingBreakdownCardProps = {
  pricing: {
    subtotal: number
    discount: number
    tax: number
    recurringTotal: number
    oneTimeTotal: number
    total: number
  }
}

export function PricingBreakdownCard({ pricing }: PricingBreakdownCardProps) {
  return (
    <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800" data-testid="cpq-pricing-breakdown">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Pricing Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-1">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(pricing.subtotal)}</span></div>
        <div className="flex justify-between"><span>Discounts</span><span>-{formatINR(pricing.discount)}</span></div>
        <div className="flex justify-between"><span>Tax</span><span>{formatINR(pricing.tax)}</span></div>
        <div className="flex justify-between"><span>Recurring</span><span>{formatINR(pricing.recurringTotal)}</span></div>
        <div className="flex justify-between"><span>One-time</span><span>{formatINR(pricing.oneTimeTotal)}</span></div>
        <div className="flex justify-between font-semibold pt-1 border-t"><span>Grand Total</span><span>{formatINR(pricing.total)}</span></div>
      </CardContent>
    </Card>
  )
}
