'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { INDIAN_STATES } from '@/lib/utils/indian-states'
import { CopyAction, COPY_ACTION_PRESETS } from '@/components/ui/copy-action'

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export default function TenantSettingsPage() {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    industrySubType: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    phone: '',
    email: '',
    website: '',
    logo: '',
    productsServices: '',
    targetCustomers: '',
    cityRegion: '',
    brandTone: '',
    coreOfferings: '',
    whatsappNumber: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [brandKitSearch, setBrandKitSearch] = useState('')
  const [brandKitSort, setBrandKitSort] = useState<'newest' | 'oldest' | 'primary' | 'name'>('newest')
  const [brandKitView, setBrandKitView] = useState<'list' | 'grid'>('list')
  const [selectedBrandKitLogoIds, setSelectedBrandKitLogoIds] = useState<string[]>([])
  const [exportAllFiltered, setExportAllFiltered] = useState(false)
  const [excludePrimaryFromExport, setExcludePrimaryFromExport] = useState(false)
  const [branding, setBranding] = useState({
    brandColor: '#0f172a',
    useBrandColor: true,
    showLogoInHeader: true,
  })

  const { data: brandKitLogosData, isLoading: brandKitLogosLoading } = useQuery({
    queryKey: ['brand-kit-logos'],
    queryFn: async () => {
      const response = await fetch('/api/brand-kit/logos', { headers: getAuthHeaders() })
      if (!response.ok) throw new Error('Failed to fetch brand kit logos')
      return response.json() as Promise<{
        logos: Array<{
          id: string
          fileName: string
          fileUrl: string
          createdAt: string
          isPrimary: boolean
        }>
      }>
    },
  })

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings/tenant', { headers: getAuthHeaders() })
      if (!response.ok) throw new Error('Failed to fetch tenant settings')
      return response.json()
    },
  })

  const updateTenant = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await fetch('/api/settings/tenant', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to update settings')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] })
      setSuccess('Settings updated successfully!')
      setError('')
      setTimeout(() => setSuccess(''), 3000)
    },
  })

  const setPrimaryBrandKitLogo = useMutation({
    mutationFn: async (mediaLibraryId: string) => {
      const response = await fetch('/api/brand-kit/logos', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ mediaLibraryId }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to set primary logo')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-kit-logos'] })
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] })
      setSuccess('Primary brand logo updated!')
      setError('')
      setTimeout(() => setSuccess(''), 3000)
    },
  })

  const deleteBrandKitLogo = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/media-library/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to delete brand kit logo')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-kit-logos'] })
      setSuccess('Brand kit logo removed')
      setError('')
      setTimeout(() => setSuccess(''), 3000)
    },
  })

  const bulkDeleteBrandKitLogos = useMutation({
    mutationFn: async (ids: string[]) => {
      const responses = await Promise.all(
        ids.map((id) =>
          fetch(`/api/media-library/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
          })
        )
      )

      const failed = responses.filter((r) => !r.ok).length
      if (failed > 0) {
        throw new Error(`${failed} logo(s) could not be deleted`)
      }
      return { deleted: ids.length }
    },
    onSuccess: ({ deleted }) => {
      queryClient.invalidateQueries({ queryKey: ['brand-kit-logos'] })
      setSelectedBrandKitLogoIds([])
      setSuccess(`${deleted} brand kit logo(s) removed`)
      setError('')
      setTimeout(() => setSuccess(''), 3000)
    },
  })

  const handleDeleteBrandKitLogo = (logo: { id: string; isPrimary: boolean }) => {
    if (logo.isPrimary) {
      setError('Cannot delete the current primary logo. Set another logo as primary first.')
      setSuccess('')
      return
    }

    const shouldDelete = window.confirm('Delete this Brand Kit logo? This action cannot be undone.')
    if (!shouldDelete) return
    deleteBrandKitLogo.mutate(logo.id)
  }

  const filteredBrandKitLogos = (brandKitLogosData?.logos || [])
    .filter((logo) => {
      const query = brandKitSearch.trim().toLowerCase()
      if (!query) return true
      return (
        logo.fileName.toLowerCase().includes(query) ||
        logo.fileUrl.toLowerCase().includes(query)
      )
    })
    .sort((a, b) => {
      if (brandKitSort === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      if (brandKitSort === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      if (brandKitSort === 'name') {
        return a.fileName.localeCompare(b.fileName)
      }
      // primary: primary first, then newest
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const selectedVisibleCount = filteredBrandKitLogos.filter((logo) => selectedBrandKitLogoIds.includes(logo.id)).length
  const allVisibleSelected = filteredBrandKitLogos.length > 0 && selectedVisibleCount === filteredBrandKitLogos.length
  const primaryVisibleCount = filteredBrandKitLogos.filter((logo) => logo.isPrimary).length
  const candidateExportIds = exportAllFiltered
    ? filteredBrandKitLogos.map((logo) => logo.id)
    : selectedBrandKitLogoIds
  const selectedExportLogos = filteredBrandKitLogos.filter((logo) => candidateExportIds.includes(logo.id))
  const selectedPrimaryCount = selectedExportLogos.filter((logo) => logo.isPrimary).length
  const effectiveExportCount = Math.max(0, selectedExportLogos.length - (excludePrimaryFromExport ? selectedPrimaryCount : 0))

  const toggleSelectLogo = (id: string) => {
    setSelectedBrandKitLogoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(filteredBrandKitLogos.map((logo) => logo.id))
      setSelectedBrandKitLogoIds((prev) => prev.filter((id) => !visibleIds.has(id)))
      return
    }
    const merged = new Set([...selectedBrandKitLogoIds, ...filteredBrandKitLogos.map((logo) => logo.id)])
    setSelectedBrandKitLogoIds(Array.from(merged))
  }

  const clearSelectedLogos = () => {
    setSelectedBrandKitLogoIds([])
  }

  const handleDownloadSelectedLogos = () => {
    if (selectedBrandKitLogoIds.length === 0) return
    const selectedLogos = filteredBrandKitLogos.filter((logo) => selectedBrandKitLogoIds.includes(logo.id))
    if (selectedLogos.length === 0) {
      setError('No selected logos are visible for download.')
      setSuccess('')
      return
    }

    // Browser-safe fallback: trigger one download per selected item.
    // Some browsers may limit many auto-downloads; users can retry with smaller batches.
    selectedLogos.forEach((logo, idx) => {
      window.setTimeout(() => {
        const a = document.createElement('a')
        a.href = logo.fileUrl
        a.download = logo.fileName || `brand-kit-logo-${logo.id}.svg`
        a.rel = 'noopener noreferrer'
        a.click()
      }, idx * 120)
    })

    setSuccess(`Started download for ${selectedLogos.length} selected logo(s).`)
    setError('')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleExportBundle = async () => {
    const idsToExport = exportAllFiltered
      ? filteredBrandKitLogos.map((logo) => logo.id)
      : selectedBrandKitLogoIds
    if (idsToExport.length === 0) return
    try {
      const response = await fetch('/api/brand-kit/logos/export', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          mediaLibraryIds: idsToExport,
          excludePrimary: excludePrimaryFromExport,
        }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to export bundle')
      }

      const blob = await response.blob()
      const contentDisposition = response.headers.get('Content-Disposition') || ''
      const match = /filename="([^"]+)"/i.exec(contentDisposition)
      const filename = match?.[1] || `brand-kit-logos-${Date.now()}.zip`
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      window.URL.revokeObjectURL(url)
      setSuccess(
        exportAllFiltered
          ? `Exported bundle for ${idsToExport.length} filtered logo(s)${excludePrimaryFromExport ? ' (excluding primary).' : '.'}`
          : `Exported bundle for ${idsToExport.length} selected logo(s)${excludePrimaryFromExport ? ' (excluding primary).' : '.'}`
      )
      setError('')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export bundle')
      setSuccess('')
    }
  }

  const handleBulkDeleteSelectedLogos = () => {
    if (selectedBrandKitLogoIds.length === 0) return
    const selectedLogos = filteredBrandKitLogos.filter((logo) => selectedBrandKitLogoIds.includes(logo.id))
    const primarySelected = selectedLogos.filter((logo) => logo.isPrimary)
    const deletable = selectedLogos.filter((logo) => !logo.isPrimary).map((logo) => logo.id)

    if (primarySelected.length > 0 && deletable.length === 0) {
      setError('Cannot delete selected logos because they are primary. Set another logo as primary first.')
      setSuccess('')
      return
    }

    const message =
      primarySelected.length > 0
        ? `Delete ${deletable.length} selected logo(s)? ${primarySelected.length} primary logo(s) will be skipped.`
        : `Delete ${deletable.length} selected logo(s)? This action cannot be undone.`

    const shouldDelete = window.confirm(message)
    if (!shouldDelete) return

    if (deletable.length > 0) {
      bulkDeleteBrandKitLogos.mutate(deletable)
    } else {
      setError('No deletable logos selected.')
      setSuccess('')
    }
  }

  useEffect(() => {
    if (tenant) {
      const timeoutId = globalThis.setTimeout(() => {
        setFormData({
          name: tenant.name || '',
          industry: tenant.industry || '',
          industrySubType: tenant.industrySubType || '',
          gstin: tenant.gstin || '',
          address: tenant.address || '',
          city: tenant.city || '',
          state: tenant.state || '',
          postalCode: tenant.postalCode || '',
          country: tenant.country || 'India',
          phone: tenant.phone || '',
          email: tenant.email || '',
          website: tenant.website || '',
          logo: tenant.logo || '',
          productsServices: tenant.businessProfile?.productsServices || '',
          targetCustomers: tenant.businessProfile?.targetCustomers || '',
          cityRegion: tenant.businessProfile?.cityRegion || '',
          brandTone: tenant.businessProfile?.brandTone || '',
          coreOfferings: tenant.businessProfile?.coreOfferings || '',
          whatsappNumber: tenant.businessProfile?.whatsappNumber || '',
        })
      }, 0)
      return () => globalThis.clearTimeout(timeoutId)
    }
  }, [tenant])

  useEffect(() => {
    try {
      const key = `payaid:workspaceBranding:${tenant?.id || 'tenant'}`
      const raw = localStorage.getItem(key)
      if (!raw) return
      const parsed = JSON.parse(raw) as Partial<typeof branding>
      const applyId = window.setTimeout(() => {
        setBranding((p) => ({ ...p, ...parsed }))
      }, 0)
      return () => window.clearTimeout(applyId)
    } catch {
      // ignore
    }
  }, [tenant?.id])

  useEffect(() => {
    try {
      const key = `payaid:workspaceBranding:${tenant?.id || 'tenant'}`
      localStorage.setItem(key, JSON.stringify(branding))
    } catch {
      // ignore
    }
  }, [branding, tenant?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      const payload = {
        name: formData.name,
        industry: formData.industry,
        industrySubType: formData.industrySubType,
        gstin: formData.gstin,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        logo: formData.logo,
        businessProfile: {
          productsServices: formData.productsServices,
          targetCustomers: formData.targetCustomers,
          cityRegion: formData.cityRegion,
          brandTone: formData.brandTone,
          coreOfferings: formData.coreOfferings,
          whatsappNumber: formData.whatsappNumber,
        },
      }
      await updateTenant.mutateAsync(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  if (isLoading) return <div className="flex items-center justify-center h-64">Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Workspace</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Business information for invoices and documents</p>
      </div>

      {tenant?.id && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">Organization ID</CardTitle>
            <CardDescription>Share with support for assistance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <code className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-mono text-slate-800 dark:text-slate-200">{tenant.id}</code>
              <CopyAction
                textToCopy={tenant.id}
                successMessage="Organization ID copied to clipboard."
                label="Copy"
                copiedLabel="Copied"
                buttonProps={{ variant: 'outline', size: 'sm', className: 'shrink-0' }}
                {...COPY_ACTION_PRESETS.compactSettingsLongCopy}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Workspace branding</CardTitle>
          <CardDescription>Logo and accent color used across the app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
              {formData.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={formData.logo} alt="Logo preview" className="h-full w-full object-contain" />
              ) : (
                <span className="text-xs text-slate-400">Logo</span>
              )}
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Brand color</div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={branding.brandColor}
                    onChange={(e) => setBranding((p) => ({ ...p, brandColor: e.target.value }))}
                    className="h-10 w-14 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent p-1"
                    aria-label="Brand color"
                  />
                  <Input
                    value={branding.brandColor}
                    onChange={(e) => setBranding((p) => ({ ...p, brandColor: e.target.value }))}
                    placeholder="#0f172a"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Use brand color accents</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Buttons, highlights, and charts</div>
                  </div>
                  <Switch checked={branding.useBrandColor} onCheckedChange={(v) => setBranding((p) => ({ ...p, useBrandColor: v }))} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Show logo in header</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Module top bar branding</div>
                  </div>
                  <Switch checked={branding.showLogoInHeader} onCheckedChange={(v) => setBranding((p) => ({ ...p, showLogoInHeader: v }))} />
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Branding preferences are saved locally per browser for now.
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Brand Kit Logos</CardTitle>
          <CardDescription>
            Reusable logo assets saved from the Logo Generator.{' '}
            {tenant?.id ? (
              <Link href={`/ai-studio/${tenant.id}/Logos`} className="text-violet-600 hover:underline font-medium">
                Open Logo Generator
              </Link>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="md:col-span-2">
                <Input
                  value={brandKitSearch}
                  onChange={(e) => setBrandKitSearch(e.target.value)}
                  placeholder="Search logos by file name..."
                />
              </div>
              <select
                value={brandKitSort}
                onChange={(e) => setBrandKitSort(e.target.value as 'newest' | 'oldest' | 'primary' | 'name')}
                className="h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                aria-label="Sort brand kit logos"
              >
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="primary">Sort: Primary first</option>
                <option value="name">Sort: Name A-Z</option>
              </select>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                {filteredBrandKitLogos.length} of {(brandKitLogosData?.logos || []).length} logos
              </p>
              <div className="inline-flex rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setBrandKitView('list')}
                  className={`px-2.5 py-1 text-xs ${
                    brandKitView === 'list'
                      ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200'
                      : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setBrandKitView('grid')}
                  className={`px-2.5 py-1 text-xs border-l border-slate-200 dark:border-slate-700 ${
                    brandKitView === 'grid'
                      ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200'
                      : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  Grid
                </button>
              </div>
            </div>
            {filteredBrandKitLogos.length > 0 ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={toggleSelectAllVisible}>
                  {allVisibleSelected ? 'Unselect Visible' : 'Select Visible'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={clearSelectedLogos} disabled={selectedBrandKitLogoIds.length === 0}>
                  Clear Selection
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={selectedBrandKitLogoIds.length === 0}
                  onClick={handleDownloadSelectedLogos}
                >
                  Download Selected ({selectedBrandKitLogoIds.length})
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={
                    (exportAllFiltered
                      ? filteredBrandKitLogos.length === 0
                      : selectedBrandKitLogoIds.length === 0) || effectiveExportCount === 0
                  }
                  onClick={handleExportBundle}
                >
                  {exportAllFiltered
                    ? `Export Filtered (${filteredBrandKitLogos.length})`
                    : 'Export Bundle (.zip)'}
                </Button>
                <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 ml-1">
                  <input
                    type="checkbox"
                    checked={exportAllFiltered}
                    onChange={(e) => setExportAllFiltered(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Export all filtered
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 ml-1">
                  <input
                    type="checkbox"
                    checked={excludePrimaryFromExport}
                    onChange={(e) => setExcludePrimaryFromExport(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Exclude primary logo
                </label>
                <div className="w-full text-xs text-slate-500 mt-1">
                  Export preview: {effectiveExportCount} logo(s)
                  {excludePrimaryFromExport
                    ? ` (${selectedPrimaryCount} primary logo(s) excluded from ${selectedExportLogos.length} candidate logo(s))`
                    : ` from ${selectedExportLogos.length} candidate logo(s)`}
                  {exportAllFiltered ? `, using filtered set (${filteredBrandKitLogos.length} visible)` : `, using selected set (${selectedBrandKitLogoIds.length} selected)`}
                  {primaryVisibleCount > 0 ? ` · ${primaryVisibleCount} primary visible` : ''}
                </div>
                {effectiveExportCount === 0 ? (
                  <div className="w-full text-xs text-amber-600 dark:text-amber-400">
                    Nothing to export: all candidate logos are excluded (typically due to primary-exclusion settings) or no valid candidates are selected.
                  </div>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={selectedBrandKitLogoIds.length === 0 || bulkDeleteBrandKitLogos.isPending}
                  onClick={handleBulkDeleteSelectedLogos}
                >
                  {bulkDeleteBrandKitLogos.isPending ? 'Deleting...' : `Delete Selected (${selectedBrandKitLogoIds.length})`}
                </Button>
              </div>
            ) : null}
          </div>

          {brandKitLogosLoading ? (
            <div className="text-sm text-slate-500">Loading brand kit logos...</div>
          ) : !brandKitLogosData?.logos?.length ? (
            <div className="space-y-3">
              <div className="text-sm text-slate-500">
                No Brand Kit logos yet. Create one in AI Studio {'>'} Logo Generator with "Save to Brand Kit Library" enabled.
              </div>
              {tenant?.id ? (
                <Link href={`/ai-studio/${tenant.id}/Logos`}>
                  <Button type="button" size="sm">
                    Create Logo Now
                  </Button>
                </Link>
              ) : null}
            </div>
          ) : filteredBrandKitLogos.length === 0 ? (
            <div className="text-sm text-slate-500">
              No logos match “{brandKitSearch}”. Try a different search term.
            </div>
          ) : brandKitView === 'list' ? (
            <div className="space-y-3">
              {filteredBrandKitLogos.map((logo) => (
                <div
                  key={logo.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedBrandKitLogoIds.includes(logo.id)}
                      onChange={() => toggleSelectLogo(logo.id)}
                      className="h-4 w-4 rounded border-slate-300"
                      aria-label={`Select ${logo.fileName}`}
                    />
                    <div className="h-12 w-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logo.fileUrl} alt={logo.fileName} className="h-full w-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{logo.fileName}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        {new Date(logo.createdAt).toLocaleString()}
                        {logo.isPrimary ? (
                          <span className="inline-flex items-center rounded-full bg-violet-100 text-violet-700 px-2 py-0.5 text-[10px] font-semibold dark:bg-violet-900/40 dark:text-violet-200">
                            Primary
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant={logo.isPrimary ? 'default' : 'outline'}
                      size="sm"
                      disabled={logo.isPrimary || setPrimaryBrandKitLogo.isPending}
                      onClick={() => setPrimaryBrandKitLogo.mutate(logo.id)}
                    >
                      {logo.isPrimary ? 'Primary' : 'Set Primary'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={deleteBrandKitLogo.isPending || logo.isPrimary}
                      onClick={() => handleDeleteBrandKitLogo(logo)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredBrandKitLogos.map((logo) => (
                <div
                  key={logo.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-900"
                >
                  <div className="mb-2">
                    <input
                      type="checkbox"
                      checked={selectedBrandKitLogoIds.includes(logo.id)}
                      onChange={() => toggleSelectLogo(logo.id)}
                      className="h-4 w-4 rounded border-slate-300"
                      aria-label={`Select ${logo.fileName}`}
                    />
                  </div>
                  <div className="aspect-square rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logo.fileUrl} alt={logo.fileName} className="h-full w-full object-contain" />
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{logo.fileName}</p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    {new Date(logo.createdAt).toLocaleDateString()}
                    {logo.isPrimary ? (
                      <span className="inline-flex items-center rounded-full bg-violet-100 text-violet-700 px-2 py-0.5 text-[10px] font-semibold dark:bg-violet-900/40 dark:text-violet-200">
                        Primary
                      </span>
                    ) : null}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      type="button"
                      variant={logo.isPrimary ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      disabled={logo.isPrimary || setPrimaryBrandKitLogo.isPending}
                      onClick={() => setPrimaryBrandKitLogo.mutate(logo.id)}
                    >
                      {logo.isPrimary ? 'Primary' : 'Set Primary'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={deleteBrandKitLogo.isPending || logo.isPrimary}
                      onClick={() => handleDeleteBrandKitLogo(logo)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Business Information</CardTitle>
          <CardDescription>Used in invoices and official documents</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">{error}</div>}
            {success && <div className="p-3 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">{success}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">Business Name *</label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required disabled={updateTenant.isPending} />
              </div>
              <div className="space-y-2">
                <label htmlFor="industry" className="text-sm font-medium text-slate-700 dark:text-slate-300">Industry</label>
                <Input id="industry" name="industry" value={formData.industry} onChange={handleChange} placeholder="Retail, Manufacturing, Services, etc." disabled={updateTenant.isPending} />
              </div>
              <div className="space-y-2">
                <label htmlFor="industrySubType" className="text-sm font-medium text-slate-700 dark:text-slate-300">Business Type</label>
                <Input id="industrySubType" name="industrySubType" value={formData.industrySubType} onChange={handleChange} placeholder="Distributor, Salon, Clinic, etc." disabled={updateTenant.isPending} />
              </div>
              <div className="space-y-2">
                <label htmlFor="gstin" className="text-sm font-medium text-slate-700 dark:text-slate-300">GSTIN</label>
                <Input id="gstin" name="gstin" value={formData.gstin} onChange={handleChange} placeholder="15-digit GSTIN" maxLength={15} disabled={updateTenant.isPending} />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} disabled={updateTenant.isPending} />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} disabled={updateTenant.isPending} />
              </div>
              <div className="space-y-2">
                <label htmlFor="website" className="text-sm font-medium text-slate-700 dark:text-slate-300">Website</label>
                <Input id="website" name="website" type="url" value={formData.website} onChange={handleChange} placeholder="https://example.com" disabled={updateTenant.isPending} />
              </div>
              <div className="space-y-2">
                <label htmlFor="logo" className="text-sm font-medium text-slate-700 dark:text-slate-300">Logo URL</label>
                <Input id="logo" name="logo" type="url" value={formData.logo} onChange={handleChange} disabled={updateTenant.isPending} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="productsServices" className="text-sm font-medium text-slate-700 dark:text-slate-300">What do you sell? (products/services)</label>
                <textarea id="productsServices" name="productsServices" value={formData.productsServices} onChange={handleChange} rows={3} className="flex w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100" placeholder="Example: GST filing services, salon packages, custom furniture, etc." disabled={updateTenant.isPending} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="coreOfferings" className="text-sm font-medium text-slate-700 dark:text-slate-300">Core offerings</label>
                <textarea id="coreOfferings" name="coreOfferings" value={formData.coreOfferings} onChange={handleChange} rows={2} className="flex w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100" placeholder="Top 3-5 offerings you want AI to prioritize" disabled={updateTenant.isPending} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="targetCustomers" className="text-sm font-medium text-slate-700 dark:text-slate-300">Target customers</label>
                <textarea id="targetCustomers" name="targetCustomers" value={formData.targetCustomers} onChange={handleChange} rows={2} className="flex w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100" placeholder="Example: local SMB owners, urban families, students, etc." disabled={updateTenant.isPending} />
              </div>
              <div className="space-y-2">
                <label htmlFor="cityRegion" className="text-sm font-medium text-slate-700 dark:text-slate-300">City/region focus</label>
                <Input id="cityRegion" name="cityRegion" value={formData.cityRegion} onChange={handleChange} placeholder="Hyderabad, Telangana" disabled={updateTenant.isPending} />
              </div>
              <div className="space-y-2">
                <label htmlFor="whatsappNumber" className="text-sm font-medium text-slate-700 dark:text-slate-300">WhatsApp number</label>
                <Input id="whatsappNumber" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} placeholder="+91..." disabled={updateTenant.isPending} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="brandTone" className="text-sm font-medium text-slate-700 dark:text-slate-300">Brand tone/style</label>
                <Input id="brandTone" name="brandTone" value={formData.brandTone} onChange={handleChange} placeholder="Professional, friendly, premium, etc." disabled={updateTenant.isPending} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="address" className="text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
                <Input id="address" name="address" value={formData.address} onChange={handleChange} disabled={updateTenant.isPending} />
              </div>
              <div className="space-y-2">
                <label htmlFor="city" className="text-sm font-medium text-slate-700 dark:text-slate-300">City</label>
                <Input id="city" name="city" value={formData.city} onChange={handleChange} disabled={updateTenant.isPending} />
              </div>
              <div className="space-y-2">
                <label htmlFor="state" className="text-sm font-medium text-slate-700 dark:text-slate-300">State</label>
                <select id="state" name="state" value={formData.state} onChange={handleChange} className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100" disabled={updateTenant.isPending}>
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s.code} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="postalCode" className="text-sm font-medium text-slate-700 dark:text-slate-300">Postal Code</label>
                <Input id="postalCode" name="postalCode" value={formData.postalCode} onChange={handleChange} maxLength={6} disabled={updateTenant.isPending} />
              </div>
              <div className="space-y-2">
                <label htmlFor="country" className="text-sm font-medium text-slate-700 dark:text-slate-300">Country</label>
                <Input id="country" name="country" value={formData.country} onChange={handleChange} disabled={updateTenant.isPending} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={updateTenant.isPending}>{updateTenant.isPending ? 'Saving...' : 'Save Settings'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
