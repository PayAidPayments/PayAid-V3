import Link from 'next/link'

/** Phase 17: Redirect target when tenant lacks module – /upgrade?for=marketing */
export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ for?: string }>
}) {
  const params = await searchParams
  const forModule = params.for ?? 'module'

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm text-center">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Module not enabled</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Your workspace does not have access to <strong>{forModule}</strong>. Upgrade to add this module.
        </p>
        <Link href="/pricing" className="inline-block px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium">
          View pricing
        </Link>
      </div>
    </div>
  )
}
