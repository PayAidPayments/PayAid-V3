'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageLoading } from '@/components/ui/loading'
import {
  Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed,
  Clock, FileText, ChevronDown, ChevronUp, User,
  MessageSquare, RefreshCw, BarChart2,
} from 'lucide-react'
import { format } from 'date-fns'

type Call = {
  id: string
  phoneNumber: string
  direction: 'INBOUND' | 'OUTBOUND'
  status: string
  duration?: number | null
  startedAt?: string | null
  endedAt?: string | null
  notes?: string | null
  summary?: string | null
  sentiment?: string | null
  _count?: { recordings: number; transcripts: number }
}

type Transcript = {
  id: string
  text: string
  confidence: number | null
  summary: string | null
  sentiment: string | null
  createdAt: string
}

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  MISSED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  FAILED: 'bg-red-100 text-red-700',
  RINGING: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  NO_ANSWER: 'bg-gray-100 text-gray-600',
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

function CallRow({ call }: { call: Call }) {
  const [expanded, setExpanded] = useState(false)
  const [transcript, setTranscript] = useState<Transcript | null | 'loading'>(null)

  const loadTranscript = async () => {
    if (transcript !== null) { setExpanded(!expanded); return }
    setTranscript('loading')
    setExpanded(true)
    try {
      const res = await apiRequest(`/api/v1/calls/${call.id}/transcript`)
      const data = await res.json()
      setTranscript(data.transcript ?? null)
    } catch {
      setTranscript(null)
    }
  }

  const Icon = call.direction === 'INBOUND' ? PhoneIncoming
    : call.status === 'MISSED' || call.status === 'NO_ANSWER' ? PhoneMissed
    : PhoneOutgoing

  const iconColor = call.direction === 'INBOUND' ? 'text-blue-600'
    : call.status === 'MISSED' ? 'text-red-500'
    : 'text-emerald-600'

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
        onClick={loadTranscript}
      >
        <div className={`w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-gray-900 dark:text-gray-100">{call.phoneNumber}</p>
            <Badge className={`text-xs border-0 ${STATUS_COLOR[call.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {call.status.replace('_', ' ')}
            </Badge>
            <span className="text-xs text-gray-400 capitalize">
              {call.direction.toLowerCase()}
            </span>
          </div>
          {call.startedAt && (
            <p className="text-xs text-gray-500 mt-0.5">
              {format(new Date(call.startedAt), 'dd MMM yyyy, h:mm a')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0 text-sm text-gray-500">
          {call.duration ? (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(call.duration)}
            </span>
          ) : null}
          {(call._count?.transcripts ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-blue-500">
              <FileText className="w-3.5 h-3.5" />
              Transcript
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4 space-y-3">
          {call.notes && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{call.notes}</p>
            </div>
          )}

          {transcript === 'loading' ? (
            <p className="text-sm text-gray-400 animate-pulse">Loading transcript…</p>
          ) : transcript ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Transcript
                {transcript.sentiment && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-normal ${
                    transcript.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-600'
                    : transcript.sentiment === 'negative' ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-600'
                  }`}>
                    {transcript.sentiment}
                  </span>
                )}
              </p>
              {transcript.summary && (
                <p className="text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded px-3 py-2 mb-2 italic">
                  {transcript.summary}
                </p>
              )}
              <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                {transcript.text}
              </pre>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No transcript available for this call.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function CallsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const [statusFilter, setStatusFilter] = useState('all')

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['calls', tenantId, statusFilter],
    queryFn: async () => {
      const qs = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
      const res = await apiRequest(`/api/calls${qs}`)
      if (!res.ok) throw new Error('Failed to load calls')
      return res.json()
    },
    enabled: !!tenantId,
  })

  const calls: Call[] = data?.calls ?? []

  const stats = [
    { label: 'Total', value: calls.length, icon: Phone, color: 'text-gray-600' },
    { label: 'Completed', value: calls.filter((c) => c.status === 'COMPLETED').length, icon: PhoneOutgoing, color: 'text-emerald-600' },
    { label: 'Missed', value: calls.filter((c) => c.status === 'MISSED').length, icon: PhoneMissed, color: 'text-red-500' },
    { label: 'Inbound', value: calls.filter((c) => c.direction === 'INBOUND').length, icon: PhoneIncoming, color: 'text-blue-600' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Phone className="w-7 h-7 text-blue-600" />
            Call History
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            All call logs with CRM linkage and transcripts
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <s.icon className={`w-8 h-8 ${s.color}`} />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'COMPLETED', 'MISSED', 'IN_PROGRESS', 'NO_ANSWER'].map((f) => (
          <Button
            key={f}
            size="sm"
            variant={statusFilter === f ? 'default' : 'outline'}
            onClick={() => setStatusFilter(f)}
          >
            {f === 'all' ? 'All' : f.replace('_', ' ')}
          </Button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <PageLoading message="Loading calls…" fullScreen={false} />
      ) : error ? (
        <div className="text-center py-12 text-red-500">Failed to load calls. Please retry.</div>
      ) : calls.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Phone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium mb-1">No calls found</p>
            <p className="text-sm text-gray-400">
              {statusFilter !== 'all'
                ? `No ${statusFilter.toLowerCase().replace('_', ' ')} calls`
                : 'Calls logged via the dialer or API will appear here'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {calls.map((call) => (
            <CallRow key={call.id} call={call} />
          ))}
        </div>
      )}
    </div>
  )
}
