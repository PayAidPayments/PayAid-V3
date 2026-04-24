'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/lib/stores/auth'
import { validateWebsitePageTree } from '@/lib/website-builder/page-tree-validation'

interface WebsiteSiteDetail {
  id: string
  name: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  goalType:
    | 'lead_generation'
    | 'appointment_booking'
    | 'local_presence'
    | 'campaign_microsite'
    | 'service_showcase'
  pageTree?: unknown[]
  schemaJson?: Record<string, any>
  metaTitle?: string | null
  metaDescription?: string | null
  createdAt: string
  updatedAt: string
}

type DraftPage = {
  pageType?: string
  title?: string
  sections?: string[]
}

type EditablePageTreeEntry = {
  id: string
  slug: string
  title: string
  pageType: string
  orderIndex: number
  sections: string[]
}

export default function WebsiteBuilderSiteDetailPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const siteId = params?.id as string
  const { token } = useAuthStore()

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<{
    name: string
    slug: string
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
    goalType:
      | 'lead_generation'
      | 'appointment_booking'
      | 'local_presence'
      | 'campaign_microsite'
      | 'service_showcase'
    metaTitle: string
    metaDescription: string
  }>({
    name: '',
    slug: '',
    status: 'DRAFT',
    goalType: 'lead_generation',
    metaTitle: '',
    metaDescription: '',
  })
  const [editablePageTree, setEditablePageTree] = useState<EditablePageTreeEntry[]>([])
  const [pageTreeValidationErrors, setPageTreeValidationErrors] = useState<string[]>([])
  const [pageTreeSaveInfo, setPageTreeSaveInfo] = useState<string>('')
  const [pageTreeDirty, setPageTreeDirty] = useState(false)

  const { data: site, isLoading, refetch } = useQuery<WebsiteSiteDetail>({
    queryKey: ['website-site-detail', siteId],
    queryFn: async () => {
      const response = await fetch(`/api/website/sites/${siteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to fetch website site')
      return response.json()
    },
    enabled: Boolean(token && siteId),
  })

  useEffect(() => {
    if (!site) return
    setFormData({
      name: site.name,
      slug: site.slug,
      status: site.status,
      goalType: site.goalType,
      metaTitle: site.metaTitle ?? '',
      metaDescription: site.metaDescription ?? '',
    })
  }, [site])

  const updateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/website/sites/${siteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          metaTitle: formData.metaTitle || null,
          metaDescription: formData.metaDescription || null,
        }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Failed to update website site')
      }
      return response.json()
    },
    onSuccess: () => {
      setIsEditing(false)
      refetch()
    },
  })

  const draftAndPersistMutation = useMutation({
    mutationFn: async () => {
      const generateResponse = await fetch('/api/website/ai/generate-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          siteId,
          businessProfile: {
            businessName: formData.name,
            industry: 'general_business',
            productsOrServices: [],
          },
          websiteGoal: formData.goalType,
          pages: ['Home', 'About', 'Services', 'Contact', 'FAQ'],
          brand: {},
        }),
      })
      if (!generateResponse.ok) {
        const payload = await generateResponse.json().catch(() => ({}))
        throw new Error(payload.error || 'Failed to generate draft')
      }
      const generated = await generateResponse.json()

      const patchResponse = await fetch(`/api/website/sites/${siteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          schemaJson: {
            ...(site?.schemaJson ?? {}),
            aiDraft: generated.draft ?? null,
            aiDraftGeneratedAt: new Date().toISOString(),
          },
        }),
      })
      if (!patchResponse.ok) {
        const payload = await patchResponse.json().catch(() => ({}))
        throw new Error(payload.error || 'Failed to persist generated draft')
      }
      return patchResponse.json()
    },
    onSuccess: () => {
      refetch()
    },
  })

  const derivedPageTree = useMemo(() => {
    if (Array.isArray(site?.pageTree) && site.pageTree.length > 0) {
      return site.pageTree.map((entry, index) => ({
        id: `tree-${index}`,
        label:
          typeof entry === 'string'
            ? entry
            : typeof entry === 'object' && entry !== null && 'title' in entry
              ? String((entry as { title?: unknown }).title ?? `Page ${index + 1}`)
              : `Page ${index + 1}`,
      }))
    }

    const plan = site?.schemaJson?.aiDraft?.pagePlan
    if (Array.isArray(plan)) {
      return plan.map((entry: any, index: number) => ({
        id: `plan-${index}`,
        label: entry?.title || entry?.pageType || `Page ${index + 1}`,
      }))
    }

    return []
  }, [site?.pageTree, site?.schemaJson])

  useEffect(() => {
    const source = Array.isArray(site?.pageTree) ? site.pageTree : []
    if (source.length > 0) {
      const mapped = source.map((entry: any, index: number) => ({
        id: String(entry?.id ?? `page-${index + 1}`),
        slug: String(entry?.slug ?? `page-${index + 1}`),
        title: String(entry?.title ?? `Page ${index + 1}`),
        pageType: String(entry?.pageType ?? 'custom'),
        orderIndex: Number.isFinite(entry?.orderIndex) ? Number(entry.orderIndex) : index,
        sections: Array.isArray(entry?.sections)
          ? entry.sections.map((section: unknown) => String(section))
          : [],
      }))
      setEditablePageTree(mapped)
      setPageTreeDirty(false)
      return
    }

    const fallback = derivedPageTree.map((entry, index) => ({
      id: entry.id,
      slug: entry.label
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, ''),
      title: entry.label,
      pageType: 'custom',
      orderIndex: index,
      sections: [],
    }))
    setEditablePageTree(fallback)
    setPageTreeDirty(false)
  }, [site?.pageTree, derivedPageTree])

  const hasAiDraftPlan = Array.isArray(site?.schemaJson?.aiDraft?.pagePlan) && site.schemaJson.aiDraft.pagePlan.length > 0

  const applyDraftToPagesMutation = useMutation({
    mutationFn: async () => {
      const pagePlan = (site?.schemaJson?.aiDraft?.pagePlan ?? []) as DraftPage[]
      if (!Array.isArray(pagePlan) || pagePlan.length === 0) {
        throw new Error('No AI draft page plan available to apply')
      }

      const pageTreePayload = pagePlan.map((page, index) => ({
        id: `page-${index + 1}`,
        slug: (page.pageType || page.title || `page-${index + 1}`)
          .toString()
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, ''),
        title: page.title || page.pageType || `Page ${index + 1}`,
        pageType: page.pageType || 'custom',
        orderIndex: index,
        sections: Array.isArray(page.sections) ? page.sections : [],
      }))

      const response = await fetch(`/api/website/sites/${siteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pageTree: pageTreePayload,
          schemaJson: {
            ...(site?.schemaJson ?? {}),
            aiDraftAppliedAt: new Date().toISOString(),
          },
        }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Failed to apply draft to pages')
      }
      return response.json()
    },
    onSuccess: () => {
      setPageTreeSaveInfo('AI draft was applied to pages and normalized on save.')
      setPageTreeDirty(false)
      refetch()
    },
  })

  const savePageTreeMutation = useMutation({
    mutationFn: async () => {
      const payload = editablePageTree.map((entry, index) => ({
        ...entry,
        orderIndex: index,
      }))
      const response = await fetch(`/api/website/sites/${siteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pageTree: payload,
        }),
      })
      if (!response.ok) {
        const payloadError = await response.json().catch(() => ({}))
        throw new Error(payloadError.error || 'Failed to save page tree')
      }
      return response.json()
    },
    onSuccess: () => {
      setPageTreeSaveInfo('Page tree saved successfully. Server normalization applied.')
      setPageTreeDirty(false)
      refetch()
    },
  })

  const handleSavePageTree = () => {
    const errors = validateWebsitePageTree(
      editablePageTree.map((entry) => ({
        title: entry.title,
        slug: entry.slug,
      }))
    )
    setPageTreeSaveInfo('')
    setPageTreeValidationErrors(errors)
    if (errors.length > 0) return
    savePageTreeMutation.mutate()
  }

  const movePage = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= editablePageTree.length) return
    const next = [...editablePageTree]
    const [item] = next.splice(index, 1)
    next.splice(targetIndex, 0, item)
    setPageTreeSaveInfo('')
    setPageTreeDirty(true)
    setPageTreeValidationErrors([])
    setEditablePageTree(next.map((entry, idx) => ({ ...entry, orderIndex: idx })))
  }

  const removePage = (index: number) => {
    const next = editablePageTree.filter((_, idx) => idx !== index)
    setPageTreeSaveInfo('')
    setPageTreeDirty(true)
    setPageTreeValidationErrors([])
    setEditablePageTree(next.map((entry, idx) => ({ ...entry, orderIndex: idx })))
  }

  const addPage = () => {
    const index = editablePageTree.length
    setPageTreeSaveInfo('')
    setPageTreeDirty(true)
    setPageTreeValidationErrors([])
    setEditablePageTree((prev) => [
      ...prev,
      {
        id: `manual-${Date.now()}-${index}`,
        slug: `page-${index + 1}`,
        title: `Page ${index + 1}`,
        pageType: 'custom',
        orderIndex: index,
        sections: [],
      },
    ])
  }

  if (isLoading || !site) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-8 text-center text-gray-500">Loading website...</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{site.name}</h1>
          <p className="text-sm text-gray-600">/{site.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => draftAndPersistMutation.mutate()}
            disabled={draftAndPersistMutation.isPending || isEditing}
          >
            {draftAndPersistMutation.isPending ? 'Generating Draft...' : 'Generate Draft'}
          </Button>
          <Button
            variant="outline"
            onClick={() => applyDraftToPagesMutation.mutate()}
            disabled={applyDraftToPagesMutation.isPending || isEditing || !hasAiDraftPlan}
          >
            {applyDraftToPagesMutation.isPending ? 'Applying Draft...' : 'Apply Draft to Pages'}
          </Button>
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit Site
            </Button>
          )}
          <Link href={`/website-builder/${tenantId}/Home`}>
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Website Site</CardTitle>
            <CardDescription>Update basic site metadata while builder screens are being rolled out.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                updateMutation.mutate()
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700" htmlFor="name">
                    Site name
                  </label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700" htmlFor="slug">
                    Slug
                  </label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, '-')
                          .replace(/-+/g, '-')
                          .replace(/^-|-$/g, ''),
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700" htmlFor="status">
                    Status
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value as typeof prev.status,
                      }))
                    }
                    className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700" htmlFor="goalType">
                    Goal
                  </label>
                  <select
                    id="goalType"
                    value={formData.goalType}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        goalType: e.target.value as typeof prev.goalType,
                      }))
                    }
                    className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
                  >
                    <option value="lead_generation">Lead generation</option>
                    <option value="appointment_booking">Appointment booking</option>
                    <option value="local_presence">Local presence</option>
                    <option value="campaign_microsite">Campaign microsite</option>
                    <option value="service_showcase">Service showcase</option>
                  </select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="metaTitle">
                    Meta title
                  </label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="metaDescription">
                    Meta description
                  </label>
                  <textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) => setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Site Overview</CardTitle>
            <CardDescription>Current configuration and metadata for this website.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd className="font-medium">{site.status}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Goal</dt>
                <dd className="font-medium capitalize">{site.goalType.replace(/_/g, ' ')}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Pages</dt>
                <dd className="font-medium">{Array.isArray(site.pageTree) ? site.pageTree.length : 0}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Updated</dt>
                <dd className="font-medium">{new Date(site.updatedAt).toLocaleString()}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-gray-500">Meta title</dt>
                <dd className="font-medium">{site.metaTitle || '-'}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-gray-500">Meta description</dt>
                <dd className="font-medium">{site.metaDescription || '-'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Page Tree Editor</CardTitle>
          <CardDescription>
            Reorder, rename, add, or remove pages. Save to persist into canonical page tree payload.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editablePageTree.length === 0 ? (
            <p className="text-sm text-gray-500">
              No page tree yet. Use <span className="font-medium">Generate Draft</span>, then Apply Draft to Pages.
            </p>
          ) : (
            <div className="space-y-3">
              {editablePageTree.map((entry, index) => (
                <div key={entry.id} className="rounded-md border border-gray-200 p-3 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input
                      value={entry.title}
                      onChange={(e) => {
                        setPageTreeSaveInfo('')
                        setPageTreeDirty(true)
                        setPageTreeValidationErrors([])
                        setEditablePageTree((prev) =>
                          prev.map((item, idx) =>
                            idx === index ? { ...item, title: e.target.value || `Page ${index + 1}` } : item
                          )
                        )
                      }}
                      placeholder="Page title"
                    />
                    <Input
                      value={entry.slug}
                      onChange={(e) => {
                        setPageTreeSaveInfo('')
                        setPageTreeDirty(true)
                        setPageTreeValidationErrors([])
                        setEditablePageTree((prev) =>
                          prev.map((item, idx) =>
                            idx === index
                              ? {
                                  ...item,
                                  slug: e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9-]/g, '-')
                                    .replace(/-+/g, '-')
                                    .replace(/^-|-$/g, ''),
                                }
                              : item
                          )
                        )
                      }}
                      placeholder="page-slug"
                    />
                    <Input
                      value={entry.pageType}
                      onChange={(e) => {
                        setPageTreeSaveInfo('')
                        setPageTreeDirty(true)
                        setPageTreeValidationErrors([])
                        setEditablePageTree((prev) =>
                          prev.map((item, idx) => (idx === index ? { ...item, pageType: e.target.value } : item))
                        )
                      }}
                      placeholder="page type"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">#{index + 1}</span>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => movePage(index, -1)} disabled={index === 0}>
                        Up
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => movePage(index, 1)}
                        disabled={index === editablePageTree.length - 1}
                      >
                        Down
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => removePage(index)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {pageTreeValidationErrors.length > 0 && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-medium text-red-700">Fix these issues before saving:</p>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                {pageTreeValidationErrors.map((error) => (
                  <li key={error} className="text-sm text-red-700">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {pageTreeSaveInfo && (
            <div className="mt-3 rounded-md border border-green-200 bg-green-50 p-3">
              <p className="text-sm text-green-700">{pageTreeSaveInfo}</p>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
            <span className="text-xs text-gray-600">
              Last page-tree save: {new Date(site.updatedAt).toLocaleString()}
            </span>
            {pageTreeDirty && <span className="text-xs font-medium text-amber-700">Unsaved page-tree changes</span>}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button variant="outline" onClick={addPage}>
              Add Page
            </Button>
            <Button
              variant="outline"
              onClick={handleSavePageTree}
              disabled={savePageTreeMutation.isPending}
            >
              {savePageTreeMutation.isPending ? 'Saving Page Tree...' : 'Save Page Tree'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
