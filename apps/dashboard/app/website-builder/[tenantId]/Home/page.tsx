'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
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

const CREATE_WEBSITE_TIMEOUT_MS = 15000

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function WebsiteBuilderDashboardPage() {
  const router = useRouter()
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
  const [createSlugTouched, setCreateSlugTouched] = useState(false)
  const [createNameTouched, setCreateNameTouched] = useState(false)
  const [createSubmitAttempted, setCreateSubmitAttempted] = useState(false)
  const [createGoalType, setCreateGoalType] = useState<
    'lead_generation' | 'appointment_booking' | 'local_presence' | 'campaign_microsite' | 'service_showcase'
  >('lead_generation')
  const [createError, setCreateError] = useState<string | null>(null)
  const createNameInputRef = useRef<HTMLInputElement | null>(null)
  const createSlugInputRef = useRef<HTMLInputElement | null>(null)

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
      if (!token) {
        throw new Error('Session expired. Please sign in again.')
      }
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), CREATE_WEBSITE_TIMEOUT_MS)
      try {
        const response = await fetch('/api/website/sites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
          body: JSON.stringify({
            name: createName.trim(),
            slug: createSlug.trim(),
            goalType: createGoalType,
          }),
        })
        if (!response.ok) {
          let message = 'Failed to create website'
          try {
            const payload = await response.json()
            if (Array.isArray(payload?.details) && payload.details.length > 0) {
              const first = payload.details[0]
              const field = Array.isArray(first?.path) && first.path.length > 0 ? `${String(first.path[0])}: ` : ''
              const detailMessage = typeof first?.message === 'string' ? first.message : null
              if (detailMessage) message = `${field}${detailMessage}`
            } else if (payload?.error) {
              message = String(payload.error)
            }
          } catch {
            // no-op: keep default message
          }
          throw new Error(message)
        }
        return response.json()
      } finally {
        clearTimeout(timeout)
      }
    },
    onSuccess: (created: { id?: string }) => {
      setCreateError(null)
      setCreateName('')
      setCreateSlug('')
      setCreateSlugTouched(false)
      setCreateNameTouched(false)
      setCreateSubmitAttempted(false)
      setCreateGoalType('lead_generation')
      setShowCreateForm(false)
      refetch()
      if (created?.id && tenantId) {
        router.push(`/website-builder/${tenantId}/Sites/${created.id}`)
      }
    },
    onError: (error) => {
      if (error instanceof Error && error.name === 'AbortError') {
        setCreateError('Create request timed out. Please retry.')
        return
      }
      if (error instanceof TypeError) {
        setCreateError('Network error while creating website. Check your connection and retry.')
        return
      }
      setCreateError(error instanceof Error ? error.message : 'Failed to create website')
    },
  })

  useEffect(() => {
    if (!showCreateForm) {
      setCreateError(null)
      setCreateSlugTouched(false)
      setCreateNameTouched(false)
      setCreateSubmitAttempted(false)
    }
  }, [showCreateForm])

  useEffect(() => {
    if (!showCreateForm || createSlugTouched) return
    const derivedSlug = normalizeSlug(createName)
    setCreateSlug(derivedSlug)
  }, [createName, createSlugTouched, showCreateForm])

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

  const canCreate = Boolean(token) && createName.trim().length > 0 && createSlug.trim().length > 0 && !createSiteMutation.isPending
  const normalizedCreateSlug = normalizeSlug(createSlug.trim())
  const slugFormatValid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedCreateSlug)
  const slugLengthValid = normalizedCreateSlug.length >= 3
  const slugAlreadyExists = sites.some((site) => normalizeSlug(site.slug) === normalizedCreateSlug)
  const suggestedSlug = useMemo(() => {
    if (!slugAlreadyExists || !normalizedCreateSlug) return null
    const existingSlugs = new Set(sites.map((site) => normalizeSlug(site.slug)))
    let suffix = 2
    let candidate = `${normalizedCreateSlug}-${suffix}`
    while (existingSlugs.has(candidate) && suffix < 1000) {
      suffix += 1
      candidate = `${normalizedCreateSlug}-${suffix}`
    }
    return existingSlugs.has(candidate) ? null : candidate
  }, [normalizedCreateSlug, sites, slugAlreadyExists])
  const createDisabledReason = !token
    ? 'Session expired. Please sign in again.'
    : !createName.trim()
    ? 'Enter a site name.'
    : !createSlug.trim()
      ? 'Enter a valid slug.'
      : !slugLengthValid
        ? 'Slug must be at least 3 characters.'
        : !slugFormatValid
          ? 'Slug can use lowercase letters, numbers, and hyphens only.'
          : slugAlreadyExists
            ? 'This slug already exists in your current site list.'
      : null
  const canSubmitCreate = canCreate && slugFormatValid && slugLengthValid && !slugAlreadyExists

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
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  className="gap-2"
                  disabled={createSiteMutation.isPending}
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
                <Button
                  onClick={() => setShowCreateForm((prev) => !prev)}
                  className="gap-2"
                  disabled={createSiteMutation.isPending}
                >
                  <Plus className="w-4 h-4" />
                  {showCreateForm ? 'Cancel' : 'Create Website'}
                </Button>
              </div>
            </div>

            {showCreateForm && (
              <form
                className="mb-6 rounded-lg border border-gray-200 bg-white p-4 space-y-3"
                aria-busy={createSiteMutation.isPending}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && !createSiteMutation.isPending) {
                    e.preventDefault()
                    setShowCreateForm(false)
                  }
                }}
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!canSubmitCreate) {
                    setCreateSubmitAttempted(true)
                    if (!createName.trim()) {
                      createNameInputRef.current?.focus()
                    } else if (!createSlug.trim() || !slugLengthValid || !slugFormatValid || slugAlreadyExists) {
                      createSlugInputRef.current?.focus()
                    }
                    return
                  }
                  createSiteMutation.mutate()
                }}
              >
                <h3 className="text-sm font-semibold text-gray-900">Create Website</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="create-site-name" className="text-xs font-medium text-gray-700">
                      Site name
                    </label>
                    <input
                      id="create-site-name"
                      ref={createNameInputRef}
                      autoFocus
                      disabled={createSiteMutation.isPending}
                      value={createName}
                      onChange={(e) => {
                        setCreateNameTouched(true)
                        if (createSubmitAttempted) setCreateSubmitAttempted(false)
                        setCreateName(e.target.value)
                        if (createError) setCreateError(null)
                      }}
                      placeholder="Site name"
                      required
                      aria-invalid={(createNameTouched || createSubmitAttempted) && !createName.trim()}
                      aria-describedby="create-site-name-help"
                      className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="create-site-slug" className="text-xs font-medium text-gray-700">
                      Slug
                    </label>
                    <input
                      id="create-site-slug"
                      ref={createSlugInputRef}
                      disabled={createSiteMutation.isPending}
                      value={createSlug}
                      onChange={(e) => {
                        setCreateSlugTouched(true)
                        if (createSubmitAttempted) setCreateSubmitAttempted(false)
                        setCreateSlug(normalizeSlug(e.target.value))
                        if (createError) setCreateError(null)
                      }}
                      placeholder="site-slug"
                      required
                      minLength={3}
                      pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                      aria-invalid={
                        (createSlugTouched || createSubmitAttempted) &&
                        createSlug.trim().length > 0 &&
                        (!slugLengthValid || !slugFormatValid || slugAlreadyExists)
                      }
                      aria-describedby="create-site-slug-help create-site-slug-validation"
                      className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="create-site-goal" className="text-xs font-medium text-gray-700">
                      Goal
                    </label>
                    <select
                      id="create-site-goal"
                      disabled={createSiteMutation.isPending}
                      value={createGoalType}
                      onChange={(e) => {
                        if (createSubmitAttempted) setCreateSubmitAttempted(false)
                        setCreateGoalType(e.target.value as typeof createGoalType)
                        if (createError) setCreateError(null)
                      }}
                      className="h-9 w-full rounded-md border border-gray-300 px-2 text-sm"
                    >
                      <option value="lead_generation">Lead generation</option>
                      <option value="appointment_booking">Appointment booking</option>
                      <option value="local_presence">Local presence</option>
                      <option value="campaign_microsite">Campaign microsite</option>
                      <option value="service_showcase">Service showcase</option>
                    </select>
                  </div>
                </div>
                <p id="create-site-name-help" className="text-xs text-gray-500">
                  Enter a clear business-facing site name.
                </p>
                <p id="create-site-slug-help" className="text-xs text-gray-500">
                  Slug auto-generates from site name until you edit it manually.
                </p>
                <div id="create-site-slug-validation">
                {(createSlugTouched || createSubmitAttempted) && createSlug.trim().length > 0 && !slugLengthValid ? (
                  <p className="text-xs text-amber-700" aria-live="polite">
                    Slug must be at least 3 characters.
                  </p>
                ) : null}
                {(createSlugTouched || createSubmitAttempted) && createSlug.trim().length >= 3 && !slugFormatValid ? (
                  <p className="text-xs text-amber-700" aria-live="polite">
                    Use lowercase letters, numbers, and hyphens only.
                  </p>
                ) : null}
                {(createSlugTouched || createSubmitAttempted) && slugAlreadyExists ? (
                  <div className="flex items-center gap-2" aria-live="polite">
                    <p className="text-xs text-amber-700">That slug is already used by an existing site.</p>
                    {suggestedSlug ? (
                      <button
                        type="button"
                        className="text-xs text-blue-700 underline"
                        onClick={() => {
                          setCreateSlugTouched(true)
                          setCreateSlug(suggestedSlug)
                          if (createError) setCreateError(null)
                          if (createSubmitAttempted) setCreateSubmitAttempted(false)
                        }}
                      >
                        Use "{suggestedSlug}"
                      </button>
                    ) : null}
                  </div>
                ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <span title={!canSubmitCreate && createDisabledReason ? createDisabledReason : undefined}>
                    <Button type="submit" disabled={!canSubmitCreate}>
                      {createSiteMutation.isPending ? 'Creating...' : 'Create'}
                    </Button>
                  </span>
                  <p className="text-xs text-gray-500">First page generation and visual editing come in next phase.</p>
                </div>
                {createSiteMutation.isPending ? (
                  <p className="text-xs text-blue-700" aria-live="polite">
                    Creating website...
                  </p>
                ) : null}
                {!canSubmitCreate && createDisabledReason ? (
                  <p className="text-xs text-amber-700" aria-live="polite">
                    {createDisabledReason}
                  </p>
                ) : null}
                {createError ? (
                  <p className="text-xs text-red-600" role="alert" aria-live="assertive">
                    {createError}
                  </p>
                ) : null}
              </form>
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
