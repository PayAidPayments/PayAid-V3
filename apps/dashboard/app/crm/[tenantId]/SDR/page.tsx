'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Zap,
  Plus,
  Play,
  Pause,
  Square,
  Loader2,
  Users,
  BookOpen,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Activity,
  Clock,
  List,
  FileText,
  GitBranch,
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { formatDistanceToNow } from 'date-fns'

const PURPLE = '#53328A'

interface SdrPlaybook {
  id: string
  name: string
  description?: string
  is_active: boolean
  run_count: number
  steps: { sdr_steps: SdrStep[]; guardrails: Record<string, unknown> }
  created_at: string
}

interface SdrStep {
  step_type: 'email' | 'call' | 'sms' | 'whatsapp' | 'task' | 'wait'
  delay_hours: number
  subject?: string
  body?: string
  template_id?: string
}

interface SdrRun {
  id: string
  playbook_id: string
  playbook_name?: string | null
  status: string
  contact_count?: number | null
  guardrails?: Record<string, unknown> | null
  started_at: string
  completed_at?: string | null
  stop_reason?: string | null
  paused_at?: string | null
}

interface AuditEntry {
  id: string
  entity_type: string
  entity_id: string | null
  changed_by: string
  summary: string
  timestamp: string
  after?: Record<string, unknown> | null
}

const AUDIT_ICON: Record<string, { icon: string; color: string }> = {
  sdr_run_started:  { icon: '▶', color: 'text-green-600' },
  sdr_run_paused:   { icon: '⏸', color: 'text-amber-600' },
  sdr_run_stopped:  { icon: '⏹', color: 'text-red-500' },
}

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
  running:   { label: 'Running',   class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  paused:    { label: 'Paused',    class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  stopped:   { label: 'Stopped',   class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  completed: { label: 'Completed', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  pending:   { label: 'Pending',   class: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
}

const STEP_ICONS: Record<string, string> = {
  email: '✉️', call: '📞', sms: '💬', whatsapp: '🟢', task: '✅', wait: '⏳',
}

export default function SDRPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''
  const { token } = useAuthStore()
  const queryClient = useQueryClient()
  const { toast, ToastContainer: PageToastContainer } = useToast()

  const [createOpen, setCreateOpen] = useState(false)
  const [startOpen, setStartOpen] = useState(false)
  const [stopOpen, setStopOpen] = useState(false)
  const [selectedPlaybook, setSelectedPlaybook] = useState<SdrPlaybook | null>(null)
  const [selectedRun, setSelectedRun] = useState<SdrRun | null>(null)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [contactList, setContactList] = useState('')
  const [stopReason, setStopReason] = useState('')
  const [maxContacts, setMaxContacts] = useState('100')
  const [rateLimit, setRateLimit] = useState('20')

  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }

  const { data: playbooksData, isLoading } = useQuery({
    queryKey: ['sdr-playbooks', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/v1/sdr/playbooks', { headers })
      if (!res.ok) throw new Error('Failed to load playbooks')
      return res.json() as Promise<{ playbooks: SdrPlaybook[]; total: number }>
    },
    enabled: !!token,
  })

  const { data: runsData, isLoading: runsLoading, isFetching: runsFetching, refetch: refetchRuns } = useQuery({
    queryKey: ['sdr-runs', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/v1/sdr/runs?limit=20', { headers })
      if (!res.ok) throw new Error('Failed to load runs')
      return res.json() as Promise<{ runs: SdrRun[]; pagination: { total: number } }>
    },
    enabled: !!token,
    refetchInterval: 15000,
  })

  const { data: auditData, refetch: refetchAudit } = useQuery({
    queryKey: ['sdr-audit', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/v1/audit/actions?entityType=sdr_run&limit=15', { headers })
      if (!res.ok) return { actions: [] }
      return res.json() as Promise<{ actions: AuditEntry[]; count: number }>
    },
    enabled: !!token,
    refetchInterval: 30000,
  })

  const playbooks = playbooksData?.playbooks ?? []
  const runs = runsData?.runs ?? []
  const activeRuns = runs.filter((r) => r.status === 'running').length
  const pausedRuns = runs.filter((r) => r.status === 'paused').length
  const auditEntries = auditData?.actions ?? []

  const createPlaybook = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/sdr/playbooks', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newName,
          description: newDesc || undefined,
          steps: [
            { step_type: 'email', delay_hours: 0, subject: 'Introduction', body: 'Hi, I wanted to reach out...' },
            { step_type: 'call',  delay_hours: 48 },
            { step_type: 'email', delay_hours: 96, subject: 'Follow-up', body: 'Just checking in...' },
          ],
          guardrails: {
            max_contacts: parseInt(maxContacts, 10) || 100,
            rate_limit_per_hour: parseInt(rateLimit, 10) || 20,
            require_approval: false,
          },
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Playbook created', newName)
      queryClient.invalidateQueries({ queryKey: ['sdr-playbooks', tenantId] })
      setCreateOpen(false)
      setNewName('')
      setNewDesc('')
    },
    onError: (e) => toast.error('Failed to create playbook', e instanceof Error ? e.message : ''),
  })

  const startRun = useMutation({
    mutationFn: async (playbookId: string) => {
      const contacts = contactList.split(/[\n,]/).map((c) => c.trim()).filter(Boolean)
      const res = await fetch(`/api/v1/sdr/runs/${playbookId}/start`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ contact_ids: contacts }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success('Run started', `${data.run?.contact_count ?? 0} contacts enrolled`)
      queryClient.invalidateQueries({ queryKey: ['sdr-playbooks', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['sdr-runs', tenantId] })
      setStartOpen(false)
      setContactList('')
    },
    onError: (e) => toast.error('Failed to start run', e instanceof Error ? e.message : ''),
  })

  const pauseRun = useMutation({
    mutationFn: async (runId: string) => {
      const res = await fetch(`/api/v1/sdr/runs/${runId}/pause`, { method: 'POST', headers })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Run paused')
      queryClient.invalidateQueries({ queryKey: ['sdr-playbooks', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['sdr-runs', tenantId] })
    },
    onError: (e) => toast.error('Failed to pause run', e instanceof Error ? e.message : ''),
  })

  const stopRun = useMutation({
    mutationFn: async (runId: string) => {
      const res = await fetch(`/api/v1/sdr/runs/${runId}/stop`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: stopReason }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Run stopped', stopReason)
      queryClient.invalidateQueries({ queryKey: ['sdr-playbooks', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['sdr-runs', tenantId] })
      setStopOpen(false)
      setStopReason('')
    },
    onError: (e) => toast.error('Failed to stop run', e instanceof Error ? e.message : ''),
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
      {PageToastContainer}

      {/* Band 0 — Stat bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'PLAYBOOKS', value: playbooksData?.total ?? 0, icon: BookOpen, color: 'text-violet-600' },
          { label: 'TOTAL RUNS', value: runsData?.pagination?.total ?? 0, icon: Zap, color: 'text-blue-600' },
          { label: 'ACTIVE RUNS', value: activeRuns, icon: Activity, color: 'text-emerald-600' },
          { label: 'PAUSED', value: pausedRuns, icon: Pause, color: 'text-amber-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="h-28 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all">
            <CardContent className="flex items-start justify-between px-5 pt-4 pb-0 h-full">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mt-1">{value}</p>
              </div>
              <Icon className={`w-5 h-5 mt-1 ${color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Band 1 — Actions bar */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="flex items-center justify-between px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">AI SDR — Sales Development Representative</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Automate outreach sequences with built-in guardrails and policy controls.</p>
          </div>
          <Button
            size="sm"
            style={{ backgroundColor: PURPLE }}
            className="text-white text-xs gap-1"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            New Playbook
          </Button>
        </CardContent>
      </Card>

      {/* Band 2 — Playbooks grid */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Playbooks</h3>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : playbooks.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
            <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
              <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-500">No playbooks yet</p>
              <p className="text-xs text-slate-400 text-center max-w-xs">Create your first SDR playbook to start automating outreach sequences with guardrails.</p>
              <Button size="sm" style={{ backgroundColor: PURPLE }} className="text-white text-xs gap-1 mt-1" onClick={() => setCreateOpen(true)}>
                <Plus className="w-3.5 h-3.5" /> Create Playbook
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {playbooks.map((pb) => (
              <Card key={pb.id} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all">
                <CardHeader className="px-5 pt-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-semibold truncate">{pb.name}</CardTitle>
                      {pb.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{pb.description}</p>}
                    </div>
                    <Badge className={pb.is_active ? 'bg-green-100 text-green-700 text-[10px]' : 'bg-slate-100 text-slate-500 text-[10px]'}>
                      {pb.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-4 space-y-3">
                  {/* Steps preview */}
                  <div className="flex flex-wrap gap-1">
                    {(pb.steps?.sdr_steps ?? []).map((step, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5 text-slate-600 dark:text-slate-400">
                        {STEP_ICONS[step.step_type] ?? '•'} {step.step_type}
                        {step.delay_hours > 0 ? ` +${step.delay_hours}h` : ''}
                      </span>
                    ))}
                    {(pb.steps?.sdr_steps ?? []).length === 0 && (
                      <span className="text-[10px] text-slate-400">No steps configured</span>
                    )}
                  </div>

                  {/* Guardrails */}
                  {Object.keys(pb.steps?.guardrails ?? {}).length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <ShieldCheck className="w-3 h-3 text-green-500" />
                      {(pb.steps.guardrails as any).max_contacts && <span>Max {(pb.steps.guardrails as any).max_contacts}</span>}
                      {(pb.steps.guardrails as any).rate_limit_per_hour && <span>• {(pb.steps.guardrails as any).rate_limit_per_hour}/hr</span>}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">{pb.run_count} run{pb.run_count !== 1 ? 's' : ''}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1 h-7"
                      style={{ borderColor: PURPLE, color: PURPLE }}
                      onClick={() => { setSelectedPlaybook(pb); setStartOpen(true) }}
                    >
                      <Play className="w-3 h-3" /> Start Run
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Band 3 — Live Runs Panel */}
      <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <CardHeader className="px-5 pt-4 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-600" />
            Run History
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 h-7 text-slate-500"
            onClick={() => refetchRuns()}
            disabled={runsLoading}
          >
            <RefreshCw className={`w-3 h-3 ${runsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          {runsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : runs.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2 text-slate-400">
              <List className="w-8 h-8" />
              <p className="text-xs">No runs yet.</p>
              <p className="text-[10px]">Start a run from a playbook above — it will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {runs.map((run) => {
                const badge = STATUS_BADGE[run.status] ?? STATUS_BADGE.pending
                const isActive = run.status === 'running'
                const isControllable = run.status === 'running' || run.status === 'paused'
                return (
                  <div key={run.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {run.playbook_name ?? run.playbook_id}
                        </p>
                        <Badge className={`text-[10px] ${badge.class}`}>{badge.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {run.contact_count ?? 0} contacts
                        </span>
                        {run.started_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Started {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
                          </span>
                        )}
                        {run.stop_reason && (
                          <span className="text-red-500 truncate max-w-[160px]">Reason: {run.stop_reason}</span>
                        )}
                      </div>
                    </div>
                    {isControllable && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs gap-1 h-7 border-amber-300 text-amber-600 hover:bg-amber-50"
                            disabled={pauseRun.isPending}
                            onClick={() => pauseRun.mutate(run.id)}
                            title="Pause run"
                          >
                            {pauseRun.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pause className="w-3 h-3" />}
                            Pause
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs gap-1 h-7 border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => { setSelectedRun(run); setStopOpen(true) }}
                          title="Stop run"
                        >
                          <Square className="w-3 h-3" /> Stop
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Band 4 — SDR Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm h-full">
            <CardHeader className="px-5 pt-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-600" />
                SDR Audit Trail
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1 h-7 text-slate-500"
                onClick={() => refetchAudit()}
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {auditEntries.length === 0 ? (
                <div className="flex flex-col items-center py-8 gap-2 text-slate-400">
                  <FileText className="w-7 h-7 opacity-30" />
                  <p className="text-xs">No audit events yet.</p>
                  <p className="text-[10px]">Run lifecycle events (start / pause / stop) appear here.</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-100 dark:bg-slate-800" />
                  <div className="space-y-3">
                    {auditEntries.map((entry) => {
                      const iconMeta = AUDIT_ICON[entry.summary] ?? { icon: '·', color: 'text-slate-500' }
                      const afterSnap = entry.after as Record<string, unknown> | null
                      return (
                        <div key={entry.id} className="flex items-start gap-3 relative">
                          <span className={`w-4 h-4 shrink-0 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[9px] font-bold ${iconMeta.color} z-10`}>
                            {iconMeta.icon}
                          </span>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                {entry.summary.replace(/_/g, ' ')}
                              </p>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Users className="w-2.5 h-2.5" />
                                {entry.changed_by === 'system' ? 'System' : entry.changed_by}
                              </span>
                              {entry.entity_id && (
                                <span className="font-mono truncate max-w-[120px]">{entry.entity_id}</span>
                              )}
                              {afterSnap?.contact_count != null && (
                                <span>{String(afterSnap.contact_count)} contacts</span>
                              )}
                              {afterSnap?.stop_reason && (
                                <span className="text-red-400 truncate max-w-[120px]">↳ {String(afterSnap.stop_reason)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Band 4 right — Stats mini-card */}
        <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader className="px-5 pt-4 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-slate-500" />
              Audit Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-3">
            {[
              { label: 'Run starts', value: auditEntries.filter((a) => a.summary.includes('started')).length, color: 'text-green-600' },
              { label: 'Pauses', value: auditEntries.filter((a) => a.summary.includes('paused')).length, color: 'text-amber-600' },
              { label: 'Stops', value: auditEntries.filter((a) => a.summary.includes('stopped')).length, color: 'text-red-500' },
              { label: 'Total events', value: auditEntries.length, color: 'text-violet-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{label}</span>
                <span className={`text-sm font-semibold ${color}`}>{value}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] text-slate-400">Showing last 15 events. Events auto-refresh every 30s.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Band 5 — Safety controls info */}
      <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <CardHeader className="px-5 pt-4 pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            Safety Controls & Guardrails
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400">
            {[
              { icon: '🔢', title: 'Contact Limits', desc: 'max_contacts caps the total contacts per run, preventing runaway outreach.' },
              { icon: '⏱️', title: 'Rate Limiting', desc: 'rate_limit_per_hour controls send velocity to stay within provider and legal limits.' },
              { icon: '✅', title: 'Approval Gate', desc: 'require_approval blocks run start until a manager approves via the API.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-2.5">
                <span className="text-base mt-0.5">{icon}</span>
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-300">{title}</p>
                  <p className="mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              All SDR run events are logged to the audit trail. Pause or Stop a run at any time using the controls above.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Create Playbook Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">New SDR Playbook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-medium">Name *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Q2 Outreach" className="mt-1 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-medium">Description</Label>
              <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Brief description of this playbook's goal" className="mt-1 text-sm resize-none" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Max contacts</Label>
                <Input type="number" value={maxContacts} onChange={(e) => setMaxContacts(e.target.value)} className="mt-1 text-sm" min="1" />
              </div>
              <div>
                <Label className="text-xs font-medium">Rate / hour</Label>
                <Input type="number" value={rateLimit} onChange={(e) => setRateLimit(e.target.value)} className="mt-1 text-sm" min="1" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">A default 3-step sequence (email → call → email) is created. Edit steps via API after creation.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setCreateOpen(false)} disabled={createPlaybook.isPending}>Cancel</Button>
            <Button
              size="sm"
              className="text-xs text-white gap-1"
              style={{ backgroundColor: PURPLE }}
              disabled={!newName.trim() || createPlaybook.isPending}
              title={createPlaybook.isPending ? 'Creating…' : undefined}
              onClick={() => createPlaybook.mutate()}
            >
              {createPlaybook.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              {createPlaybook.isPending ? 'Creating…' : 'Create Playbook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Run Dialog */}
      <Dialog open={startOpen} onOpenChange={setStartOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Start Run — {selectedPlaybook?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-medium">Contact IDs (one per line or comma-separated) *</Label>
              <Textarea
                value={contactList}
                onChange={(e) => setContactList(e.target.value)}
                placeholder="contact_id_1&#10;contact_id_2&#10;contact_id_3"
                className="mt-1 text-sm font-mono resize-none"
                rows={5}
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {contactList.split(/[\n,]/).filter((c) => c.trim()).length} contact{contactList.split(/[\n,]/).filter((c) => c.trim()).length !== 1 ? 's' : ''} entered
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setStartOpen(false)} disabled={startRun.isPending}>Cancel</Button>
            <Button
              size="sm"
              className="text-xs text-white gap-1"
              style={{ backgroundColor: PURPLE }}
              disabled={!contactList.trim() || startRun.isPending}
              title={startRun.isPending ? 'Starting…' : undefined}
              onClick={() => selectedPlaybook && startRun.mutate(selectedPlaybook.id)}
            >
              {startRun.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              {startRun.isPending ? 'Starting…' : 'Start Run'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stop Run Dialog */}
      <Dialog open={stopOpen} onOpenChange={setStopOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Stop Run</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-slate-500">This will immediately stop the run and log the reason to the audit trail.</p>
            <div>
              <Label className="text-xs font-medium">Stop reason *</Label>
              <Input value={stopReason} onChange={(e) => setStopReason(e.target.value)} placeholder="e.g. Campaign cancelled" className="mt-1 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setStopOpen(false)} disabled={stopRun.isPending}>Cancel</Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1 border-red-300 text-red-600 hover:bg-red-50"
              disabled={!stopReason.trim() || stopRun.isPending}
              title={stopRun.isPending ? 'Stopping…' : undefined}
              onClick={() => selectedRun && stopRun.mutate(selectedRun.id)}
            >
              {stopRun.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3" />}
              {stopRun.isPending ? 'Stopping…' : 'Stop Run'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
