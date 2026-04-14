import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

type QuoteHealthBannerProps = {
  healthScore: number
  healthChecks: {
    context: boolean
    configure: boolean
    pricing: boolean
    approval: boolean
    send: boolean
  }
}

export function QuoteHealthBanner({ healthScore, healthChecks }: QuoteHealthBannerProps) {
  return (
    <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800" data-testid="cpq-health-banner">
      <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Quote Health Indicator</p>
          <p className="text-xs text-slate-500">
            {healthScore}/5 checks complete - {healthChecks.send ? 'ready to send' : 'needs final action before sending'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <Badge variant={healthChecks.context ? 'default' : 'outline'}>Context</Badge>
          <Badge variant={healthChecks.configure ? 'default' : 'outline'}>Configure</Badge>
          <Badge variant={healthChecks.pricing ? 'default' : 'outline'}>Pricing</Badge>
          <Badge variant={healthChecks.approval ? 'default' : 'outline'}>Approval</Badge>
          <Badge variant={healthChecks.send ? 'default' : 'outline'}>Send</Badge>
        </div>
      </CardContent>
    </Card>
  )
}
