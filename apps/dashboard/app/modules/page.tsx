import Link from 'next/link'
import { MODULE_MARKETING } from '@/lib/moduleMarketing'
import { Logo } from '@/components/brand/Logo'

export const metadata = {
  title: 'Modules | PayAid V3',
  description: 'Browse PayAid modules and start your trial with the right bundle.',
}

export default function ModulesIndexPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo href="/" />
          <div className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-slate-600 hover:text-slate-900">
              Login
            </Link>
            <Link
              href="/register"
              className="font-semibold text-[#53328A] hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">PayAid modules</h1>
        <p className="mt-3 text-slate-600 max-w-2xl">
          Pick a module to see what it does, then start with that bundle — your workspace and{' '}
          <code className="text-xs bg-slate-100 px-1 rounded">licensedModules</code> follow automatically.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULE_MARKETING.map((mod) => (
            <Link
              key={mod.slug}
              href={`/modules/${mod.slug}`}
              className="rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-[#53328A]/30 transition-all"
            >
              <h2 className="text-lg font-semibold text-slate-900">{mod.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{mod.tagline}</p>
              <p className="mt-4 text-xs font-medium text-[#53328A]">View module →</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
