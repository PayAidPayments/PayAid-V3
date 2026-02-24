'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Video, Calendar } from 'lucide-react'

export default function MeetMeetingsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const [meetings, setMeetings] = useState<any[]>([])
  const { token } = useAuthStore()

  useEffect(() => {
    if (token) {
      fetch('/api/meet', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : { meetings: [] }))
        .then((d) => setMeetings(d.meetings || []))
        .catch(() => setMeetings([]))
    }
  }, [token])

  const upcoming = meetings
    .filter((m) => m.status === 'scheduled' && new Date(m.startTime) >= new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Meetings</CardTitle>
          <CardDescription>Schedule and join video meetings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/dashboard/meet/new" className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <Video className="h-5 w-5" /> New Meeting
          </Link>
          <div className="space-y-2">
            {upcoming.length > 0 ? (
              upcoming.map((m) => (
                <div key={m.id} className="p-4 border rounded-lg flex items-center justify-between hover:border-purple-500">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{m.title}</div>
                      <div className="text-sm text-gray-500">{new Date(m.startTime).toLocaleString()} · Code: {m.meetingCode}</div>
                    </div>
                  </div>
                  <Link href={`/dashboard/meet/${m.id}`} className="text-sm text-purple-600 hover:underline">Open</Link>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Video className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>No upcoming meetings. Create one from Dashboard.</p>
                <Link href="/dashboard/meet/new" className="mt-2 inline-block text-purple-600 hover:underline">Schedule meeting</Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
