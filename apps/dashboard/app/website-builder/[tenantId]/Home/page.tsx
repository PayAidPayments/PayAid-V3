'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Globe, Plus, RefreshCw } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'

interface WebsiteSite {
  id: string
  name: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  goalType: string
  pageCount?: number
  views?: number
  conversions?: number
  conversionRate?: number
  createdAt: string
  updatedAt: string
}

export default function WebsiteBuilderDashboardPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''
  const { token } = useAuthStore()
  const moduleConfig = getModuleConfig('website-builder') || getModuleConfig('crm')!
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('ALL')
  const [goalFilter, setGoalFilter] = useState<
    'ALL' | 'lead_generation' | 'appointment_booking' | 'local_presence' | 'campaign_microsite' | 'service_showcase'
  >('ALL')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createSlug, setCreateSlug] = useState('')
  const [createGoalType, setCreateGoalType] = useState<
    'lead_generation' | 'appointment_booking' | 'local_presence' | 'campaign_microsite' | 'service_showcase'
  >('lead_generation')

  const {
    data,
    isLoading,
    refetch,
  } = useQuery<{ sites: WebsiteSite[] }>({
    queryKey: ['website-sites', tenantId, statusFilter, goalFilter],
    queryFn: async () => {
      const query = new URLSearchParams()
      if (statusFilter !== 'ALL') query.set('status', statusFilter)
      if (goalFilter !== 'ALL') query.set('goalType', goalFilter)
      const response = await fetch(`/api/website/sites?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  const publishMutation = useMutation({
    mutationFn: async ({ id, publish }: { id: string; publish: boolean }) => {
      const response = await fetch(`/api/website/sites/${id}/${publish ? 'publish' : 'unpublish'}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error(`Failed to ${publish ? 'publish' : 'unpublish'} site`)
      return response.json()
    },
    onSuccess: () => refetch(),
  })

  const sites = data?.sites ?? []
  const busySiteId = useMemo(
    () => (publishMutation.isPending ? (publishMutation.variables?.id ?? null) : null),
    [publishMutation.isPending, publishMutation.variables]
  )

  const heroMetrics = [
    { label: 'Websites', value: String(sites.length), icon: <Globe className="w-5 h-5" />, color: 'purple' as const },
  ]

  const canCreate = createName.trim().length > 0 && createSlug.trim().length > 0 && !createSiteMutation.isPending

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Website Builder"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      <div className="p-6 space-y-8">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Website Builder</CardTitle>
            <CardDescription>Create and manage business websites with AI-assisted drafting and visual editing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="h-9 rounded-md border border-gray-300 px-2 text-sm"
                  aria-label="Filter sites by status"
                >
                  <option value="ALL">All statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
                <select
                  value={goalFilter}
                  onChange={(e) => setGoalFilter(e.target.value as typeof goalFilter)}
                  className="h-9 rounded-md border border-gray-300 px-2 text-sm"
                  aria-label="Filter sites by goal"
                >
                  <option value="ALL">All goals</option>
                  <option value="lead_generation">Lead generation</option>
                  <option value="appointment_booking">Appointment booking</option>
                  <option value="local_presence">Local presence</option>
                  <option value="campaign_microsite">Campaign microsite</option>
                  <option value="service_showcase">Service showcase</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => refetch()} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
                <Button onClick={() => setShowCreateForm((prev) => !prev)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  {showCreateForm ? 'Cancel' : 'Create Website'}
                </Button>
              </div>
            </div>

            {showCreateForm && (
              <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Create Website</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Site name"
                    className="h-9 rounded-md border border-gray-300 px-3 text-sm"
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
                    className="h-9 rounded-md border border-gray-300 px-3 text-sm"
                  />
                  <select
                    value={createGoalType}
                    onChange={(e) => setCreateGoalType(e.target.value as typeof createGoalType)}
                    className="h-9 rounded-md border border-gray-300 px-2 text-sm"
                  >
                    <option value="lead_generation">Lead generation</option>
                    <option value="appointment_booking">Appointment booking</option>
                    <option value="local_presence">Local presence</option>
                    <option value="campaign_microsite">Campaign microsite</option>
                    <option value="service_showcase">Service showcase</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => createSiteMutation.mutate()} disabled={!canCreate}>
                    {createSiteMutation.isPending ? 'Creating...' : 'Create'}
                  </Button>
                  <p className="text-xs text-gray-500">First page generation and visual editing come in next phase.</p>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-500">Loading websites...</div>
            ) : sites.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Globe className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No websites yet. Create your first website to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sites.map((site) => (
                  <Card key={site.id}>
                    <CardHeader>
                      <CardTitle>{site.name}</CardTitle>
                      <CardDescription>/{site.slug}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Status</span>
                          <span>{site.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Goal</span>
                          <span className="capitalize">{site.goalType.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Pages</span>
                          <span>{site.pageCount ?? 0}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={busySiteId === site.id}
                        onClick={() =>
                          publishMutation.mutate({
                            id: site.id,
                            publish: site.status !== 'PUBLISHED',
                          })
                        }
                      >
                        {site.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Link href={`/website-builder/${tenantId}/Sites/${site.id}`} className="block">
                        <Button variant="outline" size="sm" className="w-full">
                          Open Site
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </GlassCard>
      </div>
    </div>
  )
}
