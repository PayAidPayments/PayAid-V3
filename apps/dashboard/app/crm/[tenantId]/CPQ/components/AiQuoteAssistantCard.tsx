import { CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type AiQuoteAssistantCardProps = {
  discountPct: number
}

export function AiQuoteAssistantCard({ discountPct }: AiQuoteAssistantCardProps) {
  return (
    <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800" data-testid="cpq-ai-assistant">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">AI Quote Assistant</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
        <p className="flex items-start gap-2"><Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" /> Suggested upsell: add onboarding sprint for faster go-live.</p>
        <p className="flex items-start gap-2"><ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" /> Discount risk: current quote is {discountPct.toFixed(1)}% below list.</p>
        <p className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Tax and pricing totals are internally consistent.</p>
      </CardContent>
    </Card>
  )
}
