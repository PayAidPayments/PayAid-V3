'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Send, X, Mail, Calendar, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ComposeAnnouncementModalProps {
  open: boolean
  onClose: () => void
  onSent: () => void
}

export function ComposeAnnouncementModal({
  open,
  onClose,
  onSent,
}: ComposeAnnouncementModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sendEmail, setSendEmail] = useState(false)
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')
  const [scheduledFor, setScheduledFor] = useState('')
  const [targetSegments, setTargetSegments] = useState<{
    plans: string[]
    industries: string[]
    statuses: string[]
  }>({
    plans: [],
    industries: [],
    statuses: ['active', 'trial'],
  })

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title and message are required',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/super-admin/communication/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          sendEmail,
          priority,
          scheduledFor: scheduledFor || undefined,
          targetSegments: {
            plans: targetSegments.plans.length > 0 ? targetSegments.plans : undefined,
            industries: targetSegments.industries.length > 0 ? targetSegments.industries : undefined,
            statuses: targetSegments.statuses.length > 0 ? targetSegments.statuses : undefined,
          },
        }),
      })

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`)
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send announcement')
      }

      toast({
        title: 'Success',
        description: data.message || 'Announcement sent successfully',
      })

      // Reset form
      setTitle('')
      setMessage('')
      setSendEmail(false)
      setPriority('MEDIUM')
      setScheduledFor('')
      setTargetSegments({
        plans: [],
        industries: [],
        statuses: ['active', 'trial'],
      })

      onSent()
      onClose()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send announcement',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Compose Announcement</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Send an announcement to all tenants or specific segments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-2 block">Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-medium mb-2 block">Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Announcement message"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="text-sm font-medium mb-2 block">Priority</label>
            <div className="flex gap-2">
              {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant={priority === p ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPriority(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>

          {/* Target Segments */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <label className="text-sm font-medium">Target Segments</label>
            </div>

            {/* Plans */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Plans</label>
              <div className="flex flex-wrap gap-2">
                {['free', 'starter', 'growth', 'enterprise'].map((plan) => (
                  <Badge
                    key={plan}
                    variant={targetSegments.plans.includes(plan) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      setTargetSegments((prev) => ({
                        ...prev,
                        plans: prev.plans.includes(plan)
                          ? prev.plans.filter((p) => p !== plan)
                          : [...prev.plans, plan],
                      }))
                    }}
                  >
                    {plan}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Statuses */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <div className="flex flex-wrap gap-2">
                {['active', 'trial', 'suspended'].map((status) => (
                  <Badge
                    key={status}
                    variant={targetSegments.statuses.includes(status) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      setTargetSegments((prev) => ({
                        ...prev,
                        statuses: prev.statuses.includes(status)
                          ? prev.statuses.filter((s) => s !== status)
                          : [...prev.statuses, status],
                      }))
                    }}
                  >
                    {status}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="rounded"
              />
              <Mail className="h-4 w-4" />
              <span className="text-sm">Also send via email</span>
            </label>

            <div>
              <label className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Schedule for later (optional)</span>
              </label>
              <Input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={loading}>
              <Send className="h-4 w-4 mr-2" />
              {scheduledFor ? 'Schedule' : 'Send Now'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
