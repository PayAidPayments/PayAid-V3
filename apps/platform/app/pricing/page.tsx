import Link from 'next/link'
import { MODULES } from '@payaid/core'

/** Phase 17: Module catalog + suite bundle. */
export default function PricingPage() {
  const entries = Object.entries(MODULES)
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur h-14 flex items-center justify-between px-4 max-w-7xl mx-auto w-full">
        <Link href="/" className="font-semibold text-slate-900 dark:text-white">PayAid V3 Suite</Link>
        <nav className="flex gap-4">
          <Link href="/signup" className="text-sm font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 px-3 py-1.5 rounded-lg">Sign up</Link>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto w-full px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Module catalog</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">Choose modules. Suite bundle available.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map(([id, m]) => (
            <div
              key={id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition"
            >
              <h2 className="font-semibold text-slate-900 dark:text-white">{m.name}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">₹{m.price}/mo</p>
              <Link
                href={`/signup?module=${id}`}
                className="mt-3 inline-block text-sm font-medium text-slate-900 dark:text-white hover:underline"
              >
                Add module →
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white">Suite bundle</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">All modules. Deploy self-hosted.</p>
          <Link href="/signup" className="mt-3 inline-block text-sm font-medium text-slate-900 dark:text-white hover:underline">
            Sign up for suite →
          </Link>
        </div>
      </main>
    </div>
  )
}
