'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { getAuthHeaders } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Plus, Play, Pencil, Trash2, Calendar, MousePointer, Hash } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface WorkflowListItem {
  id: string
  name: string
  description: string | null
  triggerType: string
  triggerEvent: string | null
  triggerSchedule: string | null
  isActive: boolean
  stepsCount: number
  executionsCount: number
  updatedAt: string
}

export default function WorkflowsPage() {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const res = await fetch('/api/workflows', { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Failed to load workflows')
      const json = await res.json()
      return json.workflows as WorkflowListItem[]
    },
  })

  const handleRun = async (id: string) => {
    try {
      const res = await fetch(`/api/workflows/${id}/run`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ data: {} }),
      })
      const json = await res.json()
      if (res.ok) {
        alert(`Run ${json.status}. Execution ID: ${json.executionId}`)
        refetch()
      } else {
        alert(json.error || 'Run failed')
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Run failed')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete workflow "${name}"?`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (res.ok) refetch()
      else {
        const json = await res.json()
        alert(json.error || 'Delete failed')
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  const triggerLabel = (w: WorkflowListItem) => {
    if (w.triggerType === 'EVENT' && w.triggerEvent) return w.triggerEvent
    if (w.triggerType === 'SCHEDULE' && w.triggerSchedule) return w.triggerSchedule
    if (w.triggerType === 'MANUAL') return 'Manual'
    return w.triggerType
  }

  const triggerIcon = (w: WorkflowListItem) => {
    if (w.triggerType === 'SCHEDULE') return <Calendar className="h-4 w-4" />
    if (w.triggerType === 'MANUAL') return <MousePointer className="h-4 w-4" />
    return <Hash className="h-4 w-4" />
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="h-7 w-7 text-purple-600" />
            Workflow automation
          </h1>
          <p className="text-gray-600 mt-1">
            Automate actions when something happens: new lead, invoice overdue, form submitted, and more.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/workflows/new">
            <Plus className="h-4 w-4 mr-2" />
            New workflow
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Loading workflows…
          </CardContent>
        </Card>
      ) : !data?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>No workflows yet</CardTitle>
            <CardDescription>
              Create your first workflow to send emails, create tasks, or call webhooks when events happen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/workflows/new">
                <Plus className="h-4 w-4 mr-2" />
                Create workflow
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {data.map((w) => (
            <Card key={w.id} className="overflow-hidden">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{w.name}</span>
                    {!w.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600">
                        Paused
                      </span>
                    )}
                  </div>
                  {w.description && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xl">{w.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      {triggerIcon(w)}
                      {triggerLabel(w)}
                    </span>
                    <span>·</span>
                    <span>{w.stepsCount} step{w.stepsCount !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>{w.executionsCount} run{w.executionsCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRun(w.id)}
                    disabled={!w.isActive}
                    title="Run now"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/workflows/${w.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(w.id, w.name)}
                    disabled={deletingId === w.id}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
