import { CheckCircle2, Clock3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

type CPQProgressStripProps = {
  healthChecks: {
    context: boolean
    configure: boolean
    pricing: boolean
    approval: boolean
    send: boolean
  }
}

export function CPQProgressStrip({ healthChecks }: CPQProgressStripProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      {[
        ['Context', healthChecks.context],
        ['Configure', healthChecks.configure],
        ['Pricing', healthChecks.pricing],
        ['Approval', healthChecks.approval],
        ['Send', healthChecks.send],
      ].map(([label, done]) => (
        <Card key={String(label)} className="rounded-2xl border-slate-200/80 dark:border-slate-800">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
            {done ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock3 className="w-4 h-4 text-amber-600" />}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
