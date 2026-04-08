'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { ListOrdered } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

type SequenceItem = {
  workflow_id: string
  name: string
  status: 'draft' | 'published'
  trigger: { event_type: string }
}

export default function CRMSequencesPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) ?? ''
  const { token } = useAuthStore()
  const [name, setName] = useState('Prospect follow-up sequence')
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [enrollingId, setEnrollingId] = useState<string | null>(null)
  const [pausingId, setPausingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sequences, setSequences] = useState<SequenceItem[]>([])

  const payload = useMemo(
    () => ({
      schema_version: '1.0',
      name,
      status: 'draft',
      steps: [
        { step_no: 1, channel: 'email', template_id: 'intro_01', delay_minutes: 0, stop_if: ['reply_received'] },
        { step_no: 2, channel: 'task', template_id: 'call_follow_up', delay_minutes: 120, stop_if: ['deal_stage=won'] },
      ],
    }),
    [name]
  )

  async function loadSequences() {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/v1/workflows', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!response.ok) throw new Error('Failed to load sequences')
      const body = await response.json()
      const workflows = Array.isArray(body.workflows) ? body.workflows : []
      const filtered = workflows.filter((item: any) => {
        const steps = item.steps as Record<string, unknown> | undefined
        return item.trigger?.event_type === 'sequence.manual' || steps?.sequence === true
      })
      setSequences(filtered)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sequences')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) void loadSequences()
  }, [token])

  async function createSequence() {
    try {
      setCreating(true)
      setError(null)
      const idempotencyKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? `seq:create:${crypto.randomUUID()}`
          : `seq:create:${Date.now()}`
      const response = await fetch('/api/v1/sequences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-idempotency-key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error('Failed to create sequence')
      await loadSequences()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sequence')
    } finally {
      setCreating(false)
    }
  }

  async function enroll(sequenceId: string) {
    try {
      setEnrollingId(sequenceId)
      setError(null)
      const idempotencyKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? `seq:enroll:${sequenceId}:${crypto.randomUUID()}`
          : `seq:enroll:${sequenceId}:${Date.now()}`
      const response = await fetch(`/api/v1/sequences/${sequenceId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-idempotency-key': idempotencyKey,
        },
        body: JSON.stringify({ target_entity_type: 'lead', target_entity_id: 'manual-enrollment' }),
      })
      if (!response.ok) throw new Error('Failed to enroll')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll')
    } finally {
      setEnrollingId(null)
    }
  }

  async function pause(sequenceId: string) {
    try {
      setPausingId(sequenceId)
      setError(null)
      const idempotencyKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? `seq:pause:${sequenceId}:${crypto.randomUUID()}`
          : `seq:pause:${sequenceId}:${Date.now()}`
      const response = await fetch(`/api/v1/sequences/${sequenceId}/pause`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-idempotency-key': idempotencyKey,
        },
      })
      if (!response.ok) throw new Error('Failed to pause')
      await loadSequences()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause')
    } finally {
      setPausingId(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Sales Sequences</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Build and run multi-step outreach tracks from CRM.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-page-ai'))}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
        >
          Ask PayAid AI about sequence results
        </button>
      </div>

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Create Sequence</CardTitle>
          <CardDescription>Create a sequence with email and follow-up task steps.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sequence name" />
          <Button
            onClick={createSequence}
            disabled={creating}
            title={creating ? 'Please wait' : 'Create sequence draft'}
          >
            {creating ? 'Creating…' : 'Create Draft'}
          </Button>
          <Button
            variant="outline"
            onClick={loadSequences}
            disabled={loading}
            title={loading ? 'Please wait' : 'Refresh list'}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Sequence Registry</CardTitle>
          <CardDescription>Enroll prospects or pause active sequences.</CardDescription>
        </CardHeader>
        <CardContent>
          {sequences.length === 0 ? (
            <div
              data-sequence="default"
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex items-start gap-3"
            >
              <ListOrdered className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">No sequences yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Create your first sequence here, or continue using Marketing module tracks.
                </p>
                <Link href={`/marketing/${tenantId}/Sequences`} className="inline-flex mt-3 text-xs font-medium text-indigo-600 hover:underline">
                  Open Marketing sequences
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sequences.map((sequence) => (
                <div
                  key={sequence.workflow_id}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-700 p-4 hover:shadow-md hover:-translate-y-[1px] transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{sequence.name}</p>
                      <p className="text-xs text-slate-500 mt-1">Trigger: {sequence.trigger?.event_type || 'sequence.manual'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{sequence.status}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          enrollingId === sequence.workflow_id ||
                          pausingId === sequence.workflow_id
                        }
                        onClick={() => void enroll(sequence.workflow_id)}
                        title={
                          enrollingId === sequence.workflow_id
                            ? 'Please wait'
                            : pausingId === sequence.workflow_id
                              ? 'Please wait'
                              : 'Enroll test lead'
                        }
                      >
                        {enrollingId === sequence.workflow_id ? 'Enrolling…' : 'Enroll'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          pausingId === sequence.workflow_id ||
                          enrollingId === sequence.workflow_id
                        }
                        onClick={() => void pause(sequence.workflow_id)}
                        title={
                          pausingId === sequence.workflow_id
                            ? 'Please wait'
                            : enrollingId === sequence.workflow_id
                              ? 'Please wait'
                              : 'Pause sequence'
                        }
                      >
                        {pausingId === sequence.workflow_id ? 'Pausing…' : 'Pause'}
                      </Button>
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
