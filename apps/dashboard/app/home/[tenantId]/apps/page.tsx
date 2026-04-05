'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Header } from '../../components/Header'
import { ModuleGrid } from '../../components/ModuleGrid'
import { NewsSidebar } from '@/components/news/NewsSidebar'
import { getAuthFromStorage } from '../../lib/auth-storage'
import { useHomeTenantGate } from '../../hooks/useHomeTenantGate'

export default function TenantAppsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { tenant } = useAuthStore()
  const { ready } = useHomeTenantGate(tenantId)

  const [summary, setSummary] = useState<{ moduleSummaries?: Record<string, string> } | null>(null)

  const authTenantId =
    tenant?.id ?? (typeof window !== 'undefined' ? getAuthFromStorage().tenant?.id : null) ?? tenantId

  const fetchSummary = useCallback(() => {
    const authToken = useAuthStore.getState().token ?? getAuthFromStorage().token
    if (!authTenantId || !authToken) return
    fetch(`/api/home/summary?tenantId=${encodeURIComponent(authTenantId)}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.kpis) setSummary({ moduleSummaries: data.moduleSummaries })
      })
      .catch(() => {})
  }, [authTenantId])

  useEffect(() => {
    if (!ready) return
    fetchSummary()
  }, [ready, fetchSummary])

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 transition-colors">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          <Link href={`/home/${tenantId}`} className="hover:text-[#53328A] dark:hover:text-purple-400 font-medium">
            ← Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800 dark:text-slate-200 font-medium">All apps</span>
        </nav>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">Your apps</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-2xl">
          Launch any module included in your workspace. Use search and categories to find tools quickly.
        </p>
        <ModuleGrid moduleSummaries={summary?.moduleSummaries} />
      </main>
      <NewsSidebar />
    </div>
  )
}
