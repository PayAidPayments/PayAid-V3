'use client'

import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function MeetMeetingsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-5">
      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Meetings</CardTitle>
          <CardDescription>
            Tenant: {tenantId || '—'} — scheduling and list UI can be wired here.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 dark:text-slate-400">No meetings yet.</CardContent>
      </Card>
    </div>
  )
}
