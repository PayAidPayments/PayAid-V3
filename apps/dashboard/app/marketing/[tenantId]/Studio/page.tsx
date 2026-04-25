'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { MarketingStudioForm } from '@/components/marketing/MarketingStudioForm'
import { useAuthStore } from '@/lib/stores/auth'

type MeResponse = {
  tenant?: { id: string; name: string; slug?: string | null; subdomain?: string | null } | null
}

type OverviewBrandHealth = {
  accountId: string
  platform: string
  accountName: string | null
}

export default function MarketingStudioPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tenantId = (params?.tenantId as string) ?? ''
  const initialAuditPostId = (searchParams.get('auditPostId') || '').trim()
  const workspaceParam = (searchParams.get('workspace') || '').trim().toLowerCase()
  const workspaceMode: 'social' | 'direct' = workspaceParam === 'direct' ? 'direct' : 'social'
  const { token } = useAuthStore()
  const [brandName, setBrandName] = useState<string | undefined>(undefined)
  const [socialAccounts, setSocialAccounts] = useState<
    Array<{ id: string; platform: string; accountName: string }>
  >([])
  const [showLegacyRedirectBanner, setShowLegacyRedirectBanner] = useState(false)

  const getHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  )

  useEffect(() => {
    if (!token || !tenantId) return
    let cancelled = false
    ;(async () => {
      try {
        const meRes = await fetch('/api/auth/me', { headers: getHeaders() })
        if (!meRes.ok || cancelled) return
        const me = (await meRes.json()) as MeResponse
        if (cancelled) return
        const tn = me.tenant
        if (!tn?.name?.trim()) return
        const route = tenantId.trim()
        const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase()
        const matches =
          tn.id === route || norm(tn.slug) === norm(route) || norm(tn.subdomain) === norm(route)
        if (matches) setBrandName(tn.name.trim())
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, tenantId, getHeaders])

  useEffect(() => {
    if (!token || !tenantId) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/marketing/social/overview', { headers: getHeaders() })
        if (!res.ok || cancelled) return
        const data = (await res.json()) as { brandHealth?: OverviewBrandHealth[] }
        const rows = (data.brandHealth ?? []).map((b) => ({
          id: b.accountId,
          platform: String(b.platform || '').toLowerCase(),
          accountName: (b.accountName ?? '—').trim() || '—',
        }))
        if (!cancelled) setSocialAccounts(rows)
      } catch {
        if (!cancelled) setSocialAccounts([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, tenantId, getHeaders])

  useEffect(() => {
    if (!tenantId) return
    if (searchParams.get('legacyRedirect') !== '1') return
    const key = `marketing-compose-legacy-redirect-banner-seen:${tenantId}`
    try {
      if (sessionStorage.getItem(key) !== '1') {
        setShowLegacyRedirectBanner(true)
        sessionStorage.setItem(key, '1')
      }
    } catch {
      setShowLegacyRedirectBanner(true)
    } finally {
      router.replace(`/marketing/${tenantId}/Studio`)
    }
  }, [tenantId, searchParams, router])

  return (
    <section className="flex-1 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Compose</h1>
        <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-1 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => router.replace(`/marketing/${tenantId}/Studio?workspace=social`)}
            className={[
              'rounded-md px-3 py-1.5 text-sm font-medium',
              workspaceMode === 'social'
                ? 'bg-violet-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
            ].join(' ')}
            aria-pressed={workspaceMode === 'social'}
          >
            Social Studio
          </button>
          <button
            type="button"
            onClick={() => router.replace(`/marketing/${tenantId}/Studio?workspace=direct`)}
            className={[
              'rounded-md px-3 py-1.5 text-sm font-medium',
              workspaceMode === 'direct'
                ? 'bg-violet-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
            ].join(' ')}
            aria-pressed={workspaceMode === 'direct'}
          >
            Direct Studio
          </button>
        </div>
      </div>
      {showLegacyRedirectBanner && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <div className="flex items-start justify-between gap-3">
            <p>Legacy create links now open Compose, so all drafting and publishing happens in one place.</p>
            <button
              type="button"
              className="shrink-0 rounded border border-amber-400 px-2 py-0.5 text-xs font-medium hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/40"
              onClick={() => setShowLegacyRedirectBanner(false)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <MarketingStudioForm
        tenantId={tenantId}
        brandName={brandName}
        socialAccounts={socialAccounts.length > 0 ? socialAccounts : undefined}
        initialAuditPostId={initialAuditPostId || undefined}
        workspaceMode={workspaceMode}
      />
    </section>
  )
}
