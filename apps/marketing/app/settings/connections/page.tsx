import Link from 'next/link'

export default function SettingsConnectionsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur h-14 flex items-center justify-between px-4 max-w-7xl mx-auto w-full">
        <Link href="/" className="font-semibold text-slate-900 dark:text-white">PayAid Social</Link>
        <nav className="flex gap-4">
          <Link href="/studio" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Studio</Link>
          <Link href="/library" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Library</Link>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto w-full px-4 py-8">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Connections & API keys for PayAid Social.</p>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm max-w-2xl">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Connections</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Connect your CRM, storage, and channels. Configure in your PayAid dashboard when using the suite.</p>
        </div>
      </main>
    </div>
  )
}
