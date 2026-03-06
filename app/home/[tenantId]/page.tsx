'use client'

import { Header } from '../components/Header'
import { HeroSection } from '../components/HeroSection'
import { PinnedModules } from '../components/PinnedModules'
import { TodayAISummary } from '../components/TodayAISummary'
import { ModuleGrid } from '../components/ModuleGrid'
import { NewsSidebar } from '@/components/news/NewsSidebar'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { useParams, useRouter } from 'next/navigation'

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

export default function TenantHomePage() {
  const [mounted, setMounted] = useState(false)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [summary, setSummary] = useState<HomeSummary | null>(null)
  const [briefingBullets, setBriefingBullets] = useState<string[]>([])
  const params = useParams()
  const router = useRouter()
  const { tenant, token } = useAuthStore()
  const tenantId = params.tenantId as string
  const didRedirect = useRef(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Auth check: run on every mount so Strict Mode remount still gets content
  useEffect(() => {
    if (!tenantId) return

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
        setHasCheckedAuth(true)
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
      setHasCheckedAuth(true)
    }

    runAuthCheck()
  }, [tenantId, router])

  // Fallback: if URL has tenantId and we have matching auth in storage, show page after a short delay
  // (avoids being stuck on Loading when effect order or rehydration is delayed)
  useEffect(() => {
    if (!tenantId || hasCheckedAuth) return
    const t = setTimeout(() => {
      const { tenant: tenantFromStorage } = getAuthFromStorage()
      const storedId = tenantFromStorage?.id ?? useAuthStore.getState().tenant?.id
      if (storedId === tenantId) {
        setHasCheckedAuth(true)
      }
    }, 800)
    return () => clearTimeout(t)
  }, [tenantId, hasCheckedAuth])

  useEffect(() => {
    if (!tenantId || !token) return
    fetch(`/api/home/summary?tenantId=${encodeURIComponent(tenantId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setSummary(data))
      .catch(() => {})
  }, [tenantId, token])

  useEffect(() => {
    if (!tenantId || !token) return
    fetch(`/api/home/briefing?tenantId=${encodeURIComponent(tenantId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.bullets && setBriefingBullets(data.bullets))
      .catch(() => {})
  }, [tenantId, token])

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

        {/* Pinned & Recent + Today's AI summary */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-8 mb-10">
          <PinnedModules
            tenantId={tenantId}
            moduleSummaries={summary?.moduleSummaries}
            availableModuleIds={['crm', 'finance', 'hr', 'marketing', 'sales', 'projects', 'inventory', 'ai-studio', 'analytics', 'productivity']}
          />
          <TodayAISummary
            tenantId={tenantId}
            bullets={briefingBullets}
            loading={false}
          />
        </div>

        {/* At a glance: compact KPI strip */}
        {summary?.kpis && (
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
