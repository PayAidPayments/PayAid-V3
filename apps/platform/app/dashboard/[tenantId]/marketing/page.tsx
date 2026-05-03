import Link from 'next/link'
import { getTenantModules } from '@payaid/core'

/** Phase 17: Marketing module mount inside suite – ENRICHED KPIs when CRM active. */
export default async function DashboardMarketingPage({
  params,
}: {
  params: Promise<{ tenantId: string }>
}) {
  const { tenantId } = await params
  const modules = await getTenantModules(tenantId)
  const hasCrm = modules.includes('crm')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur h-14 flex items-center justify-between px-4 max-w-7xl mx-auto w-full">
        <Link href={`/dashboard/${tenantId}`} className="font-semibold text-slate-900 dark:text-white">PayAid V3 Suite</Link>
        <nav className="flex gap-4">
          <Link href={`/dashboard/${tenantId}`} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Dashboard</Link>
          {hasCrm && (
            <Link href={`/crm/${tenantId}`} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">View in CRM</Link>
          )}
        </nav>
      </header>
      <main className="max-w-7xl mx-auto w-full px-4 py-6 space-y-5">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Marketing</h1>
        {/* Band 1: ENRICHED when CRM active */}
        {hasCrm ? (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: 'Marketing Revenue (CRM-tracked)', value: '₹4.2L' },
              { label: 'Leads → Deals', value: '156 → 23 closed ₹1.7L' },
              { label: 'RoI (full attribution)', value: '4.8x' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm px-5 py-4 h-28 flex flex-col justify-center"
              >
                <p className="text-xs uppercase text-slate-500 dark:text-slate-400">{s.label}</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-white">{s.value}</p>
              </div>
            ))}
          </section>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {[
              { label: 'Campaigns', value: '247' },
              { label: 'Reach', value: '1.2M' },
              { label: 'Engagement', value: '12.4%' },
              { label: 'Leads', value: '156' },
              { label: 'RoI', value: '4.8x' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm px-5 py-4 h-28 flex flex-col justify-center"
              >
                <p className="text-xs uppercase text-slate-500 dark:text-slate-400">{s.label}</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-white">{s.value}</p>
              </div>
            ))}
          </section>
        )}
        {/* Band 2: Same as standalone + View in CRM when CRM active */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href={`/marketing/${tenantId}/studio`} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Studio</span>
          </Link>
          <Link href={`/marketing/${tenantId}/library`} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Library</span>
          </Link>
          <span className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Analytics</span>
          </span>
          <span className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Settings</span>
          </span>
        </section>
      </main>
    </div>
  )
}
