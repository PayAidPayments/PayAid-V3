import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  buildLoginHrefForMarketingSlug,
  buildRegisterHref,
  getModuleBySlug,
  getModuleMarketingSlugs,
} from '@/lib/moduleMarketing'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return getModuleMarketingSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const mod = getModuleBySlug(slug)
  if (!mod) return { title: 'Module | PayAid' }
  return {
    title: `${mod.name} | PayAid V3`,
    description: mod.description,
  }
}

export default async function ModuleLandingPage({ params }: Props) {
  const { slug } = await params
  const mod = getModuleBySlug(slug)
  if (!mod) notFound()

  const registerHref = buildRegisterHref(mod)
  const loginHref = buildLoginHrefForMarketingSlug(slug)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo href="/" />
          <div className="flex items-center gap-3 text-sm">
            <Link href="/modules" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
              All modules
            </Link>
            <Link href={loginHref} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#53328A]">PayAid suite or solution</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-50">{mod.name}</h1>
        <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">{mod.tagline}</p>
        <p className="mt-4 text-base text-slate-700 dark:text-slate-300 leading-relaxed">{mod.description}</p>

        <section className="mt-10 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
            What you get
          </h2>
          <ul className="mt-4 space-y-2 list-disc pl-5 text-sm text-slate-700 dark:text-slate-300">
            {mod.heroBenefits.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Get started</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            New here? Start a trial with this selection pre-configured. Already on PayAid? Sign in and we&apos;ll take you
            into the matching app (you must be licensed for it).
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button asChild className="bg-[#53328A] hover:bg-[#42206e]">
              <Link href={registerHref}>Sign up with this setup</Link>
            </Button>
            <Button variant="outline" asChild className="border-[#53328A] text-[#53328A] hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
              <Link href={loginHref}>Sign in to this setup</Link>
            </Button>
          </div>
        </section>

        <p className="mt-8 text-xs text-slate-500 dark:text-slate-400">
          After login you can open the full directory anytime from{' '}
          <strong className="text-slate-700 dark:text-slate-300">Home → All apps</strong> (<code className="text-[11px]">/home/your-tenant/apps</code>
          ).
        </p>
      </main>
    </div>
  )
}
