import Link from 'next/link'
import { getTenantModules } from '@payaid/core'
import { MODULES } from '@payaid/core'

/** Phase 17: Suite dashboard home – list tenant's modules and link to each. */
export default async function DashboardTenantPage({
  params,
}: {
  params: Promise<{ tenantId: string }>
}) {
  const { tenantId } = await params
  const modules = await getTenantModules(tenantId)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur h-14 flex items-center justify-between px-4 max-w-7xl mx-auto w-full">
        <Link href="/" className="font-semibold text-slate-900 dark:text-white">PayAid V3 Suite</Link>
      </header>
      <main className="max-w-7xl mx-auto w-full px-4 py-8">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">Your modules</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((moduleId) => {
            const m = MODULES[moduleId]
            if (!m) return null
            return (
              <Link
                key={moduleId}
                href={`/dashboard/${tenantId}/${moduleId}`}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:-translate-y-px transition"
              >
                <span className="font-semibold text-slate-900 dark:text-white">{m.name}</span>
              </Link>
            )
          })}
        </div>
        {modules.length === 0 && (
          <p className="text-slate-500 dark:text-slate-400">No modules enabled. <Link href="/pricing" className="underline">Add modules</Link>.</p>
        )}
      </main>
    </div>
  )
}
