'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Search, Download, Play, Loader2 } from 'lucide-react'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token') || localStorage.getItem('auth-token')
}

type TranscriptRow = {
  id: string
  agentName?: string
  phone: string
  inbound: boolean
  status: string
  languageUsed: string | null
  transcript: string | null
  recordingUrl: string | null
  sentiment: string | null
  sentimentScore?: unknown
  startTime: string | null
  durationSeconds: number | null
  createdAt: string
}

export default function VoiceAgentTranscriptsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [q, setQ] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [language, setLanguage] = useState('')
  const [sentiment, setSentiment] = useState('')
  const [rows, setRows] = useState<TranscriptRow[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTrigger, setSearchTrigger] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const search = async () => {
    const token = getToken()
    if (!token) return
    setLoading(true)
    try {
      const sp = new URLSearchParams()
      if (q) sp.set('q', q)
      if (startDate) sp.set('startDate', startDate)
      if (endDate) sp.set('endDate', endDate)
      if (language) sp.set('language', language)
      if (sentiment) sp.set('sentiment', sentiment)
      sp.set('limit', '100')
      const res = await fetch(`/api/v1/voice-agents/transcripts?${sp}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setRows(data.transcripts || [])
      } else {
        setRows([])
      }
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    search()
  }, [searchTrigger])

  const exportCsv = () => {
    const headers = ['Date', 'Agent', 'Phone', 'Direction', 'Status', 'Language', 'Sentiment', 'Duration (s)', 'Transcript']
    const lines = [
      headers.join(','),
      ...rows.map((r) =>
        [
          r.createdAt,
          r.agentName ?? '',
          r.phone,
          r.inbound ? 'inbound' : 'outbound',
          r.status,
          r.languageUsed ?? '',
          r.sentiment ?? '',
          r.durationSeconds ?? '',
          (r.transcript ?? '').replace(/"/g, '""'),
        ].join(',')
      ),
    ]
    const csv = lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcripts-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const playRecording = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    const audio = new Audio(url)
    audioRef.current = audio
    audio.play().catch(() => {})
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/voice-agents/${tenantId}/Home`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Transcripts</h1>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Search calls</CardTitle>
          <CardDescription>Full-text search on transcripts. Filter by date, language, sentiment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <Label className="text-xs">Search text</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="e.g. invoice, meeting, complaint"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setSearchTrigger((t) => t + 1)}
                />
                <Button onClick={() => setSearchTrigger((t) => t + 1)} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">From date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">To date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ta">Tamil</SelectItem>
                  <SelectItem value="te">Telugu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Sentiment</Label>
              <Select value={sentiment} onValueChange={setSentiment}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => setSearchTrigger((t) => t + 1)} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            Search
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Results ({rows.length})</CardTitle>
          <CardDescription>Click play to hear recording snippet when available.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No transcripts found. Try different filters or ensure calls have transcript/recording data.
            </p>
          ) : (
            <div className="space-y-4">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="text-sm">
                      <span className="font-medium">{r.agentName ?? '—'}</span>
                      <span className="text-muted-foreground mx-2">·</span>
                      <span>{r.phone}</span>
                      <span className="text-muted-foreground mx-2">·</span>
                      <span className={r.inbound ? 'text-blue-600' : 'text-amber-600'}>
                        {r.inbound ? 'Inbound' : 'Outbound'}
                      </span>
                      <span className="text-muted-foreground mx-2">·</span>
                      <span>{r.status}</span>
                      {r.languageUsed && (
                        <>
                          <span className="text-muted-foreground mx-2">·</span>
                          <span>{r.languageUsed}</span>
                        </>
                      )}
                      {r.sentiment && (
                        <>
                          <span className="text-muted-foreground mx-2">·</span>
                          <span className={
                            r.sentiment === 'positive' ? 'text-green-600' :
                            r.sentiment === 'negative' ? 'text-red-600' : 'text-muted-foreground'
                          }>
                            {r.sentiment}
                          </span>
                        </>
                      )}
                      {r.durationSeconds != null && (
                        <>
                          <span className="text-muted-foreground mx-2">·</span>
                          <span>{r.durationSeconds}s</span>
                        </>
                      )}
                    </div>
                    {r.recordingUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => playRecording(r.recordingUrl!)}
                        title="Play recording"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Play
                      </Button>
                    )}
                  </div>
                  {r.transcript && (
                    <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap line-clamp-4" title={r.transcript}>
                      {r.transcript}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {r.createdAt}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
