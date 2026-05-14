'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/lib/stores/auth'
import { LeadIntelligenceM1StepIndicator } from '@/components/lead-intelligence/LeadIntelligenceM1StepIndicator'
import { useLeadIntelligenceM1Progress } from '@/components/lead-intelligence/useLeadIntelligenceM1Progress'

type ListMode = 'active' | 'archived'

type SavedSearch = {
  id: string
  name: string
  query: string
  industry: string
  country: string
  resultCount: number
  status: string
  updatedAt: string
}

export default function LeadIntelligenceSavedSearchesPage() {
  const tenantId = String(useParams()?.tenantId || '')
  const searchParams = useSearchParams()
  const token = useAuthStore((s) => s.token)
  const [items, setItems] = useState<SavedSearch[]>([])
  const [listMode, setListMode] = useState<ListMode>('active')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [patchingId, setPatchingId] = useState<string | null>(null)
  const { completedSteps, markCompleted, resetProgress } = useLeadIntelligenceM1Progress(tenantId)
  const q = searchParams.get('q') ?? ''
  const industry = searchParams.get('industry') ?? ''
  const country = searchParams.get('country') ?? ''
  const resultCount = Number(searchParams.get('resultCount') || '0')

  const canSave = useMemo(() => name.trim().length > 1, [name])

  async function loadSavedSearches(mode: ListMode = listMode) {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const qs = mode === 'archived' ? '?status=archived' : ''
      const response = await fetch(`/api/lead-intelligence/saved-searches${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to load saved searches')
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load saved searches')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSavedSearches(listMode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, listMode])

  useEffect(() => {
    if (q || industry || country) markCompleted('search')
    if ((Number.isFinite(resultCount) ? resultCount : 0) > 0) markCompleted('companies')
    if (items.length > 0) markCompleted('saved-searches')
  }, [q, industry, country, resultCount, items.length, markCompleted])

  async function saveCurrentSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!token || !canSave) return
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/lead-intelligence/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), q, industry, country, resultCount }),
      })
      const data = await response.json()
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Failed to save search')
      setName('')
      markCompleted('saved-searches')
      setListMode('active')
      await loadSavedSearches('active')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save search')
    } finally {
      setSaving(false)
    }
  }

  async function deleteSavedSearch(id: string) {
    if (!token) return
    try {
      const response = await fetch(`/api/lead-intelligence/saved-searches/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Delete failed')
      await loadSavedSearches(listMode)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete saved search')
    }
  }

  async function patchSavedSearch(id: string, body: Record<string, unknown>) {
    if (!token) return
    setPatchingId(id)
    setError('')
    try {
      const response = await fetch(`/api/lead-intelligence/saved-searches/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!response.ok || !data?.ok) throw new Error(data?.error || 'Update failed')
      setEditingId(null)
      await loadSavedSearches(listMode)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update saved search')
    } finally {
      setPatchingId(null)
    }
  }

  function startRename(item: SavedSearch) {
    setEditingId(item.id)
    setEditName(item.name)
  }

  async function submitRename(id: string) {
    const trimmed = editName.trim()
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters')
      return
    }
    await patchSavedSearch(id, { name: trimmed })
  }

  return (
    <div className="max-w-5xl space-y-6">
      <LeadIntelligenceM1StepIndicator
        tenantId={tenantId}
        currentStep="saved-searches"
        completedSteps={completedSteps}
        onResetProgress={resetProgress}
      />
      <Card>
        <CardHeader>
          <CardTitle>Step 3: Save and reuse searches</CardTitle>
          <CardDescription>Store reusable discovery filters, then reopen them for review or export.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={saveCurrentSearch} className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="name">Saved search name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. India manufacturing accounts" />
            </div>
            <div className="md:col-span-2 flex items-end">
              <Button type="submit" disabled={!canSave || saving} className="w-full">
                {saving ? 'Saving...' : 'Save current filters'}
              </Button>
            </div>
            <p className="md:col-span-4 text-xs text-muted-foreground">
              Current filters: q={q || '-'}, industry={industry || '-'}, country={country || '-'}, results={Number.isFinite(resultCount) ? resultCount : 0}
            </p>
          </form>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle>Saved searches list</CardTitle>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={listMode === 'active' ? 'default' : 'outline'}
              onClick={() => setListMode('active')}
            >
              Active
            </Button>
            <Button
              type="button"
              size="sm"
              variant={listMode === 'archived' ? 'default' : 'outline'}
              onClick={() => setListMode('archived')}
            >
              Archived
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading saved searches...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {listMode === 'archived' ? 'No archived saved searches.' : 'No saved searches yet.'}
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const params = new URLSearchParams()
                if (item.query) params.set('q', item.query)
                if (item.industry) params.set('industry', item.industry)
                if (item.country) params.set('country', item.country)
                const busy = patchingId === item.id
                return (
                  <div key={item.id} className="border rounded-md p-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {editingId === item.id ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            className="max-w-xs"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            disabled={busy}
                            aria-label="Rename saved search"
                          />
                          <Button type="button" size="sm" disabled={busy} onClick={() => submitRename(item.id)}>
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            q={item.query || '-'} | industry={item.industry || '-'} | country={item.country || '-'} | results={item.resultCount}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/lead-intelligence/${tenantId}/companies?${params.toString()}`}>Open Step 2</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/lead-intelligence/${tenantId}/exports?${params.toString()}`}>Open Step 4</Link>
                      </Button>
                      {listMode === 'active' ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={busy || editingId === item.id}
                            onClick={() => startRename(item)}
                          >
                            Rename
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy || editingId === item.id}
                            onClick={() => patchSavedSearch(item.id, { archived: true })}
                          >
                            Archive
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => patchSavedSearch(item.id, { archived: false })}
                        >
                          Restore
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busy || editingId === item.id}
                        onClick={() => deleteSavedSearch(item.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
