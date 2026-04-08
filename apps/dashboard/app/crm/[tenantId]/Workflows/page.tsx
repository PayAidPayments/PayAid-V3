'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PlayCircle, Workflow } from 'lucide-react'

type WorkflowItem = {
  workflow_id: string
  name: string
  status: 'draft' | 'published'
  trigger: { event_type: string }
  created_at: string
}

export default function CRMWorkflowsPage() {
  const { token } = useAuthStore()
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('High intent lead follow-up')
  const [eventType, setEventType] = useState('lead.intent_detected')

  const newWorkflowPayload = useMemo(
    () => ({
      schema_version: '1.0',
      name,
      status: 'draft',
      trigger: { event_type: eventType },
      conditions: [{ field: 'intent_score', op: '>=', value: 70 }],
      actions: [
        { type: 'sequence.enroll', params: { sequence_id: 'default-sequence' } },
        { type: 'task.create', params: { title: 'Call in 2h' } },
      ],
      safety: { cooldown_minutes: 120, max_actions_per_day: 3 },
    }),
    [name, eventType]
  )

  async function loadWorkflows() {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/v1/workflows', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!response.ok) throw new Error('Failed to fetch workflows')
      const body = await response.json()
      setWorkflows(Array.isArray(body.workflows) ? body.workflows : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workflows')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) void loadWorkflows()
  }, [token])

  async function createWorkflow() {
    try {
      setCreating(true)
      setError(null)
      const idempotencyKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? `wf:create:${crypto.randomUUID()}`
          : `wf:create:${Date.now()}`
      const response = await fetch('/api/v1/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-idempotency-key': idempotencyKey,
        },
        body: JSON.stringify(newWorkflowPayload),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to create workflow')
      }
      await loadWorkflows()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow')
    } finally {
      setCreating(false)
    }
  }

  async function publishWorkflow(id: string) {
    try {
      setPublishingId(id)
      setError(null)
      const idempotencyKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? `wf:publish:${id}:${crypto.randomUUID()}`
          : `wf:publish:${id}:${Date.now()}`
      const response = await fetch(`/api/v1/workflows/${id}/publish`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-idempotency-key': idempotencyKey,
        },
      })
      if (!response.ok) throw new Error('Failed to publish workflow')
      await loadWorkflows()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish workflow')
    } finally {
      setPublishingId(null)
    }
  }

  async function testRunWorkflow(id: string) {
    try {
      setTestingId(id)
      setError(null)
      const idempotencyKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? `wf:test-run:${id}:${crypto.randomUUID()}`
          : `wf:test-run:${id}:${Date.now()}`
      const response = await fetch(`/api/v1/workflows/${id}/test-run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-idempotency-key': idempotencyKey,
        },
        body: JSON.stringify({ reason: 'manual-test' }),
      })
      if (!response.ok) throw new Error('Test run failed')
      await loadWorkflows()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test run failed')
    } finally {
      setTestingId(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Workflows</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Trigger-condition-action orchestration for CRM execution.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-page-ai'))}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
        >
          Ask PayAid AI about workflow performance
        </button>
      </div>

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Create Workflow</CardTitle>
          <CardDescription>Start with a draft and publish after validation.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Workflow name" />
          <Input value={eventType} onChange={(e) => setEventType(e.target.value)} placeholder="Trigger event" />
          <Button
            onClick={createWorkflow}
            disabled={creating}
            title={creating ? 'Please wait' : 'Create draft workflow'}
          >
            {creating ? 'Creating…' : 'Create Draft'}
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Workflow Registry</CardTitle>
            <CardDescription>Publish or dry-run workflows before full rollout.</CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={loadWorkflows}
            disabled={loading}
            title={loading ? 'Please wait' : 'Refresh workflows'}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-700 px-4 py-8 text-center">
              <Workflow className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400">No workflows yet. Create a draft to start orchestration.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workflows.map((workflow) => (
                <div
                  key={workflow.workflow_id}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-700 p-4 hover:shadow-md hover:-translate-y-[1px] transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{workflow.name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Trigger: {workflow.trigger?.event_type || 'N/A'} · Created {new Date(workflow.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {workflow.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={testingId === workflow.workflow_id || publishingId === workflow.workflow_id}
                        onClick={() => void testRunWorkflow(workflow.workflow_id)}
                        title={
                          testingId === workflow.workflow_id
                            ? 'Please wait'
                            : publishingId === workflow.workflow_id
                              ? 'Please wait'
                              : 'Dry-run workflow (no side effects)'
                        }
                      >
                        <PlayCircle className="w-3.5 h-3.5 mr-1.5" />
                        {testingId === workflow.workflow_id ? 'Running…' : 'Test Run'}
                      </Button>
                      {workflow.status !== 'published' ? (
                        <Button
                          size="sm"
                          disabled={publishingId === workflow.workflow_id || testingId === workflow.workflow_id}
                          onClick={() => void publishWorkflow(workflow.workflow_id)}
                          title={publishingId === workflow.workflow_id ? 'Please wait' : 'Publish workflow'}
                        >
                          {publishingId === workflow.workflow_id ? 'Publishing…' : 'Publish'}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
