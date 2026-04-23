'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Copy } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { PageLoading } from '@/components/ui/loading'
import { CopyAction, COPY_ACTION_PRESETS } from '@/components/ui/copy-action'

interface Campaign {
  id: string
  name: string
  type: string
  subject?: string
  content: string
  status: string
  scheduledFor?: string
  sentAt?: string
  recipientCount?: number
  sent?: number
  delivered?: number
  opened?: number
  clicked?: number
  bounced?: number
  unsubscribed?: number
  analytics?: {
    openRate: number
    clickRate: number
    clickThroughRate: number
  }
  createdAt: string
}

interface CampaignProgressData {
  campaign: {
    id: string
    status: string
    recipientCount: number
    sent: number
    delivered: number
    bounced: number
    opened: number
    clicked: number
    sentAt?: string
  }
  queue: {
    total: number
    pending: number
    processing: number
    sent: number
    failed: number
    deadLetter?: number
    completed: number
    completionPercent: number
    isComplete: boolean
    topFailureReasons?: Array<{ reason: string | null; count: number }>
  }
}

interface FailedJob {
  id: string
  status: string
  attempts: number
  maxRetries: number
  toEmails: string[]
  error: string | null
  updatedAt: string
}

interface SenderAccountOption {
  id: string
  email: string
  displayName?: string | null
  provider?: string
}

interface SenderPolicyData {
  policy: {
    senderAccountId: string | null
    senderDomain: string | null
    updatedAt: string | null
  }
  senderAccounts: SenderAccountOption[]
}

interface RetryBatchResponse {
  success: boolean
  data?: {
    retried?: number
    retryOperationId?: string
    requested?: number
    skippedNoRecipient?: number
    skippedNoRecipientJobIds?: string[]
    selectedButNotRetriableCount?: number
    selectedButNotRetriableJobIds?: string[]
    retriedJobIds?: string[]
    senderRouting?: {
      usedRowOverrideCount?: number
      usedBatchOverrideCount?: number
      usedOriginalAccountCount?: number
      usedAutoAccountSelectionCount?: number
      retriedBySenderAccount?: Record<string, number>
    }
  }
}

interface RetrySummaryState {
  scope: 'all' | 'selected' | 'single'
  updatedAt: string
  data: NonNullable<RetryBatchResponse['data']>
}

interface RetryHistoryItem {
  id: string
  action: string
  changedBy: string
  timestamp: string
  retryOperationId: string | null
  retried: number
  requested: number
  skippedNoRecipient: number
  selectedButNotRetriableCount: number
}

export default function CampaignDetailPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const router = useRouter()
  const id = params.id as string
  const { token } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedSenderAccountId, setSelectedSenderAccountId] = useState('')
  const [selectedSenderDomain, setSelectedSenderDomain] = useState('')
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([])
  const [rowSenderOverrideByJobId, setRowSenderOverrideByJobId] = useState<Record<string, string>>({})
  const [lastRetrySummary, setLastRetrySummary] = useState<RetrySummaryState | null>(null)

  const summarizeIds = (ids?: string[], max = 5) => {
    if (!ids?.length) return 'none'
    const visible = ids.slice(0, max)
    const remainder = ids.length - visible.length
    return remainder > 0 ? `${visible.join(', ')} (+${remainder} more)` : visible.join(', ')
  }

  const formatRetrySummary = (response: RetryBatchResponse, label: 'all' | 'selected' | 'single') => {
    const retried = response?.data?.retried ?? 0
    const requested = response?.data?.requested ?? 0
    const skippedNoRecipient = response?.data?.skippedNoRecipient ?? 0
    const selectedButNotRetriableCount = response?.data?.selectedButNotRetriableCount ?? 0
    const routing = response?.data?.senderRouting
    const senderBreakdown = routing?.retriedBySenderAccount
      ? Object.entries(routing.retriedBySenderAccount)
          .map(([sender, count]) => `${sender === 'auto' ? 'auto' : sender}: ${count}`)
          .join(', ')
      : 'none'

    const scopeLabel = label === 'selected' ? 'selected failed jobs' : label === 'single' ? 'single failed job' : 'failed jobs'
    return [
      `Requeued ${retried}/${requested} ${scopeLabel}.`,
      `Retry operation ID: ${response?.data?.retryOperationId || 'n/a'}.`,
      `Skipped no-recipient: ${skippedNoRecipient}.`,
      `Skipped no-recipient job IDs: ${summarizeIds(response?.data?.skippedNoRecipientJobIds)}.`,
      `Selected but not retriable: ${selectedButNotRetriableCount}.`,
      `Selected but not retriable job IDs: ${summarizeIds(response?.data?.selectedButNotRetriableJobIds)}.`,
      `Retried job IDs: ${summarizeIds(response?.data?.retriedJobIds)}.`,
      `Sender usage - row override: ${routing?.usedRowOverrideCount ?? 0}, batch override: ${routing?.usedBatchOverrideCount ?? 0}, original: ${routing?.usedOriginalAccountCount ?? 0}, auto: ${routing?.usedAutoAccountSelectionCount ?? 0}.`,
      `By sender: ${senderBreakdown}.`,
    ].join('\n')
  }

  const formatPersistedRetrySummary = (summary: RetrySummaryState) => {
    const retried = summary?.data?.retried ?? 0
    const requested = summary?.data?.requested ?? 0
    const skippedNoRecipient = summary?.data?.skippedNoRecipient ?? 0
    const selectedButNotRetriableCount = summary?.data?.selectedButNotRetriableCount ?? 0
    const routing = summary?.data?.senderRouting
    const senderBreakdown = routing?.retriedBySenderAccount
      ? Object.entries(routing.retriedBySenderAccount)
          .map(([sender, count]) => `${sender === 'auto' ? 'auto' : sender}: ${count}`)
          .join(', ')
      : 'none'

    return [
      `Last retry result (${summary.scope === 'selected' ? 'selected failed jobs' : summary.scope === 'single' ? 'single failed job' : 'all failed jobs'}) at ${new Date(
        summary.updatedAt
      ).toISOString()}.`,
      `Requeued ${retried}/${requested}.`,
      `Retry operation ID: ${summary?.data?.retryOperationId || 'n/a'}.`,
      `Skipped no-recipient: ${skippedNoRecipient}.`,
      `Skipped no-recipient job IDs: ${summarizeIds(summary?.data?.skippedNoRecipientJobIds)}.`,
      `Selected but not retriable: ${selectedButNotRetriableCount}.`,
      `Selected but not retriable job IDs: ${summarizeIds(summary?.data?.selectedButNotRetriableJobIds)}.`,
      `Retried job IDs: ${summarizeIds(summary?.data?.retriedJobIds)}.`,
      `Sender usage - row override: ${routing?.usedRowOverrideCount ?? 0}, batch override: ${routing?.usedBatchOverrideCount ?? 0}, original: ${routing?.usedOriginalAccountCount ?? 0}, auto: ${routing?.usedAutoAccountSelectionCount ?? 0}.`,
      `By sender: ${senderBreakdown}.`,
    ].join('\n')
  }

  const persistRetrySummary = (summary: RetrySummaryState) => {
    setLastRetrySummary(summary)
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`campaign-retry-summary:${id}`, JSON.stringify(summary))
      }
    } catch {
      // Best-effort persistence for QA visibility; ignore storage errors.
    }
  }

  const clearRetrySummary = () => {
    setLastRetrySummary(null)
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(`campaign-retry-summary:${id}`)
      }
    } catch {
      // Ignore storage cleanup errors.
    }
  }

  useEffect(() => {
    if (!id) return
    try {
      if (typeof window === 'undefined') return
      const raw = window.localStorage.getItem(`campaign-retry-summary:${id}`)
      if (!raw) return
      const parsed = JSON.parse(raw) as RetrySummaryState
      if (!parsed?.updatedAt || !parsed?.data) return
      setLastRetrySummary(parsed)
    } catch {
      // Ignore invalid localStorage payloads.
    }
  }, [id])

  const { data: campaign, isLoading } = useQuery<Campaign>({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const response = await fetch(`/api/marketing/campaigns/${id}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (!response.ok) throw new Error('Failed to fetch campaign')
      return response.json()
    },
  })

  const { data: progress } = useQuery<CampaignProgressData>({
    queryKey: ['email-campaign-progress', id],
    queryFn: async () => {
      const response = await fetch(`/api/marketing/email-campaigns/${id}/progress`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (!response.ok) throw new Error('Failed to fetch campaign progress')
      const data = await response.json()
      if (!data.success) throw new Error(data.error || 'Failed to fetch campaign progress')
      return data.data as CampaignProgressData
    },
    refetchInterval: 10000,
    enabled: Boolean(id),
  })

  const { data: failedJobs } = useQuery<{ jobs: FailedJob[] }>({
    queryKey: ['email-campaign-failed-jobs', id],
    queryFn: async () => {
      const response = await fetch(`/api/marketing/email-campaigns/${id}/failed-jobs?page=1&pageSize=25`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (!response.ok) throw new Error('Failed to fetch failed jobs')
      const data = await response.json()
      if (!data.success) throw new Error(data.error || 'Failed to fetch failed jobs')
      return data.data as { jobs: FailedJob[] }
    },
    refetchInterval: 15000,
    enabled: Boolean(id),
  })

  const { data: senderPolicy } = useQuery<SenderPolicyData>({
    queryKey: ['email-campaign-sender-policy', id],
    queryFn: async () => {
      const response = await fetch(`/api/marketing/email-campaigns/${id}/sender-policy`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (!response.ok) throw new Error('Failed to fetch sender policy')
      const data = await response.json()
      if (!data.success) throw new Error(data.error || 'Failed to fetch sender policy')
      return data.data as SenderPolicyData
    },
    enabled: Boolean(id),
  })

  const { data: retryHistory } = useQuery<{ items: RetryHistoryItem[] }>({
    queryKey: ['email-campaign-retry-history', id],
    queryFn: async () => {
      const response = await fetch(`/api/marketing/email-campaigns/${id}/retry-history?limit=10`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (!response.ok) throw new Error('Failed to fetch retry history')
      const data = await response.json()
      if (!data.success) throw new Error(data.error || 'Failed to fetch retry history')
      return data.data as { items: RetryHistoryItem[] }
    },
    refetchInterval: 15000,
    enabled: Boolean(id),
  })

  useEffect(() => {
    if (!senderPolicy) return
    setSelectedSenderAccountId(senderPolicy.policy.senderAccountId || '')
    setSelectedSenderDomain(senderPolicy.policy.senderDomain || '')
  }, [senderPolicy])

  useEffect(() => {
    if (!failedJobs?.jobs?.length) {
      setSelectedJobIds([])
      setRowSenderOverrideByJobId({})
      return
    }

    const jobIds = new Set(failedJobs.jobs.map((job) => job.id))
    setSelectedJobIds((current) => current.filter((id) => jobIds.has(id)))
    setRowSenderOverrideByJobId((current) => {
      const next: Record<string, string> = {}
      for (const [jobId, accountId] of Object.entries(current)) {
        if (jobIds.has(jobId)) {
          next[jobId] = accountId
        }
      }
      return next
    })
  }, [failedJobs])

  const sendCampaign = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/marketing/campaigns/${id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send campaign')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] })
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      alert('Campaign queued for sending!')
    },
  })

  const retryFailedJobs = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/marketing/email-campaigns/${id}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ limit: 500 }),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error((error as { error?: string }).error || 'Failed to retry failed jobs')
      }
      return response.json() as Promise<RetryBatchResponse>
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] })
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['email-campaign-progress', id] })
      queryClient.invalidateQueries({ queryKey: ['email-campaign-failed-jobs', id] })
      queryClient.invalidateQueries({ queryKey: ['email-campaign-retry-history', id] })
      const summary: RetrySummaryState = {
        scope: 'all',
        updatedAt: new Date().toISOString(),
        data: data?.data || {},
      }
      persistRetrySummary(summary)
      alert(formatRetrySummary(data, 'all'))
    },
  })

  const retrySelectedFailedJobs = useMutation({
    mutationFn: async () => {
      const senderAccountIdByJobId = selectedJobIds.reduce<Record<string, string>>((acc, jobId) => {
        const overrideSenderAccountId = rowSenderOverrideByJobId[jobId]
        if (overrideSenderAccountId) {
          acc[jobId] = overrideSenderAccountId
        }
        return acc
      }, {})
      const response = await fetch(`/api/marketing/email-campaigns/${id}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          jobIds: selectedJobIds,
          senderAccountId: selectedSenderAccountId || undefined,
          senderAccountIdByJobId: Object.keys(senderAccountIdByJobId).length > 0 ? senderAccountIdByJobId : undefined,
        }),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error((error as { error?: string }).error || 'Failed to retry selected jobs')
      }
      return response.json() as Promise<RetryBatchResponse>
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] })
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['email-campaign-progress', id] })
      queryClient.invalidateQueries({ queryKey: ['email-campaign-failed-jobs', id] })
      queryClient.invalidateQueries({ queryKey: ['email-campaign-retry-history', id] })
      setSelectedJobIds([])
      const summary: RetrySummaryState = {
        scope: 'selected',
        updatedAt: new Date().toISOString(),
        data: data?.data || {},
      }
      persistRetrySummary(summary)
      alert(formatRetrySummary(data, 'selected'))
    },
  })

  const retrySingleFailedJob = useMutation({
    mutationFn: async ({ jobId, senderAccountId }: { jobId: string; senderAccountId?: string }) => {
      const response = await fetch(`/api/marketing/email-campaigns/${id}/retry/${jobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          senderAccountId: senderAccountId || undefined,
        }),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error((error as { error?: string }).error || 'Failed to retry job')
      }
      return response.json() as Promise<RetryBatchResponse>
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] })
      queryClient.invalidateQueries({ queryKey: ['email-campaign-progress', id] })
      queryClient.invalidateQueries({ queryKey: ['email-campaign-failed-jobs', id] })
      queryClient.invalidateQueries({ queryKey: ['email-campaign-retry-history', id] })
      const summary: RetrySummaryState = {
        scope: 'single',
        updatedAt: new Date().toISOString(),
        data: data?.data || {},
      }
      persistRetrySummary(summary)
      alert(formatRetrySummary(data, 'single'))
    },
  })

  const toggleSelectJob = (jobId: string) => {
    setSelectedJobIds((current) =>
      current.includes(jobId) ? current.filter((id) => id !== jobId) : [...current, jobId]
    )
  }

  const toggleSelectAllVisible = () => {
    const visibleIds = failedJobs?.jobs?.map((job) => job.id) || []
    if (visibleIds.length === 0) return
    const allSelected = visibleIds.every((id) => selectedJobIds.includes(id))
    setSelectedJobIds((current) => {
      if (allSelected) {
        return current.filter((id) => !visibleIds.includes(id))
      }
      return Array.from(new Set([...current, ...visibleIds]))
    })
  }

  const updateSenderPolicy = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/marketing/email-campaigns/${id}/sender-policy`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          senderAccountId: selectedSenderAccountId || null,
          senderDomain: selectedSenderDomain || null,
        }),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error((error as { error?: string }).error || 'Failed to update sender policy')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaign-sender-policy', id] })
      alert('Sender policy updated.')
    },
  })

  if (isLoading) {
    return <PageLoading message="Loading campaign..." fullScreen={false} />
  }

  if (!campaign) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Campaign not found</p>
        <Link href={`/marketing/${tenantId}/Campaigns`}>
          <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Back to Campaigns</Button>
        </Link>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      sent: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  const n = (v: number | undefined) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0)
  const rc = n(campaign.recipientCount)
  const sent = n(campaign.sent)
  const delivered = n(campaign.delivered)
  const opened = n(campaign.opened)
  const clicked = n(campaign.clicked)
  const bounced = n(campaign.bounced)
  const showAnalytics = sent > 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{campaign.name}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 capitalize">{campaign.type} Campaign</p>
        </div>
        <div className="flex gap-2">
          {campaign?.status === 'draft' && (
            <Button
              onClick={() => {
                if (confirm(`Are you sure you want to send this campaign to ${rc} recipients?`)) {
                  sendCampaign.mutate()
                }
              }}
              disabled={sendCampaign.isPending}
              className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
            >
              {sendCampaign.isPending ? 'Sending...' : '📤 Send Now'}
            </Button>
          )}
          <Link href={`/marketing/${tenantId}/Campaigns`}>
            <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Back</Button>
          </Link>
        </div>
      </div>

      {/* Status and Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                campaign.status
              )}`}
            >
              {campaign.status}
            </span>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{rc.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{sent.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics — any campaign with sends (includes status "completed" from some flows) */}
      {showAnalytics && (
        <>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Campaign Analytics</CardTitle>
              <CardDescription className="dark:text-gray-400">Performance metrics for this campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Delivered</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{delivered.toLocaleString('en-IN')}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {sent > 0
                      ? `${((delivered / sent) * 100).toFixed(1)}%`
                      : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Opened</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{opened.toLocaleString('en-IN')}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {delivered > 0
                      ? `${((opened / delivered) * 100).toFixed(1)}%`
                      : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Clicked</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{clicked.toLocaleString('en-IN')}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {opened > 0
                      ? `${((clicked / opened) * 100).toFixed(1)}%`
                      : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Bounced</div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {bounced.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {sent > 0
                      ? `${((bounced / sent) * 100).toFixed(1)}%`
                      : '-'}
                  </div>
                </div>
              </div>

              {/* Visualization Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Delivery Status Pie Chart */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Delivery Status</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Delivered', value: delivered, fill: '#10b981' },
                          { name: 'Bounced', value: bounced, fill: '#ef4444' },
                          { name: 'Pending', value: Math.max(0, sent - delivered - bounced), fill: '#f59e0b' },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Delivered', value: campaign.delivered, fill: '#10b981' },
                          { name: 'Bounced', value: campaign.bounced, fill: '#ef4444' },
                          { name: 'Pending', value: campaign.sent - campaign.delivered - campaign.bounced, fill: '#f59e0b' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Engagement Bar Chart */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Engagement Metrics</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={[
                        { name: 'Sent', value: sent },
                        { name: 'Delivered', value: delivered },
                        { name: 'Opened', value: opened },
                        { name: 'Clicked', value: clicked },
                      ]}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#53328A" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Campaign Details */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Campaign Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {campaign.subject && (
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Subject</div>
              <div className="font-medium text-gray-900 dark:text-gray-100">{campaign.subject}</div>
            </div>
          )}
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Content</div>
            <div className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 p-4 rounded-md text-gray-900 dark:text-gray-100">
              {campaign.content}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Created</div>
              <div className="text-gray-900 dark:text-gray-100">
                {campaign.createdAt
                  ? format(new Date(campaign.createdAt), 'MMMM dd, yyyy HH:mm')
                  : '-'}
              </div>
            </div>
            {campaign.scheduledFor && (
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Scheduled For</div>
                <div className="text-gray-900 dark:text-gray-100">
                  {format(new Date(campaign.scheduledFor), 'MMMM dd, yyyy HH:mm')}
                </div>
              </div>
            )}
            {campaign.sentAt && (
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sent At</div>
                <div className="text-gray-900 dark:text-gray-100">{format(new Date(campaign.sentAt), 'MMMM dd, yyyy HH:mm')}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Queue Progress */}
      {progress && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Queue Progress</CardTitle>
            <CardDescription className="dark:text-gray-400">
              {progress.queue.completionPercent.toFixed(1)}% complete ({progress.queue.completed}/{progress.queue.total})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div>Pending: <strong>{progress.queue.pending}</strong></div>
              <div>Processing: <strong>{progress.queue.processing}</strong></div>
              <div>Sent: <strong>{progress.queue.sent}</strong></div>
              <div>Failed: <strong>{progress.queue.failed}</strong></div>
              <div>Dead-letter: <strong>{progress.queue.deadLetter || 0}</strong></div>
              <div>Total: <strong>{progress.queue.total}</strong></div>
            </div>
            {progress.queue.topFailureReasons && progress.queue.topFailureReasons.length > 0 && (
              <div className="space-y-1">
                <div className="font-medium dark:text-gray-200">Top failure reasons</div>
                {progress.queue.topFailureReasons.map((item, idx) => (
                  <div key={`${item.reason}-${idx}`} className="text-red-600 dark:text-red-400">
                    {(item.reason || 'Unknown failure')} ({item.count})
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sender Policy */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Sender Policy</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Control preferred sender account/domain for retries and future dispatches.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-gray-600 dark:text-gray-300">Preferred sender account</label>
            <select
              value={selectedSenderAccountId}
              onChange={(e) => setSelectedSenderAccountId(e.target.value)}
              className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3"
            >
              <option value="">Auto select sender</option>
              {(senderPolicy?.senderAccounts || []).map((account) => (
                <option key={account.id} value={account.id}>
                  {account.displayName ? `${account.displayName} (${account.email})` : account.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-600 dark:text-gray-300">Preferred sender domain</label>
            <input
              type="text"
              value={selectedSenderDomain}
              onChange={(e) => setSelectedSenderDomain(e.target.value.trim().toLowerCase())}
              placeholder="example.com"
              className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3"
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => updateSenderPolicy.mutate()}
              disabled={updateSenderPolicy.isPending}
              className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
            >
              {updateSenderPolicy.isPending ? 'Saving...' : 'Save Sender Policy'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Failed Jobs + Retry */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="dark:text-gray-100">Failed / Dead-letter Jobs</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Review failed sends and retry in batch.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => retrySelectedFailedJobs.mutate()}
                disabled={retrySelectedFailedJobs.isPending || selectedJobIds.length === 0}
                variant="outline"
                className="dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                {retrySelectedFailedJobs.isPending
                  ? 'Requeueing Selected...'
                  : `Retry Selected (${selectedJobIds.length})`}
              </Button>
              <Button
                onClick={() => retryFailedJobs.mutate()}
                disabled={retryFailedJobs.isPending || !(failedJobs?.jobs?.length)}
                className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              >
                {retryFailedJobs.isPending ? 'Requeueing All...' : 'Retry All Failed'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {lastRetrySummary && (
            <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950 p-3 text-xs space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-blue-800 dark:text-blue-200">
                  Last retry result ({lastRetrySummary.scope === 'selected' ? 'selected' : lastRetrySummary.scope === 'single' ? 'single' : 'all failed'}) -{' '}
                  {format(new Date(lastRetrySummary.updatedAt), 'MMM dd, HH:mm:ss')}
                </div>
                <div className="flex items-center gap-2">
                  <CopyAction
                    textToCopy={() => formatPersistedRetrySummary(lastRetrySummary)}
                    successMessage="Retry summary copied to clipboard."
                    label="Copy Summary"
                    icon={<Copy className="w-3.5 h-3.5 mr-1" />}
                    copiedLabel="Copied"
                    buttonProps={{
                      size: 'sm',
                      variant: 'outline',
                      className: 'h-7 px-2 text-xs dark:border-blue-800 dark:text-blue-100 dark:hover:bg-blue-900',
                    }}
                    showFeedback={false}
                    {...COPY_ACTION_PRESETS.compactSettings}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearRetrySummary}
                    className="h-7 px-2 text-xs dark:border-blue-800 dark:text-blue-100 dark:hover:bg-blue-900"
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <div className="text-blue-800 dark:text-blue-200">
                Requeued {lastRetrySummary.data.retried ?? 0}/{lastRetrySummary.data.requested ?? 0}; skipped no-recipient:{' '}
                {lastRetrySummary.data.skippedNoRecipient ?? 0}; selected but not retriable:{' '}
                {lastRetrySummary.data.selectedButNotRetriableCount ?? 0}
              </div>
              <div className="text-blue-700 dark:text-blue-300">
                Retry operation ID: {lastRetrySummary.data.retryOperationId || 'n/a'}
              </div>
              <div className="text-blue-700 dark:text-blue-300">
                Retried job IDs: {summarizeIds(lastRetrySummary.data.retriedJobIds)}
              </div>
              <div className="text-blue-700 dark:text-blue-300">
                Skipped no-recipient IDs: {summarizeIds(lastRetrySummary.data.skippedNoRecipientJobIds)}
              </div>
              <div className="text-blue-700 dark:text-blue-300">
                Selected-but-not-retriable IDs: {summarizeIds(lastRetrySummary.data.selectedButNotRetriableJobIds)}
              </div>
              <div className="text-blue-700 dark:text-blue-300">
                Sender usage - row override: {lastRetrySummary.data.senderRouting?.usedRowOverrideCount ?? 0}, batch
                override: {lastRetrySummary.data.senderRouting?.usedBatchOverrideCount ?? 0}, original:{' '}
                {lastRetrySummary.data.senderRouting?.usedOriginalAccountCount ?? 0}, auto:{' '}
                {lastRetrySummary.data.senderRouting?.usedAutoAccountSelectionCount ?? 0}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {Object.entries(lastRetrySummary.data.senderRouting?.retriedBySenderAccount || {}).map(([sender, count]) => (
                  <span
                    key={sender}
                    className="inline-flex items-center rounded-full border border-blue-300 dark:border-blue-700 px-2 py-0.5 text-[11px] text-blue-800 dark:text-blue-200"
                  >
                    {sender === 'auto' ? 'auto' : sender}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
          {!failedJobs?.jobs?.length ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">No failed jobs.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-2">
                      <input
                        type="checkbox"
                        checked={
                          !!failedJobs?.jobs?.length &&
                          failedJobs.jobs.every((job) => selectedJobIds.includes(job.id))
                        }
                        onChange={toggleSelectAllVisible}
                      />
                    </th>
                    <th className="text-left py-2">Recipient</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Attempts</th>
                    <th className="text-left py-2">Error</th>
                    <th className="text-left py-2">Updated</th>
                    <th className="text-left py-2">Sender Override</th>
                    <th className="text-left py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {failedJobs.jobs.map((job) => (
                    <tr key={job.id} className="border-b dark:border-gray-700">
                      <td className="py-2">
                        <input
                          type="checkbox"
                          checked={selectedJobIds.includes(job.id)}
                          onChange={() => toggleSelectJob(job.id)}
                        />
                      </td>
                      <td className="py-2">{job.toEmails?.[0] || '-'}</td>
                      <td className="py-2">{job.status}</td>
                      <td className="py-2">
                        {job.attempts}/{job.maxRetries}
                      </td>
                      <td className="py-2 text-red-600 dark:text-red-400 max-w-[360px] truncate">
                        {job.error || 'Unknown error'}
                      </td>
                      <td className="py-2">{format(new Date(job.updatedAt), 'MMM dd, HH:mm')}</td>
                      <td className="py-2">
                        <select
                          value={rowSenderOverrideByJobId[job.id] || ''}
                          onChange={(e) =>
                            setRowSenderOverrideByJobId((current) => ({
                              ...current,
                              [job.id]: e.target.value,
                            }))
                          }
                          className="h-8 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-2 text-xs min-w-[180px]"
                        >
                          <option value="">Default policy</option>
                          {(senderPolicy?.senderAccounts || []).map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.displayName ? `${account.displayName} (${account.email})` : account.email}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            retrySingleFailedJob.mutate({
                              jobId: job.id,
                              senderAccountId: rowSenderOverrideByJobId[job.id] || selectedSenderAccountId || undefined,
                            })
                          }
                          disabled={retrySingleFailedJob.isPending}
                          className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                          Retry
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Retry History */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Retry History</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Recent retry audit records (batch + single) for QA correlation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!retryHistory?.items?.length ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">No retry history yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-2">Time</th>
                    <th className="text-left py-2">Action</th>
                    <th className="text-left py-2">Operation ID</th>
                    <th className="text-left py-2">Counts</th>
                    <th className="text-left py-2">By</th>
                  </tr>
                </thead>
                <tbody>
                  {retryHistory.items.map((item) => (
                    <tr key={item.id} className="border-b dark:border-gray-700">
                      <td className="py-2">{format(new Date(item.timestamp), 'MMM dd, HH:mm:ss')}</td>
                      <td className="py-2">
                        {item.action === 'email_campaign_retry_single' ? 'single' : 'batch'}
                      </td>
                      <td className="py-2 font-mono text-xs">{item.retryOperationId || '-'}</td>
                      <td className="py-2">
                        {item.retried}/{item.requested}
                        <span className="text-gray-500 dark:text-gray-400">
                          {' '}
                          (skip-no-recipient: {item.skippedNoRecipient}, not-retriable: {item.selectedButNotRetriableCount})
                        </span>
                      </td>
                      <td className="py-2">{item.changedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
