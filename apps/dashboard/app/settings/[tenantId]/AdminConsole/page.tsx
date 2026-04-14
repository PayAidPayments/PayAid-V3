'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { StatCard } from '@/components/ui/StatCard'
import { ChartCard } from '@/components/ui/ChartCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import {
  Shield, Users, Building2, ToggleLeft, ToggleRight,
  Search, ChevronDown, ChevronRight, RefreshCw, AlertTriangle,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface TenantRow {
  id: string
  name: string
  slug: string | null
  plan: string
  status: string
  industry: string | null
  licensedModules: string[]
  billingStatus: string | null
  createdAt: string
  user_count: number
  feature_flags: Record<string, boolean>
}

interface TenantsResponse {
  tenants: TenantRow[]
  pagination: { total: number; limit: number; page: number; total_pages: number }
}

interface FlagDetail {
  enabled: boolean
  updated_at: string
}

interface TenantDetail {
  tenant: TenantRow & { deal_count: number; contact_count: number }
  feature_flags: Record<string, FlagDetail>
}

interface ImpactSimulation {
  summary: {
    total_changes: number
    disabled_count: number
    enabled_count: number
  }
  impacts: Array<{
    severity: 'high' | 'medium' | 'low'
    title: string
    detail: string
  }>
}

const ALL_FLAGS = [
  { key: 'm0_ai_native_core',      label: 'M0 AI Core',             tier: 'M0' },
  { key: 'm1_unibox_ingest',        label: 'M1 Unibox Ingest',       tier: 'M1' },
  { key: 'm1_revenue_intelligence', label: 'M1 Revenue Intel',        tier: 'M1' },
  { key: 'm2_voice',                label: 'M2 Voice',               tier: 'M2' },
  { key: 'm2_sdr',                  label: 'M2 SDR',                 tier: 'M2' },
  { key: 'm2_cpq',                  label: 'M2 CPQ',                 tier: 'M2' },
  { key: 'm2_marketplace',          label: 'M2 Marketplace',         tier: 'M2' },
  { key: 'm3_governance',           label: 'M3 AI Governance',       tier: 'M3' },
] as const

const PLAN_COLOR: Record<string, string> = {
  free:       'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  starter:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  pro:        'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  enterprise: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
}

const TIER_COLOR: Record<string, string> = {
  M0: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  M1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  M2: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  M3: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminConsolePage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const queryClient = useQueryClient()
  const { toast, ToastContainer: PageToastContainer } = useToast()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [expandedTenantId, setExpandedTenantId] = useState<string | null>(null)
  const [pendingFlags, setPendingFlags] = useState<Record<string, boolean>>({})
  const [savingFlags, setSavingFlags] = useState(false)

  // ── Queries ───────────────────────────────────────────────────────────────

  const listQuery = useQuery<TenantsResponse>({
    queryKey: ['admin-tenants', page, search, statusFilter],
    queryFn: async () => {
      const qs = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(search ? { search } : {}),
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      })
      const res = await fetch(`/api/v1/admin/tenants?${qs}`)
      if (res.status === 401) throw new Error('Unauthorized — please log in')
      if (res.status === 403) throw new Error('Forbidden — SUPER_ADMIN role required')
      if (!res.ok) throw new Error('Failed to load tenants')
      return res.json()
    },
    staleTime: 60_000,
  })

  const detailQuery = useQuery<TenantDetail>({
    queryKey: ['admin-tenant-detail', expandedTenantId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/tenants/${expandedTenantId}`)
      if (!res.ok) throw new Error('Failed to load tenant detail')
      return res.json()
    },
    enabled: !!expandedTenantId,
    staleTime: 30_000,
  })

  const simulationQuery = useQuery<ImpactSimulation>({
    queryKey: ['admin-tenant-flag-simulation', expandedTenantId, pendingFlags],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/tenants/${expandedTenantId}/feature-flags/simulate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ flags: pendingFlags }),
      })
      if (!res.ok) throw new Error('Failed to simulate impact')
      return res.json()
    },
    enabled: Boolean(expandedTenantId) && Object.keys(pendingFlags).length > 0,
    staleTime: 0,
  })

  const flagMutation = useMutation({
    mutationFn: async ({
      id,
      flags,
    }: {
      id: string
      flags: Record<string, boolean>
    }) => {
      const res = await fetch(`/api/v1/admin/tenants/${id}/feature-flags`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ flags }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to update flags')
      }
      return res.json()
    },
    onSuccess: (_, vars) => {
      toast.success('Feature flags updated')
      setPendingFlags({})
      queryClient.invalidateQueries({ queryKey: ['admin-tenant-detail', vars.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] })
    },
    onError: (e: Error) => {
      toast.error(e.message)
    },
  })

  // ── Derived ───────────────────────────────────────────────────────────────

  const tenants = listQuery.data?.tenants ?? []
  const pagination = listQuery.data?.pagination
  const detail = detailQuery.data

  const effectiveFlags = (id: string): Record<string, boolean> => {
    if (expandedTenantId !== id || !detail) return {}
    const base: Record<string, boolean> = {}
    for (const f of ALL_FLAGS) {
      base[f.key] = detail.feature_flags[f.key]?.enabled ?? true
    }
    return { ...base, ...pendingFlags }
  }

  const hasPendingChanges = Object.keys(pendingFlags).length > 0

  function togglePending(flagKey: string, current: boolean) {
    setPendingFlags((prev) => ({ ...prev, [flagKey]: !current }))
  }

  async function saveFlags(id: string) {
    if (!hasPendingChanges) return
    setSavingFlags(true)
    try {
      await flagMutation.mutateAsync({ id, flags: pendingFlags })
    } finally {
      setSavingFlags(false)
    }
  }

  function openTenant(id: string) {
    if (expandedTenantId === id) {
      setExpandedTenantId(null)
      setPendingFlags({})
    } else {
      setExpandedTenantId(id)
      setPendingFlags({})
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto w-full space-y-5">
      {PageToastContainer}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            Admin Console
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            SUPER_ADMIN only — manage all tenants and feature flag overrides.
          </p>
        </div>
        <button
          type="button"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-tenants'] })}
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Auth error */}
      {listQuery.error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {(listQuery.error as Error).message}
        </div>
      )}

      {/* Band 0 — stat bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total tenants"
          value={pagination ? String(pagination.total) : '—'}
          subtitle="All time"
          icon={<Building2 className="w-4 h-4" />}
        />
        <StatCard
          title="Active tenants"
          value={
            listQuery.data
              ? String(tenants.filter((t) => t.status === 'active').length)
              : '—'
          }
          subtitle="On this page"
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          title="Page"
          value={pagination ? `${pagination.page} / ${pagination.total_pages}` : '—'}
          subtitle={`${pagination?.limit ?? 20} per page`}
          icon={<Shield className="w-4 h-4" />}
        />
        <StatCard
          title="Feature flags"
          value={String(ALL_FLAGS.length)}
          subtitle="Configurable gates"
          icon={<ToggleRight className="w-4 h-4" />}
        />
      </div>

      {/* Band 1 — search + filter bar */}
      <ChartCard title="Tenant Registry" subtitle="Search, filter, and expand to manage feature flags per tenant">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or slug…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {(['all', 'active', 'suspended'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setStatusFilter(s)
                setPage(1)
              }}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {listQuery.isLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
            Loading tenants…
          </p>
        ) : tenants.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
            No tenants match your filter.
          </p>
        ) : (
          <div className="space-y-2">
            {tenants.map((t) => {
              const isExpanded = expandedTenantId === t.id
              const flags = effectiveFlags(t.id)

              return (
                <div
                  key={t.id}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden"
                >
                  {/* Tenant row */}
                  <button
                    type="button"
                    onClick={() => openTenant(t.id)}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                          {t.name}
                        </span>
                        {t.slug && (
                          <span className="text-xs text-slate-400">/{t.slug}</span>
                        )}
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0.5 ${PLAN_COLOR[t.plan] ?? PLAN_COLOR.free}`}
                        >
                          {t.plan}
                        </Badge>
                        {t.status !== 'active' && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300">
                            {t.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {t.user_count} user{t.user_count !== 1 ? 's' : ''} ·{' '}
                        {t.industry ?? 'no industry'} ·{' '}
                        {new Date(t.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Mini flag pills */}
                    <div className="hidden sm:flex items-center gap-1 shrink-0">
                      {ALL_FLAGS.slice(0, 4).map((f) => (
                        <span
                          key={f.key}
                          title={f.label}
                          className={`inline-block w-2 h-2 rounded-full ${
                            (t.feature_flags[f.key] ?? true)
                              ? 'bg-emerald-500'
                              : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </button>

                  {/* Expanded: feature flag panel */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-4 bg-slate-50 dark:bg-slate-900/40">
                      {detailQuery.isLoading ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Loading flags…
                        </p>
                      ) : (
                        <>
                          {/* Tenant meta (from detail) */}
                          {detail && (
                            <div className="flex flex-wrap gap-4 mb-4 text-xs text-slate-500 dark:text-slate-400">
                              <span>{detail.tenant.deal_count} deals</span>
                              <span>{detail.tenant.contact_count} contacts</span>
                              <span>Billing: {detail.tenant.billingStatus ?? 'n/a'}</span>
                              <span>Tier: {detail.tenant.plan ?? t.plan}</span>
                            </div>
                          )}

                          {/* Flag toggles grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {ALL_FLAGS.map((f) => {
                              const current = flags[f.key] ?? true
                              const isPending = f.key in pendingFlags
                              return (
                                <div
                                  key={f.key}
                                  className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 border transition-colors ${
                                    isPending
                                      ? 'border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30'
                                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                                  }`}
                                >
                                  <div>
                                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                      {f.label}
                                    </p>
                                    <span
                                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${TIER_COLOR[f.tier]}`}
                                    >
                                      {f.tier}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => togglePending(f.key, current)}
                                    title={current ? 'Click to disable' : 'Click to enable'}
                                    className="text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                                  >
                                    {current ? (
                                      <ToggleRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                      <ToggleLeft className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                                    )}
                                  </button>
                                </div>
                              )
                            })}
                          </div>

                          {/* Save / discard buttons */}
                          {hasPendingChanges && (
                            <div className="mt-4 flex items-center gap-3">
                              <Button
                                size="sm"
                                onClick={() => saveFlags(t.id)}
                                disabled={savingFlags || flagMutation.isPending}
                                title={savingFlags ? 'Saving…' : 'Save flag changes'}
                              >
                                {savingFlags ? 'Saving…' : 'Save changes'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setPendingFlags({})}
                                disabled={savingFlags}
                              >
                                Discard
                              </Button>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {Object.keys(pendingFlags).length} change
                                {Object.keys(pendingFlags).length !== 1 ? 's' : ''} pending
                              </span>
                            </div>
                          )}

                          {hasPendingChanges && (
                            <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3">
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Change impact preview
                              </p>
                              {simulationQuery.isLoading ? (
                                <p className="text-xs text-slate-500 dark:text-slate-400">Simulating impact…</p>
                              ) : simulationQuery.error ? (
                                <p className="text-xs text-amber-700 dark:text-amber-300">
                                  Unable to simulate impact right now.
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {simulationQuery.data?.summary.disabled_count ?? 0} disable / {simulationQuery.data?.summary.enabled_count ?? 0} enable actions
                                  </p>
                                  {(simulationQuery.data?.impacts ?? []).slice(0, 3).map((impact, idx) => (
                                    <div key={`impact-${idx}`} className="text-xs">
                                      <span
                                        className={`font-medium ${
                                          impact.severity === 'high'
                                            ? 'text-rose-700 dark:text-rose-300'
                                            : impact.severity === 'medium'
                                            ? 'text-amber-700 dark:text-amber-300'
                                            : 'text-slate-700 dark:text-slate-300'
                                        }`}
                                      >
                                        {impact.severity.toUpperCase()}
                                      </span>{' '}
                                      <span className="text-slate-700 dark:text-slate-300">{impact.title}</span>
                                      <div className="text-slate-500 dark:text-slate-400">{impact.detail}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>
              {((pagination.page - 1) * pagination.limit) + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pagination.total_pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </ChartCard>

      {/* Band 4 — flag legend */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          Feature Flag Reference
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ALL_FLAGS.map((f) => (
            <div key={f.key} className="flex items-center gap-2">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${TIER_COLOR[f.tier]}`}>
                {f.tier}
              </span>
              <span className="text-xs text-slate-700 dark:text-slate-300">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
