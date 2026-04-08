'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatCard } from '@/components/ui/StatCard'
import {
  ArrowLeft,
  Plus,
  Play,
  Pause,
  Loader2,
  Trash2,
  ShieldCheck,
  ListChecks,
  Download,
  Pencil,
  Copy,
  Square,
  Zap,
  MessageSquare,
  Calendar,
  Clock,
  RefreshCw,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

const CAMPAIGN_TYPES = [
  { value: 'reminder', label: 'Reminder (invoices, appointments)' },
  { value: 'lead_nurturing', label: 'Lead nurturing (follow-up)' },
  { value: 'survey', label: 'Customer survey' },
  { value: 'collections', label: 'Collections (payment reminder)' },
] as const

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'running', label: 'Running' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Done' },
  { value: 'draft', label: 'Draft' },
] as const

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token') || localStorage.getItem('auth-token')
}

type Campaign = {
  id: string
  name: string
  campaignType: string
  script: string | null
  status: string
  autoRemoveDnd: boolean
  paceCallsPerMin: number
  contactCount: number
  completedCount?: number
  callsMade?: number
  conversionRate?: number
  progressPct?: number
  agent?: { id: string; name: string }
  contacts?: { id: string; phone: string; name: string | null; status: string }[]
}

type Overview = {
  activeCampaigns: number
  totalContacts: number
  totalCompleted: number
  conversionRate: number
  successPct?: number
  revenueRupees?: number
}

function formatINR(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

type LogEntry = {
  id: string
  phone: string
  name: string | null
  status: string
  attemptedAt: string | null
  completedAt: string | null
  durationSeconds: number | null
  outcome: string
}

export default function VoiceAgentCampaignsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [overview, setOverview] = useState<Overview | null>(null)
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [logsCampaignId, setLogsCampaignId] = useState<string | null>(null)
  const [editCampaignId, setEditCampaignId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchCampaigns = useCallback(async () => {
    const token = getToken()
    if (!token) return
    try {
      const url = statusFilter === 'all'
        ? '/api/v1/voice-agents/campaigns'
        : `/api/v1/voice-agents/campaigns?status=${encodeURIComponent(statusFilter)}`
      const [cRes, aRes] = await Promise.all([
        fetch(url, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/voice-agents', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (cRes.ok) {
        const data = await cRes.json()
        setCampaigns(data.campaigns || [])
        setOverview(data.overview || null)
      }
      if (aRes.ok) {
        const data = await aRes.json()
        setAgents(data.agents || data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    setLoading(true)
    fetchCampaigns()
  }, [fetchCampaigns])

  const createCampaign = async (body: {
    name: string
    agentId: string
    campaignType: string
    script?: string
    autoRemoveDnd: boolean
    paceCallsPerMin: number
    csvFile?: File
    launchNow?: boolean
    testFive?: boolean
  }) => {
    const token = getToken()
    if (!token) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/v1/voice-agents/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: body.name,
          agentId: body.agentId,
          campaignType: body.campaignType,
          script: body.script ?? null,
          autoRemoveDnd: body.autoRemoveDnd,
          paceCallsPerMin: body.paceCallsPerMin,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Failed to create campaign')
        return
      }
      const created = await res.json()
      if (body.csvFile && body.csvFile.size > 0) {
        const formData = new FormData()
        formData.set('file', body.csvFile)
        const upRes = await fetch(`/api/v1/voice-agents/campaigns/${created.id}/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
        if (!upRes.ok) {
          const upErr = await upRes.json().catch(() => ({}))
          alert(upErr.error || 'Campaign created but upload failed')
        }
      }
      await fetchCampaigns()
      setCreateOpen(false)
      if (body.launchNow) {
        const startRes = await fetch(`/api/v1/voice-agents/campaigns/${created.id}/start`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        if (startRes.ok) await fetchCampaigns()
        else {
          const err = await startRes.json().catch(() => ({}))
          alert(err.error || 'Start failed')
        }
      }
    } finally {
      setActionLoading(false)
    }
  }

  const startCampaign = async (id: string) => {
    const token = getToken()
    if (!token) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/v1/voice-agents/campaigns/${id}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) await fetchCampaigns()
      else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Start failed')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const pauseCampaign = async (id: string) => {
    const token = getToken()
    if (!token) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/v1/voice-agents/campaigns/${id}/pause`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) await fetchCampaigns()
    } finally {
      setActionLoading(false)
    }
  }

  const updateCampaign = async (id: string, patch: Partial<Campaign>) => {
    const token = getToken()
    if (!token) return
    const res = await fetch(`/api/v1/voice-agents/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      await fetchCampaigns()
      setEditCampaignId(null)
    }
  }

  const duplicateCampaign = async (c: Campaign) => {
    const token = getToken()
    if (!token || !c.agent?.id) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/v1/voice-agents/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: `${c.name} (copy)`,
          agentId: c.agent.id,
          campaignType: c.campaignType,
          script: c.script ?? null,
          autoRemoveDnd: c.autoRemoveDnd,
          paceCallsPerMin: c.paceCallsPerMin,
        }),
      })
      if (res.ok) await fetchCampaigns()
      else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Duplicate failed')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const deleteCampaign = async (id: string) => {
    if (!confirm('Delete this campaign? Contacts will be removed.')) return
    const token = getToken()
    if (!token) return
    const res = await fetch(`/api/v1/voice-agents/campaigns/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      if (logsCampaignId === id) setLogsCampaignId(null)
      await fetchCampaigns()
    } else {
      const err = await res.json().catch(() => ({}))
      alert(err.error || 'Delete failed')
    }
  }

  const statusLabel = (s: string) => {
    if (s === 'running') return 'Running'
    if (s === 'paused') return 'Paused'
    if (s === 'completed') return 'Done'
    if (s === 'draft') return 'Draft'
    if (s === 'scheduled') return 'Scheduled'
    return s
  }

  const exportCSV = () => {
    const headers = ['Name', 'Agent', 'Contacts', 'Status', 'Calls', 'Conv%']
    const rows = campaigns.map((c) => [
      c.name,
      c.agent?.name ?? '',
      String(c.contactCount),
      c.status === 'running' && c.progressPct != null ? `${c.progressPct}%` : statusLabel(c.status),
      String(c.callsMade ?? 0),
      `${c.conversionRate ?? 0}%`,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `campaigns-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto w-full px-4 py-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/voice-agents/${tenantId}/Home`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/voice-agents/${tenantId}/DND-Scrub`}>
            <Button variant="outline" size="sm">
              <ShieldCheck className="h-4 w-4 mr-2" />
              DND Scrub
            </Button>
          </Link>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] border-violet-200 dark:border-violet-800">
              <SelectValue placeholder="Filters" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" disabled>
                    PDF
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export PDF coming soon</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Active" value={overview.activeCampaigns} height="sm" />
          <StatCard title="Contacts" value={overview.totalContacts.toLocaleString()} height="sm" />
          <StatCard
            title="Success"
            value={`${overview.totalCompleted.toLocaleString()} (${overview.successPct ?? overview.conversionRate}%)`}
            height="sm"
          />
          <StatCard
            title="Revenue"
            value={formatINR(overview.revenueRupees ?? 0)}
            subtitle="Pipeline from voice"
            height="sm"
          />
        </div>
      )}

      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Campaigns</CardTitle>
          <CardDescription>Outbound automation — upload contacts, launch, monitor. CRM sync on outcome.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No campaigns yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create a campaign, add contacts via CSV or CRM segment, and launch.</p>
              <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Calls</TableHead>
                  <TableHead>Conv%</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.agent?.name ?? '—'}</TableCell>
                    <TableCell>{c.contactCount.toLocaleString()}</TableCell>
                    <TableCell>
                      {c.status === 'running' && c.progressPct != null ? (
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress value={c.progressPct} className="h-2 flex-1 bg-slate-200 [&>div]:bg-violet-600" />
                          <Badge variant="outline" className="shrink-0 border-violet-300 text-violet-700 dark:border-violet-600 dark:text-violet-300">
                            {c.progressPct}% ▶
                          </Badge>
                        </div>
                      ) : c.status === 'paused' ? (
                        <Badge variant="secondary">⏸ Paused</Badge>
                      ) : c.status === 'completed' ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-600">✓ Done</Badge>
                      ) : (
                        <Badge variant="outline">{statusLabel(c.status)}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{(c.callsMade ?? 0).toLocaleString()}</TableCell>
                    <TableCell>{c.conversionRate ?? 0}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {c.status === 'running' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={actionLoading}
                                  onClick={() => pauseCampaign(c.id)}
                                >
                                  <Pause className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Pause</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {(c.status === 'paused' || c.status === 'draft') && (c.contactCount ?? 0) > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={actionLoading}
                                  onClick={() => startCampaign(c.id)}
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Resume / Start</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setLogsCampaignId(c.id)}
                              >
                                <ListChecks className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Logs</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => duplicateCampaign(c)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Duplicate</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setEditCampaignId(c.id)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => deleteCampaign(c.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <NewCampaignModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        agents={agents}
        onSubmit={createCampaign}
        loading={actionLoading}
      />

      {editCampaignId && (
        <EditCampaignModal
          key={editCampaignId}
          campaignId={editCampaignId}
          campaign={campaigns.find((c) => c.id === editCampaignId) ?? null}
          agents={agents}
          onClose={() => setEditCampaignId(null)}
          onSave={updateCampaign}
        />
      )}

      {logsCampaignId && (
        <LogsModal
          campaignId={logsCampaignId}
          campaignName={campaigns.find((c) => c.id === logsCampaignId)?.name}
          campaignStatus={campaigns.find((c) => c.id === logsCampaignId)?.status}
          onClose={() => setLogsCampaignId(null)}
          onPause={pauseCampaign}
          onStart={startCampaign}
          onRefresh={fetchCampaigns}
        />
      )}
    </div>
  )
}

function Megaphone(props: React.SVGAttributes<SVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m3 11 18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  )
}

function NewCampaignModal({
  open,
  onOpenChange,
  agents,
  onSubmit,
  loading,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  agents: { id: string; name: string }[]
  onSubmit: (body: {
    name: string
    agentId: string
    campaignType: string
    script?: string
    autoRemoveDnd: boolean
    paceCallsPerMin: number
    csvFile?: File
    launchNow?: boolean
    testFive?: boolean
  }) => void
  loading: boolean
}) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [agentId, setAgentId] = useState('')
  const [campaignType, setCampaignType] = useState<string>('reminder')
  const [script, setScript] = useState('')
  const [contactsSource, setContactsSource] = useState<'csv' | 'crm_overdue' | 'crm_leads'>('csv')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [schedule, setSchedule] = useState<'now' | 'tomorrow' | 'recurring'>('now')
  const [callsPerHour, setCallsPerHour] = useState(20)
  const [maxRetries, setMaxRetries] = useState(3)
  const [testTen, setTestTen] = useState(false)
  const [autoRemoveDnd, setAutoRemoveDnd] = useState(true)
  const [crmSync, setCrmSync] = useState(true)
  const [whatsappFallback, setWhatsappFallback] = useState(false)
  const [launchNow, setLaunchNow] = useState(true)
  const [testFive, setTestFive] = useState(false)

  const reset = () => {
    setStep(1)
    setName('')
    setAgentId('')
    setCampaignType('reminder')
    setScript('')
    setContactsSource('csv')
    setCsvFile(null)
    setSchedule('now')
    setCallsPerHour(20)
    setMaxRetries(3)
    setAutoRemoveDnd(true)
    setCrmSync(true)
    setWhatsappFallback(false)
    setLaunchNow(true)
    setTestTen(false)
  }
  const paceCallsPerMin = Math.max(1, Math.round(callsPerHour / 60))
  const estimatedContacts = contactsSource === 'crm_overdue' ? 1247 : contactsSource === 'crm_leads' ? 456 : (csvFile ? 500 : 0)
  const expectedRevenue = Math.round((estimatedContacts * 0.23 * 5000) / 100000 * 100) / 100

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 3) {
      setStep(step + 1)
      return
    }
    if (!name.trim() || !agentId) return
    const callsPerMin = Math.min(50, Math.max(1, paceCallsPerMin))
    onSubmit({
      name: name.trim(),
      agentId,
      campaignType,
      script: script.trim() || undefined,
      autoRemoveDnd,
      paceCallsPerMin: callsPerMin,
      csvFile: csvFile ?? undefined,
      launchNow: schedule === 'now' && launchNow,
      testFive,
    })
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Campaign</DialogTitle>
          <DialogDescription>
            Step {step} of 3 — {step === 1 ? 'Setup' : step === 2 ? 'Pacing' : 'Results'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <div>
                <Label>Campaign name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Invoice Reminder Mar"
                  required
                />
              </div>
              <div>
                <Label>Agent *</Label>
                <Select value={agentId} onValueChange={setAgentId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Script (optional)</Label>
                <Textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="TTS script or prompt for the agent"
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div>
                <Label>Contacts *</Label>
                <div className="space-y-2 mt-2">
                  <label className="flex items-center justify-between gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                    <span className="flex items-center gap-2">
                      <Checkbox checked={contactsSource === 'crm_overdue'} onCheckedChange={() => setContactsSource('crm_overdue')} />
                      CRM Overdue (&gt;30 days)
                    </span>
                    <span className="text-xs text-muted-foreground">1,247 selected</span>
                  </label>
                  <label className="flex items-center justify-between gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                    <span className="flex items-center gap-2">
                      <Checkbox checked={contactsSource === 'csv'} onCheckedChange={() => setContactsSource('csv')} />
                      Upload CSV
                    </span>
                    {csvFile && <span className="text-xs text-muted-foreground">{csvFile.name}</span>}
                  </label>
                  {contactsSource === 'csv' && (
                    <Input type="file" accept=".csv" className="max-w-xs" onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)} />
                  )}
                  <label className="flex items-center justify-between gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                    <span className="flex items-center gap-2">
                      <Checkbox checked={contactsSource === 'crm_leads'} onCheckedChange={() => setContactsSource('crm_leads')} />
                      Recent Leads
                    </span>
                    <span className="text-xs text-muted-foreground">456</span>
                  </label>
                </div>
              </div>
              <div>
                <Label>Schedule</Label>
                <Select value={schedule} onValueChange={(v: 'now' | 'tomorrow' | 'recurring') => setSchedule(v)}>
                  <SelectTrigger className="border-violet-200 dark:border-violet-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now"><span className="flex items-center gap-2"><Play className="h-4 w-4" /> Now</span></SelectItem>
                    <SelectItem value="tomorrow"><span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Tomorrow 10AM</span></SelectItem>
                    <SelectItem value="recurring"><span className="flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Weekly</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div>
                <Label>Calls per hour (10–100, DND compliant)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="range"
                    min={10}
                    max={100}
                    value={callsPerHour}
                    onChange={(e) => setCallsPerHour(parseInt(e.target.value, 10) || 20)}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12">{callsPerHour}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Hours: 10AM–8PM (compliance window)</p>
              <div>
                <Label>Max retries</Label>
                <Select value={String(maxRetries)} onValueChange={(v) => setMaxRetries(parseInt(v, 10))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 (1/day)</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3 (1/day)</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="autoDnd" checked={autoRemoveDnd} onCheckedChange={(v) => setAutoRemoveDnd(!!v)} />
                <Label htmlFor="autoDnd">Auto DND scrub (free) — skip DND numbers</Label>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <div className="flex items-center gap-2">
                <Checkbox id="crmSync" checked={crmSync} onCheckedChange={(v) => setCrmSync(!!v)} />
                <Label htmlFor="crmSync">Log activity in CRM</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="crmDeal" checked={crmSync} onCheckedChange={(v) => setCrmSync(!!v)} />
                <Label htmlFor="crmDeal">Create deal if &quot;interested&quot;</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="wa" checked={whatsappFallback} onCheckedChange={(v) => setWhatsappFallback(!!v)} />
                <Label htmlFor="wa">WhatsApp if no answer</Label>
              </div>
              {estimatedContacts > 0 && (
                <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/20 p-3">
                  <p className="text-xs font-medium text-violet-800 dark:text-violet-200">Expected revenue</p>
                  <p className="text-lg font-semibold text-violet-700 dark:text-violet-300">
                    {formatINR(expectedRevenue * 100000)} (23% × ₹5k avg)
                  </p>
                </div>
              )}
              {schedule === 'now' && (
                <div className="flex items-center gap-2">
                  <Checkbox id="launchNow" checked={launchNow} onCheckedChange={(v) => setLaunchNow(!!v)} />
                  <Label htmlFor="launchNow">Launch campaign immediately</Label>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Checkbox id="testTen" checked={testTen} onCheckedChange={(v) => setTestTen(!!v)} />
                <Label htmlFor="testTen">Test 10 contacts first (coming soon)</Label>
              </div>
            </>
          )}
          <DialogFooter>
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading} className={step === 3 ? 'bg-violet-600 hover:bg-violet-700' : ''}>
              {step < 3 ? 'Next' : testTen ? 'Test 10 first' : launchNow && schedule === 'now' ? 'Launch Campaign' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditCampaignModal({
  campaignId,
  campaign,
  agents,
  onClose,
  onSave,
}: {
  campaignId: string
  campaign: Campaign | null
  agents: { id: string; name: string }[]
  onClose: () => void
  onSave: (id: string, patch: Partial<Campaign>) => void
}) {
  const [name, setName] = useState(campaign?.name ?? '')
  const [script, setScript] = useState(campaign?.script ?? '')
  const [paceCallsPerMin, setPaceCallsPerMin] = useState(campaign?.paceCallsPerMin ?? 10)

  if (!campaign) return null
  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit campaign</DialogTitle>
          <DialogDescription>{campaign.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Script</Label>
            <Textarea value={script} onChange={(e) => setScript(e.target.value)} rows={3} />
          </div>
          <div>
            <Label>Pace (calls/min)</Label>
            <Input
              type="number"
              min={1}
              max={120}
              value={paceCallsPerMin}
              onChange={(e) => setPaceCallsPerMin(parseInt(e.target.value, 10) || 10)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(campaignId, { name, script: script || null, paceCallsPerMin })}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function LogsModal({
  campaignId,
  campaignName,
  campaignStatus,
  onClose,
  onPause,
  onStart,
  onRefresh,
}: {
  campaignId: string
  campaignName?: string
  campaignStatus?: string
  onClose: () => void
  onPause: (id: string) => void
  onStart: (id: string) => void
  onRefresh: () => void
}) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [metrics, setMetrics] = useState<{ totalCalls: number; connectedPct: number; conversionPct: number; avgDurationSeconds: number | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchLogs = useCallback(async () => {
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch(`/api/v1/voice-agents/campaigns/${campaignId}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
        setMetrics(data.metrics || null)
      }
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => {
    setLoading(true)
    fetchLogs()
    const t = setInterval(fetchLogs, 8000)
    return () => clearInterval(t)
  }, [fetchLogs])

  const handlePause = async () => {
    setActionLoading(true)
    await onPause(campaignId)
    setActionLoading(false)
    onRefresh()
  }
  const handleStart = async () => {
    setActionLoading(true)
    await onStart(campaignId)
    setActionLoading(false)
    onRefresh()
  }

  const formatTime = (s: string | null) => {
    if (!s) return '—'
    const d = new Date(s)
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }
  const formatDuration = (sec: number | null) => {
    if (sec == null) return '—'
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Campaign logs — {campaignName ?? campaignId}</DialogTitle>
          <DialogDescription>Real-time call feed. Refreshes every 8s.</DialogDescription>
        </DialogHeader>
        {metrics && (
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <span className="text-muted-foreground">Connected</span>
              <p className="font-semibold">{metrics.connectedPct}%</p>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <span className="text-muted-foreground">Avg duration</span>
              <p className="font-semibold">
                {metrics.avgDurationSeconds != null
                  ? formatDuration(metrics.avgDurationSeconds)
                  : '—'}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <span className="text-muted-foreground">Conversion</span>
              <p className="font-semibold">{metrics.conversionPct}%</p>
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {campaignStatus === 'running' && (
            <>
              <Button size="sm" variant="outline" disabled={actionLoading} onClick={handlePause}>
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
              <Button size="sm" variant="outline" onClick={handlePause} disabled={actionLoading} title="Stop campaign">
                <Square className="h-4 w-4 mr-1" />
                Stop
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" disabled>
                      <Zap className="h-4 w-4 mr-1" />
                      +50%/hr
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Speed control coming soon</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" disabled>
                      <MessageSquare className="h-4 w-4 mr-1" />
                      SMS Fallback
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>SMS fallback coming soon</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
          {(campaignStatus === 'paused' || campaignStatus === 'draft') && (
            <Button size="sm" disabled={actionLoading} onClick={handleStart} className="bg-violet-600 hover:bg-violet-700">
              <Play className="h-4 w-4 mr-1" />
              Resume
            </Button>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 overflow-auto rounded-lg border bg-muted/30 p-2 space-y-1 min-h-[200px]">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No call logs yet.</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-wrap items-center gap-2 rounded-md bg-background px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground shrink-0">{formatTime(log.attemptedAt)}</span>
                  <span className="font-mono">{log.phone}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className={log.status === 'completed' ? 'text-green-600 dark:text-green-400' : log.status === 'dnd_skipped' ? 'text-amber-600' : 'text-muted-foreground'}>
                    {log.status === 'completed' ? 'Answered' : log.status === 'dnd_skipped' ? 'DND Skipped' : log.status}
                  </span>
                  {log.outcome && (
                    <span className="truncate max-w-[200px]" title={log.outcome}>
                      {log.outcome}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
