import Link from 'next/link'
import {
  getIndustrySolutionMarketingModules,
  getPrimarySuiteMarketingModules,
  getStarterBundleMarketingModules,
} from '@/lib/moduleMarketing'
import { Logo } from '@/components/brand/Logo'

export const metadata = {
  title: 'Business OS Suites | PayAid V3',
  description: 'Browse PayAid suites, solutions, and bundles and start your trial with the right setup.',
}

export default function ModulesIndexPage() {
  const primarySuites = getPrimarySuiteMarketingModules()
  const industrySolutions = getIndustrySolutionMarketingModules()
  const starterBundles = getStarterBundleMarketingModules()

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
              href="/?onboarding=true#industry-selector"
              className="inline-flex items-center rounded-full bg-gradient-to-r from-[#53328A] to-[#6B4BA1] px-4 py-2 font-semibold text-white shadow-sm transition-opacity hover:opacity-95"
            >
              Choose Industry & Start
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">PayAid Business OS catalog</h1>
        <p className="mt-3 text-slate-600 max-w-2xl">
          Pick a suite, solution, or starter bundle to see what it does, then start your trial — your workspace and{' '}
          <code className="text-xs bg-slate-100 px-1 rounded">licensedModules</code> follow automatically.
        </p>
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">Core Business Suites</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {primarySuites.map((mod) => (
              <Link
                key={mod.slug}
                href={`/modules/${mod.slug}`}
                className="rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-[#53328A]/30 transition-all"
              >
                <h3 className="text-lg font-semibold text-slate-900">{mod.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{mod.tagline}</p>
                <p className="mt-4 text-xs font-medium text-[#53328A]">View details →</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold text-slate-900">Industry Solutions</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {industrySolutions.map((mod) => (
              <Link
                key={mod.slug}
                href={`/modules/${mod.slug}`}
                className="rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-[#53328A]/30 transition-all"
              >
                <h3 className="text-base font-semibold text-slate-900">{mod.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{mod.tagline}</p>
                <p className="mt-4 text-xs font-medium text-[#53328A]">View details →</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold text-slate-900">Recommended Starter Bundles</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {starterBundles.map((mod) => (
              <Link
                key={mod.slug}
                href={`/modules/${mod.slug}`}
                className="rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-[#53328A]/30 transition-all"
              >
                <h3 className="text-base font-semibold text-slate-900">{mod.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{mod.tagline}</p>
                <p className="mt-4 text-xs font-medium text-[#53328A]">View details →</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
