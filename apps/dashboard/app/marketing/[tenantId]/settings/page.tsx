import Link from 'next/link'
import { MarketingSettingsForm } from '@/components/marketing/MarketingSettingsForm'

export default async function MarketingSettingsPage({
  params,
}: {
  params: Promise<{ tenantId: string }>
}) {
  const { tenantId } = await params
  return (
    <div className="max-w-7xl mx-auto w-full space-y-6 pb-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Marketing settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Budgets, quiet hours, and channel caps. Connect accounts under Channels.
        </p>
      </header>

      <MarketingSettingsForm />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Sender profiles</h2>
          <p className="text-xs text-slate-500 mt-1">Managed alongside channel connections.</p>
          <Link
            href={`/marketing/${tenantId}/channels`}
            className="mt-3 inline-block text-sm font-medium text-violet-600 hover:underline"
          >
            Open Channels →
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Tracking & domains</h2>
          <p className="text-xs text-slate-500 mt-1">UTM defaults and link branding (TODO).</p>
          <button
            type="button"
            className="mt-3 text-sm font-medium text-slate-400 cursor-not-allowed"
            disabled
          >
            Configure (soon)
          </button>
        </div>
      </div>
    </div>
  )
}
