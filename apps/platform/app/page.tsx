import Link from 'next/link'

/** Phase 17: PayAid V3 Suite landing (Zoho One equivalent). */
export default function PlatformLandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur h-14 flex items-center justify-between px-4 max-w-7xl mx-auto w-full">
        <span className="font-semibold text-slate-900 dark:text-white">PayAid V3 Suite</span>
        <nav className="flex gap-4">
          <Link href="/pricing" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Pricing</Link>
          <Link href="/signup" className="text-sm font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 px-3 py-1.5 rounded-lg">Sign up</Link>
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white text-center mb-4">
          PayAid V3 Suite
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-center max-w-lg mb-8">
          One platform. All modules. CRM, Finance, HR, Marketing – modular entitlements, Zoho-style.
        </p>
        <div className="flex gap-4">
          <Link href="/signup" className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium">
            Get started
          </Link>
          <Link href="/pricing" className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
            View pricing
          </Link>
        </div>
      </main>
    </div>
  )
}
