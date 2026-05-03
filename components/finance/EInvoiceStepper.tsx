'use client'

interface EInvoiceStepperProps {
  irnGenerated: boolean
  qrReady: boolean
}

export function EInvoiceStepper({ irnGenerated, qrReady }: EInvoiceStepperProps) {
  const steps = [
    { label: 'Generate IRN', done: irnGenerated },
    { label: 'Download QR', done: qrReady },
    { label: 'Send', done: irnGenerated && qrReady },
  ]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">E-Invoicing</p>
      <div className="mt-2 flex items-center gap-2">
        {steps.map((step) => (
          <div key={step.label} className={`px-2 py-1 rounded-md text-xs ${step.done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            {step.label}
          </div>
        ))}
      </div>
    </div>
  )
}
