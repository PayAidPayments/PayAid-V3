'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, MessageSquare, Users, Clock, Send } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Segment {
  id: string
  name: string
  contactCount: number
}

interface SMSCampaignBuilderProps {
  tenantId: string
  onSave?: (campaign: any) => void
  onCancel?: () => void
}

export function SMSCampaignBuilder({ tenantId, onSave, onCancel }: SMSCampaignBuilderProps) {
  const [campaignData, setCampaignData] = useState({
    name: '',
    message: '',
    recipientSegments: [] as string[],
    scheduledFor: null as Date | null,
  })

  // Fetch segments
  const { data: segmentsData } = useQuery<{ segments: Segment[] }>({
    queryKey: ['segments', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/crm/segments?tenantId=${tenantId}`)
      if (!response.ok) throw new Error('Failed to fetch segments')
      return response.json()
    },
  })

  // Create campaign mutation
  const createCampaign = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/marketing/sms-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: tenantId,
          ...data,
        }),
      })
      if (!response.ok) throw new Error('Failed to create SMS campaign')
      return response.json()
    },
    onSuccess: (data) => {
      onSave?.(data.data)
    },
  })

  const segments = segmentsData?.segments || []
  const messageLength = campaignData.message.length
  const maxLength = 160
  const isOverLimit = messageLength > maxLength

  const handleSave = () => {
    if (isOverLimit) return
    createCampaign.mutate({
      name: campaignData.name,
      message: campaignData.message,
      recipientSegments: campaignData.recipientSegments,
      scheduledFor: campaignData.scheduledFor?.toISOString(),
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create SMS Campaign</CardTitle>
          <CardDescription>Send bulk SMS messages to your contacts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={campaignData.name}
              onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
              placeholder="e.g., Product Launch SMS"
            />
          </div>

          <div>
            <Label htmlFor="message">SMS Message</Label>
            <Textarea
              id="message"
              value={campaignData.message}
              onChange={(e) => setCampaignData({ ...campaignData, message: e.target.value })}
              placeholder="Enter your SMS message (max 160 characters)..."
              rows={4}
              maxLength={maxLength}
              className={cn(isOverLimit && 'border-red-500')}
            />
            <div className="flex justify-between mt-1">
              <span className={cn('text-sm', isOverLimit ? 'text-red-500' : 'text-gray-500')}>
                {messageLength} / {maxLength} characters
              </span>
              {isOverLimit && (
                <span className="text-sm text-red-500">Message exceeds limit</span>
              )}
            </div>
          </div>

          <div>
            <Label>Select Recipients</Label>
            <div className="space-y-2 mt-2">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  className={cn(
                    'flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors',
                    campaignData.recipientSegments.includes(segment.id)
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                  onClick={() => {
                    const segments = campaignData.recipientSegments.includes(segment.id)
                      ? campaignData.recipientSegments.filter((id) => id !== segment.id)
                      : [...campaignData.recipientSegments, segment.id]
                    setCampaignData({ ...campaignData, recipientSegments: segments })
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="font-medium">{segment.name}</div>
                      <div className="text-sm text-gray-500">
                        {segment.contactCount} contacts
                      </div>
                    </div>
                  </div>
                  {campaignData.recipientSegments.includes(segment.id) && (
                    <Badge variant="default">Selected</Badge>
                  )}
                </div>
              ))}
            </div>
            {campaignData.recipientSegments.length > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg mt-4">
                <div className="text-sm font-medium text-blue-900">
                  Total Recipients: {campaignData.recipientSegments.reduce(
                    (sum, id) =>
                      sum + (segments.find((s) => s.id === id)?.contactCount || 0),
                    0
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <Label>Schedule (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !campaignData.scheduledFor && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {campaignData.scheduledFor ? (
                    format(campaignData.scheduledFor, 'PPP p')
                  ) : (
                    <span>Send immediately or schedule for later</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={campaignData.scheduledFor || undefined}
                  onSelect={(date) =>
                    setCampaignData({ ...campaignData, scheduledFor: date || null })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={createCampaign.isPending || !campaignData.name || !campaignData.message || isOverLimit || campaignData.recipientSegments.length === 0}
        >
          {createCampaign.isPending ? 'Creating...' : 'Create Campaign'}
        </Button>
      </div>
    </div>
  )
}
