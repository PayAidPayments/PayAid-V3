'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Video } from 'lucide-react'

export default function MeetRecordingsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Recordings</CardTitle>
          <CardDescription>Meeting recordings will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <Video className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>No recordings yet. Recordings from your meetings will show here.</p>
            <Link href={`/meet/${tenantId}/Meetings`} className="mt-4 inline-block text-purple-600 hover:underline">View meetings</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
