'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { History, Users, Mail } from 'lucide-react'

interface Broadcast {
  title: string
  message: string
  priority: string
  createdAt: string
  tenantCount: number
  tenants: Array<{ id: string; name: string; tier: string }>
  channels: string[]
}

export function BroadcastHistory() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/super-admin/communication/history?limit=20')
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Server returned non-JSON response:', text.substring(0, 200))
        setLoading(false)
        return
      }

      const data = await response.json()
      if (response.ok) {
        setBroadcasts(data.broadcasts || [])
      } else {
        console.error('Failed to fetch broadcast history:', data.error)
      }
    } catch (error) {
      console.error('Failed to fetch broadcast history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'destructive'
      case 'MEDIUM':
        return 'default'
      case 'LOW':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Broadcast History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : broadcasts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No broadcasts yet. Send your first announcement to see it here.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Channels</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {broadcasts.map((broadcast, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{broadcast.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {broadcast.message}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(broadcast.priority)}>
                      {broadcast.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{broadcast.tenantCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {broadcast.channels.includes('in-app') && (
                        <Badge variant="outline" className="text-xs">In-App</Badge>
                      )}
                      {broadcast.channels.includes('email') && (
                        <Badge variant="outline" className="text-xs">
                          <Mail className="h-3 w-3 inline mr-1" />
                          Email
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(broadcast.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
