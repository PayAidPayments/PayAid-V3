import Link from 'next/link'
import { MODULES } from '@payaid/core'
import { createTenantWithModules } from './actions'

/** Phase 17: Signup – ?module=marketing → tenant_modules=['marketing']; no param → suite ['marketing','crm','finance',...]. */
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string }>
}) {
  const params = await searchParams
  const selectedModule = params.module && MODULES[params.module as keyof typeof MODULES] ? params.module : null
  const selectedModules = selectedModule ? [selectedModule] : (Object.keys(MODULES) as (keyof typeof MODULES)[])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur h-14 flex items-center justify-between px-4 max-w-7xl mx-auto w-full">
        <Link href="/" className="font-semibold text-slate-900 dark:text-white">PayAid V3 Suite</Link>
        <Link href="/login" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Log in</Link>
      </header>
      <main className="max-w-7xl mx-auto w-full px-4 py-10 flex-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Sign up</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          {selectedModule
            ? `Creating workspace with module: ${MODULES[selectedModule as keyof typeof MODULES].name}`
            : 'Creating workspace with all suite modules.'}
        </p>
        <form action={createTenantWithModules} className="space-y-4 max-w-md">
          <input type="hidden" name="selectedModules" value={JSON.stringify(selectedModules)} />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium"
          >
            Create workspace
          </button>
        </form>
        <p className="mt-6 text-sm text-slate-500">
          <Link href="/pricing" className="hover:underline">Change modules</Link>
        </p>
      </main>
    </div>
  )
}
