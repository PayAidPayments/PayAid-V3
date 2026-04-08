import Link from 'next/link'

export default function LibraryPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur h-14 flex items-center justify-between px-4 max-w-7xl mx-auto w-full">
        <Link href="/" className="font-semibold text-slate-900 dark:text-white">PayAid Social</Link>
        <nav className="flex gap-4">
          <Link href="/studio" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Studio</Link>
          <Link href="/dashboard" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Dashboard</Link>
          <Link href="/settings/connections" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Settings</Link>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto w-full px-4 py-6">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Media Library</h1>
        <p className="text-slate-600 dark:text-slate-400">Images, videos, and templates. Connect to your app&apos;s media API for live data.</p>
      </main>
    </div>
  )
}
