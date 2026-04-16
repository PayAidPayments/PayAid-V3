'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [branding, setBranding] = useState({
    brandColor: '#0f172a',
    useBrandColor: true,
    showLogoInHeader: true,
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
    mutationFn: async (data: Record<string, string>) => {
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

  useEffect(() => {
    if (tenant) {
      const timeoutId = globalThis.setTimeout(() => {
        setFormData({
          name: tenant.name || '',
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
      await updateTenant.mutateAsync(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
