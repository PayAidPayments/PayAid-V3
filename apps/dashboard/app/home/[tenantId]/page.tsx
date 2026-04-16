'use client'

import { Header } from '../components/Header'
import { HeroSection } from '../components/HeroSection'
import { PinnedModules } from '../components/PinnedModules'
import { TodayAISummary } from '../components/TodayAISummary'
import { ModuleGrid } from '../components/ModuleGrid'
import { NewsSidebar } from '@/components/news/NewsSidebar'
import Link from 'next/link'
import { useCallback, useEffect, useLayoutEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { useParams, useRouter } from 'next/navigation'
import { PAYAID_MODULES } from '@/lib/config/payaid-modules.config'

interface HomeSummaryKPIs {
  openDeals: number
  openDealsValue: number
  contacts: number
  activeEmployees: number
  pendingInvoices: number
  pendingInvoicesTotal: number
  overdueInvoices: number
  overdueTasks: number
  products: number
}

interface HomeSummary {
  kpis: HomeSummaryKPIs
  moduleSummaries?: Record<string, string>
  degraded?: boolean
}

function getAuthFromStorage() {
  let token: string | null = null;
  let tenant: { id?: string } | null = null;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('auth-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        token = parsed.state?.token ?? null;
        tenant = parsed.state?.tenant ?? null;
      }
    } catch {
      // ignore
    }
  }
  return { token, tenant };
}

function buildBriefingFallback(kpis: HomeSummaryKPIs): string[] {
  const bullets: string[] = []
  if (kpis.openDeals > 0) {
    const lakhs = (kpis.openDealsValue / 1_00_000).toFixed(1)
    bullets.push(`${kpis.openDeals} open deal${kpis.openDeals === 1 ? '' : 's'} in the pipeline (₹${lakhs} L).`)
  }
  if (kpis.pendingInvoices > 0 || kpis.overdueInvoices > 0) {
    const lakhs = (kpis.pendingInvoicesTotal / 1_00_000).toFixed(1)
    bullets.push(`Invoices: ${kpis.pendingInvoices} pending (₹${lakhs} L)${kpis.overdueInvoices > 0 ? `, ${kpis.overdueInvoices} overdue.` : '.'}`)
  }
  if (kpis.overdueTasks > 0) {
    bullets.push(`${kpis.overdueTasks} task${kpis.overdueTasks === 1 ? '' : 's'} not yet completed.`)
  }
  if (bullets.length === 0) {
    bullets.push('No urgent items. Add deals, invoices, or tasks in CRM, Finance, or Projects to see your daily briefing here.')
  }
  return bullets.slice(0, 4)
}

export default function TenantHomePage() {
  const [mounted, setMounted] = useState(false)
  const [summary, setSummary] = useState<HomeSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [summaryError, setSummaryError] = useState(false)
  const [briefingBullets, setBriefingBullets] = useState<string[]>([])
  const [briefingLoading, setBriefingLoading] = useState(true)
  const params = useParams()
  const router = useRouter()
  const { tenant, token } = useAuthStore()
  const tenantId = params.tenantId as string
  const didRedirect = useRef(false)

  // Start with hasCheckedAuth true when storage already has matching auth (e.g. right after login)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(() => {
    if (typeof window === 'undefined') return false
    const { token: t, tenant: tn } = getAuthFromStorage()
    return !!(tenantId && t && tn?.id && tn.id === tenantId)
  })

  useEffect(() => {
    const id = globalThis.setTimeout(() => setMounted(true), 0)
    return () => globalThis.clearTimeout(id)
  }, [])

  // Auth check: useLayoutEffect so it runs before paint when possible
  useLayoutEffect(() => {
    if (!tenantId) return

    const pendingAuthTimeouts: ReturnType<typeof globalThis.setTimeout>[] = []
    const deferHasCheckedAuth = () => {
      pendingAuthTimeouts.push(globalThis.setTimeout(() => setHasCheckedAuth(true), 0))
    }

    const runAuthCheck = (isRetry = false) => {
      const { token: tokenFromStorage, tenant: tenantFromStorage } = getAuthFromStorage()
      const currentState = useAuthStore.getState()
      const finalIsAuthenticated = currentState.isAuthenticated || !!tokenFromStorage
      const finalTenant = currentState.tenant ?? tenantFromStorage

      if (finalIsAuthenticated && finalTenant?.id && tenantId !== finalTenant.id) {
        if (!didRedirect.current) {
          didRedirect.current = true
          router.replace(`/home/${finalTenant.id}`)
        }
        return
      }
      if (finalIsAuthenticated && finalTenant?.id && !tenantId) {
        if (!didRedirect.current) {
          didRedirect.current = true
          router.replace(`/home/${finalTenant.id}`)
        }
        return
      }
      if (finalIsAuthenticated && finalTenant?.id && tenantId === finalTenant.id) {
        deferHasCheckedAuth()
        return
      }
      if (!finalIsAuthenticated && !tokenFromStorage) {
        if (!isRetry) {
          setTimeout(() => runAuthCheck(true), 400)
          return
        }
        if (!didRedirect.current) {
          didRedirect.current = true
          router.replace('/login')
        }
        return
      }
      deferHasCheckedAuth()
    }

    runAuthCheck()
    return () => {
      for (const id of pendingAuthTimeouts) globalThis.clearTimeout(id)
    }
  }, [tenantId, router])

  // Fallback: if URL has tenantId and we have matching auth in storage, show page after a short delay
  useEffect(() => {
    if (!tenantId || hasCheckedAuth) return
    const t = setTimeout(() => {
      const { tenant: tenantFromStorage } = getAuthFromStorage()
      const storedId = tenantFromStorage?.id ?? useAuthStore.getState().tenant?.id
      if (storedId === tenantId) {
        setHasCheckedAuth(true)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [tenantId, hasCheckedAuth])

  // Use tenant id from auth (store or storage) so we always request the logged-in tenant's data
  const authTenantId =
    tenant?.id ??
    (typeof window !== 'undefined' ? getAuthFromStorage().tenant?.id : null) ??
    tenantId

  const fetchSummary = useCallback(() => {
    const authToken = useAuthStore.getState().token ?? (typeof window !== 'undefined' ? getAuthFromStorage().token : null)
    if (!authTenantId || !authToken) {
      setSummaryLoading(false)
      return
    }
    setSummaryLoading(true)
    setSummaryError(false)
    fetch(`/api/home/summary?tenantId=${encodeURIComponent(authTenantId)}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => {
        if (!res.ok) {
          setSummaryError(true)
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (data?.kpis) setSummary({ kpis: data.kpis, moduleSummaries: data.moduleSummaries, degraded: data.degraded })
      })
      .catch(() => setSummaryError(true))
      .finally(() => setSummaryLoading(false))
  }, [authTenantId])

  useEffect(() => {
    if (!hasCheckedAuth) return
    const id = globalThis.setTimeout(() => {
      fetchSummary()
    }, 0)
    return () => globalThis.clearTimeout(id)
  }, [hasCheckedAuth, fetchSummary])

  // Retry summary when token/tenant appear after rehydration (e.g. auth storage just loaded)
  useEffect(() => {
    if (!hasCheckedAuth || summary != null || summaryLoading) return
    const t = setTimeout(() => {
      const { token: t2, tenant: tn } = getAuthFromStorage()
      if (t2 && tn?.id && (tenantId === tn.id || tenantId === tenant?.id)) {
        fetchSummary()
      }
    }, 600)
    return () => clearTimeout(t)
  }, [hasCheckedAuth, summary, summaryLoading, tenantId, tenant?.id, fetchSummary])

  useEffect(() => {
    const id = globalThis.setTimeout(() => {
      if (!authTenantId || !hasCheckedAuth) {
        setBriefingLoading(false)
        return
      }
      const authToken = useAuthStore.getState().token ?? (typeof window !== 'undefined' ? getAuthFromStorage().token : null)
      if (!authToken) {
        setBriefingLoading(false)
        return
      }
      setBriefingLoading(true)
      fetch(`/api/home/briefing?tenantId=${encodeURIComponent(authTenantId)}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.bullets && Array.isArray(data.bullets)) setBriefingBullets(data.bullets)
        })
        .catch(() => {})
        .finally(() => setBriefingLoading(false))
    }, 0)
    return () => globalThis.clearTimeout(id)
  }, [authTenantId, hasCheckedAuth])

  if (!mounted || !hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 transition-colors">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <HeroSection
          businessName={tenant?.name || 'Demo Business Pvt Ltd'}
          userName={undefined}
        />

        {/* Hero row: 3 fixed metric cards (show loading, then 0 or values; never blank) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link
            href={`/crm/${tenantId}/Deals`}
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm px-5 py-4 hover:shadow-md hover:-translate-y-px transition-all duration-150 h-28 flex flex-col justify-center"
          >
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Today&apos;s overview</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {summaryLoading ? (
                <span className="text-slate-400 dark:text-slate-500">Loading…</span>
              ) : summaryError ? (
                <span className="text-amber-600 dark:text-amber-400 text-base">Unable to load</span>
              ) : summary?.kpis != null ? (
                `${summary.kpis.overdueTasks} tasks · ${summary.kpis.overdueInvoices} overdue`
              ) : (
                '0 tasks · 0 overdue'
              )}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {summaryLoading || summaryError ? '' : summary?.kpis != null ? `${summary.kpis.openDeals} deals closing` : '0 deals closing'}
            </p>
          </Link>
          <Link
            href={`/finance/${tenantId}/Invoices`}
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm px-5 py-4 hover:shadow-md hover:-translate-y-px transition-all duration-150 h-28 flex flex-col justify-center"
          >
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">This month</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {summaryLoading ? (
                <span className="text-slate-400 dark:text-slate-500">Loading…</span>
              ) : summaryError ? (
                <span className="text-amber-600 dark:text-amber-400 text-base">Unable to load</span>
              ) : summary?.kpis != null ? (
                `₹${(summary.kpis.pendingInvoicesTotal / 1_00_000).toFixed(1)} L`
              ) : (
                '₹0 L'
              )}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Receivables</p>
          </Link>
          <Link
            href={`/hr/${tenantId}/Employees`}
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm px-5 py-4 hover:shadow-md hover:-translate-y-px transition-all duration-150 h-28 flex flex-col justify-center"
          >
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Team activity</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {summaryLoading ? (
                <span className="text-slate-400 dark:text-slate-500">Loading…</span>
              ) : summaryError ? (
                <span className="text-amber-600 dark:text-amber-400 text-base">Unable to load</span>
              ) : summary?.kpis != null ? (
                summary.kpis.activeEmployees
              ) : (
                '0'
              )}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Active employees</p>
          </Link>
        </section>
        {summaryError && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
            Couldn&apos;t load metrics.{' '}
            <button type="button" onClick={() => fetchSummary()} className="underline font-medium hover:no-underline">
              Retry
            </button>
          </p>
        )}
        {summary?.degraded && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
            Metrics temporarily unavailable.{' '}
            <button type="button" onClick={() => fetchSummary()} className="underline font-medium hover:no-underline">
              Retry
            </button>
          </p>
        )}
        {!summaryLoading && !summaryError && summary?.kpis && !summary.degraded &&
          summary.kpis.openDeals === 0 &&
          summary.kpis.pendingInvoices === 0 &&
          summary.kpis.activeEmployees === 0 &&
          summary.kpis.overdueTasks === 0 && (
          <div className="rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-5 py-4 mb-6">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              No activity yet. Add your first{' '}
              <Link href={`/crm/${tenantId}/Deals`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">deal</Link>
              ,{' '}
              <Link href={`/finance/${tenantId}/Invoices`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">invoice</Link>
              , or{' '}
              <Link href={`/hr/${tenantId}/Employees`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">employee</Link>
              {' '}to see your overview here.
            </p>
          </div>
        )}

        {/* AI Briefing: full-width, directly under hero cards; fallback to rule-based from KPIs when API fails */}
        <section className="mb-8">
          <TodayAISummary
            tenantId={tenantId}
            bullets={
              briefingBullets.length > 0
                ? briefingBullets
                : !briefingLoading && summary?.kpis
                  ? buildBriefingFallback(summary.kpis)
                  : []
            }
            loading={briefingLoading}
          />
        </section>

        {/* Pinned & Recent: full width */}
        <PinnedModules
          tenantId={tenantId}
          moduleSummaries={summary?.moduleSummaries}
          availableModuleIds={PAYAID_MODULES.filter((m) => m.id !== 'home').map((m) => m.id)}
        />

        {/* At a glance: compact KPI strip (when we have data; hide when loading or error) */}
        {!summaryLoading && !summaryError && summary?.kpis && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              At a glance
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link href={`/crm/${tenantId}/Deals`} className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm px-4 py-3 hover:shadow-md hover:-translate-y-px transition-all duration-150">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Open Deals</span>
                <span className="ml-2 text-lg font-semibold text-slate-900 dark:text-slate-50">{summary.kpis.openDeals}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">· ₹{(summary.kpis.openDealsValue / 1_00_000).toFixed(1)} L</span>
              </Link>
              <Link href={`/crm/${tenantId}/Contacts`} className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm px-4 py-3 hover:shadow-md hover:-translate-y-px transition-all duration-150">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Contacts</span>
                <span className="ml-2 text-lg font-semibold text-slate-900 dark:text-slate-50">{summary.kpis.contacts}</span>
              </Link>
              <Link href={`/finance/${tenantId}/Invoices`} className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm px-4 py-3 hover:shadow-md hover:-translate-y-px transition-all duration-150">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Pending Invoices</span>
                <span className="ml-2 text-lg font-semibold text-slate-900 dark:text-slate-50">{summary.kpis.pendingInvoices}</span>
                {summary.kpis.overdueInvoices > 0 && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 ml-1">· {summary.kpis.overdueInvoices} overdue</span>
                )}
              </Link>
              <Link href={`/hr/${tenantId}/Employees`} className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm px-4 py-3 hover:shadow-md hover:-translate-y-px transition-all duration-150">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Employees</span>
                <span className="ml-2 text-lg font-semibold text-slate-900 dark:text-slate-50">{summary.kpis.activeEmployees}</span>
              </Link>
              <Link href={`/approvals/${tenantId}`} className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm px-4 py-3 hover:shadow-md hover:-translate-y-px transition-all duration-150">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Approvals</span>
                <span className="ml-2 text-sm font-semibold text-slate-900 dark:text-slate-50">Expense · Leave · PO</span>
              </Link>
            </div>
          </section>
        )}

        <ModuleGrid moduleSummaries={summary?.moduleSummaries} />

        <footer className="mt-20 border-t border-gray-200 dark:border-gray-700 pt-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/features" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Pricing</Link></li>
                <li><Link href="/app-store" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">App Store</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/help" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Help Center</Link></li>
                <li><Link href="/blog" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Blog</Link></li>
                <li><Link href="/docs" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/about" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">About</Link></li>
                <li><Link href="/careers" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/privacy-policy" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Terms of Service</Link></li>
                <li><Link href="/security" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p>&copy; {new Date().getFullYear()} PayAid. All rights reserved.</p>
          </div>
        </footer>
      </main>
      
      <NewsSidebar />
    </div>
  );
}
