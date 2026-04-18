import { CheckCircle2, Circle } from 'lucide-react'

type FlowChecks = {
  context: boolean
  configure: boolean
  pricing: boolean
  approval: boolean
  send: boolean
}

const STEPS: Array<{ key: keyof FlowChecks; label: string; hint: string }> = [
  { key: 'context', label: 'Quote context', hint: 'Deal, customer, owner' },
  { key: 'configure', label: 'Configure', hint: 'Catalog & line items' },
  { key: 'pricing', label: 'Price', hint: 'Totals & rules' },
  { key: 'approval', label: 'Approve', hint: 'Only when triggered' },
  { key: 'send', label: 'Send', hint: 'Customer-ready output' },
]

type CPQFlowStepperProps = {
  healthChecks: FlowChecks
  healthScore: number
}

export function CPQFlowStepper({ healthChecks, healthScore }: CPQFlowStepperProps) {
  return (
    <div
      className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-4 py-3 backdrop-blur-sm"
      data-testid="cpq-flow-stepper"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Quote flow</p>
        <p className="text-xs text-slate-500">
          {healthScore}/5 complete
          {healthChecks.send ? ' · Ready to send' : ' · Follow the steps left to right'}
        </p>
      </div>
      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {STEPS.map((step) => {
          const done = healthChecks[step.key]
          return (
            <li
              key={step.key}
              className="flex items-start gap-2 rounded-xl border border-slate-200/90 dark:border-slate-700/90 bg-slate-50/80 dark:bg-slate-950/40 px-3 py-2.5"
            >
              {done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
              ) : (
                <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" aria-hidden />
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{step.label}</p>
                <p className="text-[11px] text-slate-500 leading-snug">{step.hint}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
