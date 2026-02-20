'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageSquare, Send, Users, Calendar, History } from 'lucide-react'
import { ComposeAnnouncementModal } from '@/components/super-admin/communication/ComposeAnnouncementModal'
import { BroadcastHistory } from '@/components/super-admin/communication/BroadcastHistory'

export default function SuperAdminCommunicationPage() {
  const [composeOpen, setComposeOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Communication Center</h1>
          <p className="text-muted-foreground">
            Send announcements and notifications to tenants
          </p>
        </div>
        <Button onClick={() => setComposeOpen(true)}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Compose Announcement
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Broadcast to All Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Send an in-app announcement and optional email to all business owners. Use for maintenance, new features, or policy updates.
            </p>
            <Button onClick={() => setComposeOpen(true)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Compose Announcement
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Segment-based Messaging
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Target specific tenant segments by plan, industry, or status. Select segments when composing your announcement.
            </p>
            <Button variant="outline" onClick={() => setComposeOpen(true)}>
              <Users className="h-4 w-4 mr-2" />
              Send to Segments
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Scheduled Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Schedule announcements for a future date and time. Messages will be automatically sent at the scheduled time.
            </p>
            <Button variant="outline" onClick={() => setComposeOpen(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Message
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Broadcasts</span>
                <span className="font-medium">-</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Scheduled</span>
                <span className="font-medium">-</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Sent</span>
                <span className="font-medium">-</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BroadcastHistory />

      <ComposeAnnouncementModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSent={() => {
          // Refresh history when a new announcement is sent
          window.location.reload()
        }}
      />
    </div>
  )
}
