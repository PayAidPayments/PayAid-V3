'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageLoading } from '@/components/ui/loading'
import Link from 'next/link'
import { ArrowLeft, Save, Play, Loader2 } from 'lucide-react'
import { useState } from 'react'

const TRIGGER_TYPES = [
  { value: 'manual', label: 'Manual run' },
  { value: 'schedule', label: 'Schedule (cron)' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'lead_score', label: 'Lead score > X' },
  { value: 'low_stock', label: 'Low stock' },
]

const STEP_TYPES = [
  { value: 'ai', label: 'AI (Groq)' },
  { value: 'send_whatsapp', label: 'Send WhatsApp' },
  { value: 'send_email', label: 'Send email' },
  { value: 'update_contact', label: 'Update contact' },
  { value: 'delay', label: 'Delay' },
  { value: 'retail_inventory', label: 'Retail reorder' },
]

type WorkflowPayload = {
  name?: string
  description?: string
  trigger?: { type?: string }
  steps?: Array<{ id: string; type: string; config: Record<string, unknown> }>
}

function WorkflowBuilderForm({
  tenantId,
  workflowId,
  initialWorkflow,
}: {
  tenantId: string
  workflowId: string | null
  initialWorkflow: WorkflowPayload | null
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(() => initialWorkflow?.name ?? '')
  const [description, setDescription] = useState(() => initialWorkflow?.description ?? '')
  const [triggerType, setTriggerType] = useState(
    () => (initialWorkflow?.trigger?.type as string) ?? 'manual',
  )
  const [steps, setSteps] = useState<
    Array<{ id: string; type: string; config: Record<string, unknown> }>
  >(() => {
    const s = initialWorkflow?.steps
    return Array.isArray(s) ? s : []
  })
  const [runStatus, setRunStatus] = useState<string | null>(null)

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (workflowId) {
        const res = await apiRequest(`/api/agents/workflows/${workflowId}`, {
          method: 'PATCH',
          body: JSON.stringify({ name, description, trigger: { type: triggerType, config: {} }, steps }),
        })
        if (!res.ok) throw new Error('Save failed')
        return res.json()
      }
      const res = await apiRequest('/api/agents/workflows', {
        method: 'POST',
        body: JSON.stringify({ name, description, trigger: { type: triggerType, config: {} }, steps }),
      })
      if (!res.ok) throw new Error('Create failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-workflows', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['workflow', workflowId] })
    },
  })

  const runMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(`/api/agents/workflows/${workflowId}/run`, { method: 'POST', body: '{}' })
      const data = await res.json().catch(() => ({}))
      return { ok: res.ok, data }
    },
    onSuccess: (r) => setRunStatus(r.ok ? 'Success' : (r.data?.error ?? 'Failed')),
  })

  const addStep = () => setSteps((s) => [...s, { id: `step-${Date.now()}`, type: 'ai', config: { prompt: '' } }])
  const removeStep = (id: string) => setSteps((s) => s.filter((x) => x.id !== id))

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/crm/${tenantId}/Agents`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {workflowId ? 'Edit workflow' : 'New workflow'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workflow</CardTitle>
          <CardDescription>Trigger and steps. India SMB only. ₹ INR.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lead follow-up" className="mt-1" />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="When to run" className="mt-1" />
          </div>
          <div>
            <Label>Trigger</Label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
            >
              {TRIGGER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label>Steps</Label>
              <Button type="button" variant="outline" size="sm" onClick={addStep}>Add step</Button>
            </div>
            <div className="mt-2 space-y-2">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-2 rounded border p-2 dark:border-gray-700">
                  <select
                    value={step.type}
                    onChange={(e) => setSteps((s) => s.map((x) => (x.id === step.id ? { ...x, type: e.target.value } : x)))}
                    className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
                  >
                    {STEP_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeStep(step.id)}>Remove</Button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !name.trim()}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="ml-2">Save</span>
            </Button>
            {workflowId && (
              <Button variant="secondary" onClick={() => runMutation.mutate()} disabled={runMutation.isPending}>
                {runMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                <span className="ml-2">Run</span>
              </Button>
            )}
            {runStatus && <span className="text-sm text-gray-600 dark:text-gray-400 self-center">{runStatus}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function WorkflowBuilderPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const tenantId = params?.tenantId as string
  const workflowId = searchParams?.get('workflowId') as string | null

  const { data: workflow, isLoading } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: async () => {
      const res = await apiRequest(`/api/agents/workflows/${workflowId}`)
      if (!res.ok) throw new Error('Not found')
      return res.json()
    },
    enabled: !!workflowId,
  })

  if (!tenantId) return <PageLoading message="Loading..." fullScreen={false} />
  if (workflowId && isLoading) return <PageLoading message="Loading workflow..." fullScreen={false} />

  return (
    <WorkflowBuilderForm
      key={workflowId ?? '__new__'}
      tenantId={tenantId}
      workflowId={workflowId}
      initialWorkflow={(workflow as WorkflowPayload | undefined) ?? null}
    />
  )
}
