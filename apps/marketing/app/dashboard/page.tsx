import Link from 'next/link'

/** Phase 17: Standalone marketing dashboard – LOCAL metrics only (enriched when mounted in suite with CRM). */
export default function MarketingDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur h-14 flex items-center justify-between px-4 max-w-7xl mx-auto w-full">
        <Link href="/" className="font-semibold text-slate-900 dark:text-white">PayAid Social</Link>
        <nav className="flex gap-4">
          <Link href="/studio" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Studio</Link>
          <Link href="/library" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Library</Link>
          <Link href="/settings/connections" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Settings</Link>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto w-full px-4 py-6 space-y-5">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Dashboard</h1>
        {/* Band 1: LOCAL KPIs */}
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
        {/* Band 2: Studio | Library | Analytics | Settings */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: '/studio', label: 'Studio' },
            { href: '/library', label: 'Library' },
            { href: '#', label: 'Analytics' },
            { href: '/settings/connections', label: 'Settings' },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:-translate-y-px transition"
            >
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{l.label}</span>
            </Link>
          ))}
        </section>
        {/* Band 3: Charts placeholder – from MarketingPost/Campaign only */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Campaigns over time</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Charts from MarketingPost / Campaign data.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Engagement by channel</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Local metrics only.</p>
          </div>
        </section>
      </main>
    </div>
  )
}
