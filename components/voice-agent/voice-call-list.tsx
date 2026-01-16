'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, Clock, User } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface VoiceCall {
  id: string
  phoneNumber: string
  customerName?: string
  status: string
  durationSeconds?: number
  startTime?: string
  endTime?: string
  languageUsed?: string
  createdAt: string
}

interface VoiceCallListProps {
  calls: VoiceCall[]
  loading: boolean
  onRefresh: () => void
}

export function VoiceCallList({ calls, loading, onRefresh }: VoiceCallListProps) {
  if (loading) {
    return <div className="text-center py-8">Loading calls...</div>
  }

  if (calls.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Phone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No calls yet</h3>
          <p className="text-muted-foreground">
            Initiate your first call to see call history here
          </p>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'answered':
        return 'default'
      case 'failed':
        return 'destructive'
      case 'ringing':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="grid gap-4">
      {calls.map((call) => (
        <Link key={call.id} href={`/dashboard/voice-agents/calls/${call.id}`}>
          <Card className="hover:bg-accent cursor-pointer transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-semibold">
                        {call.customerName || call.phoneNumber}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {call.phoneNumber}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {call.languageUsed && (
                      <span>Language: {call.languageUsed.toUpperCase()}</span>
                    )}
                    {call.durationSeconds && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(call.durationSeconds)}
                      </span>
                    )}
                    <span>
                      {formatDistanceToNow(new Date(call.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <Badge variant={getStatusColor(call.status)}>
                  {call.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

