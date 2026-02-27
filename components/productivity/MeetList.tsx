'use client'

import { useState, useEffect } from 'react'
import { Video, Plus, Calendar, Copy, ExternalLink, Loader2, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface MeetingItem {
  id: string
  title: string
  description: string | null
  meetingCode: string
  startTime: string
  endTime: string | null
  status: string
  host?: { name: string | null } | null
}

function formatTime(d: string): string {
  return new Date(d).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export function MeetList({ tenantId }: { tenantId: string }) {
  const router = useRouter()
  const { token } = useAuthStore()
  const [meetings, setMeetings] = useState<MeetingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [joinCode, setJoinCode] = useState('')

  const loadMeetings = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch('/api/meet', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setMeetings(data.meetings || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMeetings()
  }, [token])

  const startInstantMeeting = async () => {
    if (!token) return
    setCreating(true)
    try {
      const res = await fetch('/api/meet', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'Quick meeting', isInstant: true }),
      })
      if (res.ok) {
        const meeting = await res.json()
        router.push(`/productivity/${tenantId}/meet/room/${meeting.meetingCode}`)
      } else {
        alert('Failed to create meeting')
      }
    } catch (e) {
      alert('Failed to create meeting')
    } finally {
      setCreating(false)
    }
  }

  const joinByCode = () => {
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    router.push(`/productivity/${tenantId}/meet/room/${code}`)
  }

  const copyJoinLink = (code: string) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/productivity/${tenantId}/meet/room/${code}` : ''
    navigator.clipboard.writeText(url)
    // Could add toast
  }

  const upcoming = meetings.filter((m) => m.status === 'scheduled' || m.status === 'in-progress')
  const past = meetings.filter((m) => m.status === 'ended' || m.status === 'cancelled')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Meetings</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Start or join a meeting</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={startInstantMeeting} disabled={creating} className="gap-2">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
            Start instant meeting
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Join with code</p>
          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter meeting code"
              className="flex-1 max-w-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm uppercase"
              onKeyDown={(e) => e.key === 'Enter' && joinByCode()}
            />
            <Button size="sm" onClick={joinByCode} disabled={!joinCode.trim()}>
              Join
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Upcoming / in progress
              </h3>
              <ul className="space-y-2">
                {upcoming.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{m.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {formatTime(m.startTime)}
                        {m.host?.name && ` · ${m.host.name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {m.meetingCode}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyJoinLink(m.meetingCode)}
                        className="gap-1"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy link
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => router.push(`/productivity/${tenantId}/meet/room/${m.meetingCode}`)}
                        className="gap-1"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Join
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Past meetings</h3>
              <ul className="space-y-2">
                {past.slice(0, 10).map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 dark:border-slate-800 p-3 text-sm text-slate-600 dark:text-slate-400"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-300">{m.title}</span>
                    <span className="text-xs">{formatTime(m.startTime)}</span>
                    <span className="text-xs font-mono">{m.meetingCode}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {upcoming.length === 0 && past.length === 0 && (
            <Card className="rounded-2xl border border-slate-200 dark:border-slate-800">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Video className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No meetings yet</p>
                <p className="text-xs text-slate-500 mt-1">Start an instant meeting or join with a code</p>
                <Button onClick={startInstantMeeting} disabled={creating} className="mt-4 gap-2">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Start meeting
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
