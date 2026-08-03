'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Globe, Plus, RefreshCw } from 'lucide-react'
import {
  ModuleDashboardShell,
  DashboardEmptyState,
  DashboardSkeleton,
  type DashboardKpi,
  type DashboardAction,
} from '@/components/modules/dashboard'
import { getModuleConfig } from '@/lib/modules/module-config'

interface WebsiteSite {
  id: string
  name: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  goalType: string
  pageCount?: number
  updatedAt: string
}

export default function WebsiteBuilderDashboardPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''
  const { token } = useAuthStore()
  const moduleConfig = getModuleConfig('website-builder')!
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('ALL')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createSlug, setCreateSlug] = useState('')
  const [createGoalType, setCreateGoalType] = useState<
    'lead_generation' | 'appointment_booking' | 'local_presence' | 'campaign_microsite' | 'service_showcase'
  >('lead_generation')

  const { data, isLoading, refetch } = useQuery<{ sites: WebsiteSite[] }>({
    queryKey: ['website-sites', tenantId, statusFilter],
    queryFn: async () => {
      const query = new URLSearchParams()
      if (statusFilter !== 'ALL') query.set('status', statusFilter)
      const response = await fetch(`/api/website/sites?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to fetch website sites')
      return response.json()
    },
    enabled: Boolean(token),
  })

  const createSiteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/website/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: createName.trim(),
          slug: createSlug.trim(),
          goalType: createGoalType,
        }),
      })
      if (!response.ok) throw new Error('Failed to create website')
      return response.json()
    },
    onSuccess: () => {
      setCreateName('')
      setCreateSlug('')
      setCreateGoalType('lead_generation')
      setShowCreateForm(false)
      refetch()
    },
  })

  const sites = data?.sites ?? []
  const published = useMemo(() => sites.filter((s) => s.status === 'PUBLISHED').length, [sites])
  const drafts = useMemo(() => sites.filter((s) => s.status === 'DRAFT').length, [sites])

  if (isLoading) return <DashboardSkeleton />

  const kpis: DashboardKpi[] = [
    {
      label: 'Websites',
      value: sites.length,
      icon: <Globe className="w-5 h-5" />,
      tone: 'purple',
      href: `/website-builder/${tenantId}/Sites`,
    },
    {
      label: 'Published',
      value: published,
      tone: 'success',
    },
    {
      label: 'Drafts',
      value: drafts,
      tone: 'info',
    },
    {
      label: 'Archived',
      value: sites.filter((s) => s.status === 'ARCHIVED').length,
      tone: 'gold',
      empty: sites.every((s) => s.status !== 'ARCHIVED'),
      emptyLabel: 'None',
    },
  ]

  const canCreate =
    createName.trim().length > 0 && createSlug.trim().length > 0 && !createSiteMutation.isPending

  const actions: DashboardAction[] = [
    {
      label: showCreateForm ? 'Cancel create' : 'Create website',
      onClick: () => setShowCreateForm((prev) => !prev),
      icon: <Plus className="w-4 h-4" />,
    },
    {
      label: 'Refresh',
      onClick: () => refetch(),
      icon: <RefreshCw className="w-4 h-4" />,
      variant: 'secondary',
    },
    {
      label: 'Sites',
      href: `/website-builder/${tenantId}/Sites`,
      variant: 'secondary',
    },
  ]

  return (
    <ModuleDashboardShell
      moduleId="website-builder"
      title="Website Builder"
      moduleIcon={<moduleConfig.icon className="w-7 h-7" />}
      headerExtra={
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900"
          aria-label="Filter sites by status"
        >
          <option value="ALL">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      }
      kpis={kpis}
      insight={{
        text:
          sites.length > 0
            ? `${sites.length} site${sites.length === 1 ? '' : 's'} · ${published} published · ${drafts} draft.`
            : 'Create your first site to start drafting pages with AI-assisted editing.',
        status: sites.length ? 'ready' : 'unavailable',
      }}
      actions={actions}
      secondaryTitle="Your websites"
      secondaryDescription="Primary site list — open a site to edit pages"
      secondary={
        <div className="space-y-4">
          {showCreateForm ? (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Create website</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Site name"
                  className="h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm"
                />
                <input
                  value={createSlug}
                  onChange={(e) =>
                    setCreateSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, '-')
                        .replace(/-+/g, '-')
                        .replace(/^-|-$/g, '')
                    )
                  }
                  placeholder="site-slug"
                  className="h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm"
                />
                <select
                  value={createGoalType}
                  onChange={(e) => setCreateGoalType(e.target.value as typeof createGoalType)}
                  className="h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 text-sm"
                >
                  <option value="lead_generation">Lead generation</option>
                  <option value="appointment_booking">Appointment booking</option>
                  <option value="local_presence">Local presence</option>
                  <option value="campaign_microsite">Campaign microsite</option>
                  <option value="service_showcase">Service showcase</option>
                </select>
              </div>
              <button
                type="button"
                disabled={!canCreate}
                onClick={() => createSiteMutation.mutate()}
                className="inline-flex items-center rounded-lg bg-[#53328A] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {createSiteMutation.isPending ? 'Creating…' : 'Create'}
              </button>
              {createSiteMutation.isError ? (
                <p className="text-xs text-red-600">Failed to create website</p>
              ) : null}
            </div>
          ) : null}

          {sites.length > 0 ? (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {sites.slice(0, 8).map((site) => (
                <li key={site.id}>
                  <Link
                    href={`/website-builder/${tenantId}/Sites/${site.id}`}
                    className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 -mx-2 px-2 rounded-lg"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {site.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {site.status} · {site.slug}
                      </p>
                    </div>
                    <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <DashboardEmptyState
              icon={<Globe />}
              title="No websites yet"
              description="Create a site to start building pages."
              actionLabel="Create website"
              onAction={() => setShowCreateForm(true)}
            />
          )}
        </div>
      }
    />
  )
}
