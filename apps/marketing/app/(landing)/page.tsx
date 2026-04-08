import Link from 'next/link'
import { MODULES } from '@payaid/core'

const marketing = MODULES.marketing

export default function MarketingLandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur h-14 flex items-center justify-between px-4 max-w-7xl mx-auto w-full">
        <span className="font-semibold text-slate-900 dark:text-white">{marketing.name}</span>
        <nav className="flex gap-4">
          <Link href="/login" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
            Log in
          </Link>
          <Link href="/signup?module=marketing" className="text-sm font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 px-3 py-1.5 rounded-lg">
            Start Free Trial
          </Link>
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white text-center mb-4">
          PayAid Social – AI Marketing Studio
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-center max-w-lg mb-6">
          One flow. All channels. Local metrics first; enriched revenue when CRM is active.
        </p>
        <p className="text-slate-500 dark:text-slate-500 text-center mb-8">
          ₹{marketing.price}/mo · Free trial
        </p>
        <div className="flex gap-4">
          <Link
            href="/signup?module=marketing"
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium"
          >
            Start Free Trial
          </Link>
          <Link
            href="/studio"
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
          >
            Open Studio
          </Link>
        </div>
      </main>
    </div>
  )
}
