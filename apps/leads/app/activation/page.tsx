import { ActivationReviewClient } from './ActivationReviewClient'

export default function LeadActivationPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Activation</h1>
        <p className="text-sm text-slate-600">Approve and push selected records into CRM and campaigns with dedupe/suppression guardrails.</p>
        <ActivationReviewClient />
      </div>
    </main>
  )
}
