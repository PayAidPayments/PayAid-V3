'use client'

/**
 * P3 Projects delivery thin operator surface.
 * Uses /api/projects/slice only — no full PM rebuild.
 */
import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/loading'
import { Plus, RefreshCw } from 'lucide-react'

type ProductStatus = 'planning' | 'active' | 'completed' | 'cancelled'

interface SliceProject {
  id: string
  name: string
  code?: string | null
  status: ProductStatus
  dbStatus?: string
  clientId?: string | null
  progress?: number
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    planning: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    active: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
  return map[status] || map.planning
}

function nextActions(status: ProductStatus): ProductStatus[] {
  if (status === 'planning') return ['active', 'cancelled']
  if (status === 'active') return ['completed', 'cancelled']
  return []
}

export function P3ProjectRequestsPanel({ clientId }: { clientId?: string }) {
  const { token } = useAuthStore()
  const [items, setItems] = useState<SliceProject[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const q = new URLSearchParams({ limit: '50' })
      if (clientId) q.set('clientId', clientId)
      const res = await fetch(`/api/projects/slice?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Load failed (${res.status})`)
      setItems(Array.isArray(data.projects) ? data.projects : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [token, clientId])

  useEffect(() => {
    void load()
  }, [load])

  const createProject = async () => {
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      if (!name.trim() && !clientId) throw new Error('Project name is required')
      const body: Record<string, unknown> = {
        name: name.trim() || undefined,
        notes: 'P3 thin UI project',
      }
      if (clientId) body.clientId = clientId
      const res = await fetch('/api/projects/slice', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Create failed (${res.status})`)
      setName('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  const setStatus = async (projectId: string, status: ProductStatus) => {
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/projects/slice', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'status', projectId, status }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Status update failed (${res.status})`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Status update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">New project</h2>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
              Delivery thin loop — planning → active → completed|cancelled. No full PM rebuild.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading || saving}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
        </div>

        <label className="text-xs text-slate-600 dark:text-gray-300 space-y-1 block max-w-md">
          <span>Project name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
            placeholder="Website redesign"
          />
        </label>

        <Button onClick={() => void createProject()} disabled={saving || loading}>
          <Plus className="w-4 h-4 mr-1" />
          Create planning
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100 mb-4">Projects</h2>
        {loading ? (
          <PageLoading message="Loading projects..." fullScreen={false} />
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-gray-400">No projects yet.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-200 dark:border-gray-700 px-4 py-3"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900 dark:text-gray-100">{item.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                    {item.code || item.id.slice(0, 8)}
                    {typeof item.progress === 'number' ? ` · ${item.progress}%` : ''}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {nextActions(item.status).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant="outline"
                      disabled={saving}
                      onClick={() => void setStatus(item.id, s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
