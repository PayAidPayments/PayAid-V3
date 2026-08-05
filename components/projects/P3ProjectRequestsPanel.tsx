'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAuthHeaders } from '@/lib/api/client'

type ProductStatus = 'planning' | 'active' | 'completed' | 'cancelled'

type SliceProject = {
  id: string
  name: string
  code?: string | null
  status: ProductStatus
  dbStatus?: string
  clientId?: string | null
  notes?: string | null
  createdAt?: string
}

const NEXT: Record<ProductStatus, ProductStatus[]> = {
  planning: ['active', 'cancelled'],
  active: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

/**
 * Thin Projects delivery operator panel — uses proven `/api/projects/slice` only.
 * Authorized after hub probe found the main projects list API 500 on Ready.
 */
export function P3ProjectRequestsPanel() {
  const [projects, setProjects] = useState<SliceProject[]>([])
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    const res = await fetch('/api/projects/slice?limit=50', { headers: getAuthHeaders() })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(json?.error || `List failed (${res.status})`)
      return
    }
    setProjects(Array.isArray(json.projects) ? json.projects : [])
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function createProject() {
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const res = await fetch('/api/projects/slice', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error || `Create failed (${res.status})`)
        return
      }
      setName('')
      setNotes('')
      setInfo(`Created ${json.project?.name || 'project'} (${json.project?.status})`)
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function setStatus(projectId: string, status: ProductStatus) {
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const res = await fetch('/api/projects/slice', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', projectId, status }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error || `Status failed (${res.status})`)
        return
      }
      setInfo(`Updated to ${json.project?.status}`)
      await load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6" data-testid="p3-projects-requests-panel">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projects delivery requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Thin operator loop on <code>/api/projects/slice</code> — planning → active → completed|cancelled.
          No Gantt / full PM rebuild.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h2 className="text-sm font-medium">Create planning project</h2>
        <Input
          placeholder="Project name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
        />
        <Input
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={busy}
        />
        <Button onClick={() => void createProject()} disabled={busy}>
          {busy ? 'Please wait…' : 'Create project'}
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      ) : null}
      {info ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {info}
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Projects ({projects.length})</h2>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={busy}>
            Refresh
          </Button>
        </div>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No slice projects yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {projects.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium">
                    {p.name}{' '}
                    {p.code ? <span className="text-xs text-muted-foreground">({p.code})</span> : null}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    status: {p.status}
                    {p.dbStatus ? ` · db: ${p.dbStatus}` : ''}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {NEXT[p.status].map((s) => (
                    <Button key={s} size="sm" variant="secondary" disabled={busy} onClick={() => void setStatus(p.id, s)}>
                      → {s}
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

export default P3ProjectRequestsPanel
