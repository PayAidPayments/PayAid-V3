'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ShieldCheck,
  Zap,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Bot,
  RotateCcw,
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'

interface RiskPolicy {
  id: string
  name: string
  description?: string
  policyType: string
  conditions: unknown
  actions: unknown
  isActive: boolean
  createdAt: string
}

interface ApprovalQueue {
  id: string
  entityType: string
  entityId: string
  status: string
  requestedBy: string
  createdAt: string
}

interface AIDecision {
  id: string
  entity_id?: string
  type: string
  action?: string
  outcome: string
  confidence?: number
  reasoning_trace?: string
  actor?: string
  override_reason?: string
  created_at: string
}

interface AIDecisionStats {
  total_decisions: number
  accepted: number
  rejected: number
  pending: number
  overrides: number
  acceptance_rate_pct: number | null
  override_rate_pct: number | null
  status: 'on_target' | 'needs_review'
}

const POLICY_TYPE_COLOR: Record<string, string> = {
  sdr:       'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  ai_limit:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  compliance:'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approval:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  default:   'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

export default function PoliciesPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''
  const { token } = useAuthStore()
  const { toast, ToastContainer: PageToastContainer } = useToast()
  const queryClient = useQueryClient()

  const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) }

  // Expanded decision row state + override form
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [overrideReason, setOverrideReason] = useState('')
  const [overrideOutcome, setOverrideOutcome] = useState<'accepted' | 'rejected' | 'overridden'>('overridden')

  const { data: policiesData, isLoading: loadingPolicies } = useQuery({
    queryKey: ['ai-policies', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/ai/governance/policies', { headers })
      if (!res.ok) return { policies: [] }
      return res.json()
    },
    enabled: !!token,
  })

  const { data: approvalData, isLoading: loadingApprovals } = useQuery({
    queryKey: ['approval-queue', tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/crm/approvals?tenantId=${tenantId}&limit=10`, { headers })
      if (!res.ok) return { items: [], total: 0 }
      return res.json()
    },
    enabled: !!token,
  })

  const { data: decisionsData, isLoading: loadingDecisions } = useQuery({
    queryKey: ['ai-decisions', tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/ai/decisions?limit=15&window_days=30`, { headers })
      if (!res.ok) return { decisions: [] }
      return res.json()
    },
    enabled: !!token,
    staleTime: 60_000,
  })

  const { data: statsData } = useQuery<AIDecisionStats>({
    queryKey: ['ai-decisions-stats', tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/ai/decisions/stats?window_days=30`, { headers })
      if (!res.ok) throw new Error('Failed to load stats')
      return res.json()
    },
    enabled: !!token,
    staleTime: 2 * 60_000,
  })

  const overrideMutation = useMutation({
    mutationFn: async ({ id, outcome, reason }: { id: string; outcome: string; reason: string }) => {
      const res = await fetch(`/api/v1/ai/decisions/${id}/override`, {
        method: 'POST',
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify({ outcome, override_reason: reason }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'Override failed')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('AI decision override recorded.')
      setExpandedId(null)
      setOverrideReason('')
      queryClient.invalidateQueries({ queryKey: ['ai-decisions', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['ai-decisions-stats', tenantId] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const policies: RiskPolicy[] = policiesData?.policies ?? []
  const approvals: ApprovalQueue[] = approvalData?.items ?? []
  const decisions: AIDecision[] = decisionsData?.decisions ?? []

  const activePolicies = policies.filter((p) => p.isActive).length
  const pendingApprovals = approvals.filter((a) => a.status === 'pending').length

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
      {PageToastContainer}

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Policies & AI Controls</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Manage approval rules, AI usage limits, SDR guardrails, and compliance policies.
        </p>
      </div>

      {/* Band 0 — Stat bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'ACTIVE POLICIES', value: activePolicies, icon: ShieldCheck, color: 'text-violet-600' },
          { label: 'PENDING APPROVALS', value: pendingApprovals, icon: ClipboardList, color: 'text-amber-600' },
          { label: 'AI DECISIONS (30d)', value: statsData?.total_decisions ?? decisions.length, icon: Bot, color: 'text-blue-600' },
          { label: 'AI ACCEPTANCE RATE', value: statsData?.acceptance_rate_pct != null ? `${statsData.acceptance_rate_pct}%` : '—', icon: CheckCircle, color: statsData?.status === 'on_target' ? 'text-green-600' : 'text-amber-600' },
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Risk / AI Policies */}
        <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader className="px-5 pt-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-violet-600" />
              Risk &amp; AI Policies
            </CardTitle>
            <Link href={`/developer/${tenantId}/ai-governance`}>
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 text-slate-500">
                <ExternalLink className="w-3 h-3" /> AI Governance
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {loadingPolicies ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
            ) : policies.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2 text-slate-400">
                <ShieldCheck className="w-8 h-8" />
                <p className="text-xs">No policies configured yet.</p>
                <p className="text-[10px] text-center max-w-xs">Configure AI usage limits, SDR guardrails, and compliance rules via the AI Governance page.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {policies.map((p) => (
                  <div key={p.id} className="flex items-start justify-between py-3 first:pt-0 last:pb-0 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                      {p.description && <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{p.description}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge className={`text-[10px] ${POLICY_TYPE_COLOR[p.policyType] ?? POLICY_TYPE_COLOR.default}`}>
                        {p.policyType}
                      </Badge>
                      <Badge className={p.isActive
                        ? 'text-[10px] bg-green-100 text-green-700'
                        : 'text-[10px] bg-slate-100 text-slate-500'}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader className="px-5 pt-4 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-600" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {loadingApprovals ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
            ) : approvals.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2 text-slate-400">
                <CheckCircle className="w-8 h-8" />
                <p className="text-xs">No pending approvals.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {approvals.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 capitalize truncate">{a.entityType.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] text-slate-500 truncate">{a.entityId}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <Badge className="text-[10px] bg-amber-100 text-amber-700">Pending</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Decisions log — M3 governance */}
      <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <CardHeader className="px-5 pt-4 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-600" />
            Recent AI Decisions
          </CardTitle>
          <div className="flex items-center gap-3">
            {statsData && (
              <span className="text-[10px] text-slate-500">
                {statsData.overrides} override{statsData.overrides !== 1 ? 's' : ''} ·{' '}
                {statsData.acceptance_rate_pct != null ? `${statsData.acceptance_rate_pct}% accepted` : 'no rate data'}
              </span>
            )}
            <p className="text-[10px] text-slate-400">Last 30 days</p>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          {loadingDecisions ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : decisions.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2 text-slate-400">
              <Bot className="w-8 h-8" />
              <p className="text-xs">No AI decisions logged yet.</p>
              <p className="text-[10px]">AI decisions from Revenue IQ, SDR, and automation will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {decisions.map((d) => {
                const isExpanded = expandedId === d.id
                return (
                  <div key={d.id} className="py-3 first:pt-0 last:pb-0">
                    {/* Row header */}
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        className="flex-1 min-w-0 text-left cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : d.id)}
                      >
                        <div className="flex items-center gap-1.5">
                          {isExpanded
                            ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 capitalize truncate">
                            {(d.type ?? 'unknown').replace(/_/g, ' ')}
                            {d.action && <span className="text-slate-500 font-normal"> — {d.action.replace(/_/g, ' ')}</span>}
                          </p>
                        </div>
                        {d.reasoning_trace && !isExpanded && (
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 ml-5">{d.reasoning_trace}</p>
                        )}
                      </button>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {d.confidence != null && (
                          <span className="text-[10px] text-slate-400">{Math.round(d.confidence * 100)}%</span>
                        )}
                        <Badge className={
                          d.outcome === 'accepted' ? 'text-[10px] bg-green-100 text-green-700' :
                          d.outcome === 'rejected' || d.outcome === 'overridden' ? 'text-[10px] bg-red-100 text-red-700' :
                          'text-[10px] bg-amber-100 text-amber-700'
                        }>
                          {d.outcome}
                        </Badge>
                      </div>
                    </div>

                    {/* Expanded detail + override form */}
                    {isExpanded && (
                      <div className="mt-3 ml-5 space-y-3">
                        {d.reasoning_trace && (
                          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Reasoning trace</p>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{d.reasoning_trace}</p>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 space-y-0.5">
                          <p>Actor: {d.actor ?? 'system'} · Entity: {d.entity_id ?? '—'}</p>
                          {d.override_reason && <p className="text-amber-600">Override reason: {d.override_reason}</p>}
                        </div>

                        {/* Override form (only when not already overridden) */}
                        {d.outcome !== 'overridden' && (
                          <div className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 space-y-2">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                              <RotateCcw className="w-3 h-3" /> Human Override
                            </p>
                            <div className="flex gap-2">
                              <select
                                value={overrideOutcome}
                                onChange={(e) => setOverrideOutcome(e.target.value as 'accepted' | 'rejected' | 'overridden')}
                                className="text-xs border border-slate-200 dark:border-slate-700 rounded px-2 py-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer"
                              >
                                <option value="accepted">Accept</option>
                                <option value="rejected">Reject</option>
                                <option value="overridden">Override</option>
                              </select>
                              <input
                                type="text"
                                placeholder="Reason (required)"
                                value={overrideReason}
                                onChange={(e) => setOverrideReason(e.target.value)}
                                className="flex-1 text-xs border border-slate-200 dark:border-slate-700 rounded px-2 py-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                              />
                              <Button
                                size="sm"
                                className="h-7 text-xs"
                                disabled={!overrideReason.trim() || overrideMutation.isPending}
                                onClick={() => overrideMutation.mutate({
                                  id: d.id,
                                  outcome: overrideOutcome,
                                  reason: overrideReason.trim(),
                                })}
                              >
                                {overrideMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Submit'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* M2 SDR guardrails reference card */}
      <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <CardHeader className="px-5 pt-4 pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Compliance &amp; AI Limits
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400">
            {[
              {
                title: 'SDR Guardrails',
                desc: 'Each SDR playbook enforces max_contacts, rate_limit_per_hour, cooldown_hours, and require_approval. Runs that violate guardrails are blocked at API level.',
                link: `/crm/${tenantId}/SDR`,
                linkLabel: 'View SDR Playbooks',
              },
              {
                title: 'AI Decision Audit',
                desc: 'Every AI recommendation (Revenue IQ, Co-founder, SDR) is logged with outcome, confidence, and rationale. Export via Audit API for compliance review.',
                link: `/developer/${tenantId}/ai-governance/audit-trail`,
                linkLabel: 'View Audit Trail',
              },
              {
                title: 'Approval Workflows',
                desc: 'Quotes, contracts, and SDR runs requiring approval are queued here. Pending items must be approved before execution proceeds.',
                link: `/crm/${tenantId}/Quotes`,
                linkLabel: 'View Quotes',
              },
              {
                title: 'Data Retention',
                desc: 'Tenant data retention policies control how long signals, transcripts, and conversation history are stored. Configure via Tenant Settings.',
                link: `/settings/${tenantId}/Tenant`,
                linkLabel: 'Tenant Settings',
              },
            ].map(({ title, desc, link, linkLabel }) => (
              <div key={title} className="space-y-1.5">
                <p className="font-semibold text-slate-700 dark:text-slate-300">{title}</p>
                <p className="leading-relaxed">{desc}</p>
                <Link href={link} className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-700 font-medium">
                  {linkLabel} <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
