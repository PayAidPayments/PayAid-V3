'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Mail, Users, Clock, Send, Eye, MousePointerClick } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Segment {
  id: string
  name: string
  contactCount: number
}

interface EmailCampaignBuilderProps {
  tenantId: string
  onSave?: (campaign: any) => void
  onCancel?: () => void
}

export function EmailCampaignBuilder({ tenantId, onSave, onCancel }: EmailCampaignBuilderProps) {
  const [step, setStep] = useState(1)
  const [campaignData, setCampaignData] = useState({
    name: '',
    subject: '',
    htmlContent: '',
    recipientSegments: [] as string[],
    scheduledFor: null as Date | null,
    enableABTest: false,
    abTestVariants: [] as Array<{ subject: string; content: string }>,
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
      const response = await fetch('/api/marketing/email-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: tenantId,
          ...data,
        }),
      })
      if (!response.ok) throw new Error('Failed to create campaign')
      return response.json()
    },
    onSuccess: (data) => {
      onSave?.(data.data)
    },
  })

  const segments = segmentsData?.segments || []

  const handleNext = () => {
    if (step < 4) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSave = () => {
    createCampaign.mutate({
      name: campaignData.name,
      subject: campaignData.subject,
      htmlContent: campaignData.htmlContent,
      recipientSegments: campaignData.recipientSegments,
      scheduledFor: campaignData.scheduledFor?.toISOString(),
    })
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
                step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              )}
            >
              {s}
            </div>
            {s < 4 && (
              <div
                className={cn('h-1 flex-1 mx-2', step > s ? 'bg-blue-600' : 'bg-gray-200')}
              />
            )}
          </div>
        ))}
      </div>

      <Tabs value={step.toString()} className="w-full">
        {/* Step 1: Campaign Details */}
        <TabsContent value="1" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>Basic information about your email campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  value={campaignData.name}
                  onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                  placeholder="e.g., Welcome Email Series"
                />
              </div>
              <div>
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={campaignData.subject}
                  onChange={(e) => setCampaignData({ ...campaignData, subject: e.target.value })}
                  placeholder="e.g., Welcome to PayAid!"
                />
              </div>
              <div>
                <Label htmlFor="content">Email Content (HTML)</Label>
                <Textarea
                  id="content"
                  value={campaignData.htmlContent}
                  onChange={(e) =>
                    setCampaignData({ ...campaignData, htmlContent: e.target.value })
                  }
                  placeholder="Enter your email HTML content here..."
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 2: Select Recipients */}
        <TabsContent value="2" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Recipients</CardTitle>
              <CardDescription>Choose which segments will receive this campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
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
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900">
                    Total Recipients: {campaignData.recipientSegments.reduce(
                      (sum, id) =>
                        sum +
                        (segments.find((s) => s.id === id)?.contactCount || 0),
                      0
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 3: Schedule & Settings */}
        <TabsContent value="3" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schedule & Settings</CardTitle>
              <CardDescription>When should this campaign be sent?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Send Date & Time</Label>
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
                        <span>Pick a date and time</span>
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
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="abTest"
                  checked={campaignData.enableABTest}
                  onChange={(e) =>
                    setCampaignData({ ...campaignData, enableABTest: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="abTest">Enable A/B Testing</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 4: Review & Send */}
        <TabsContent value="4" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review & Send</CardTitle>
              <CardDescription>Review your campaign before sending</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">Campaign Name</div>
                <div className="text-lg">{campaignData.name}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">Subject</div>
                <div className="text-lg">{campaignData.subject}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">Recipients</div>
                <div className="flex flex-wrap gap-2">
                  {campaignData.recipientSegments.map((id) => {
                    const segment = segments.find((s) => s.id === id)
                    return segment ? (
                      <Badge key={id} variant="secondary">
                        {segment.name} ({segment.contactCount})
                      </Badge>
                    ) : null
                  })}
                </div>
              </div>
              {campaignData.scheduledFor && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500">Scheduled For</div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {format(campaignData.scheduledFor, 'PPP p')}
                  </div>
                </div>
              )}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium mb-2">Email Preview</div>
                <div
                  className="border rounded p-4 bg-white"
                  dangerouslySetInnerHTML={{ __html: campaignData.htmlContent }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <div>
          {step > 1 && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          {step < 4 ? (
            <Button onClick={handleNext} disabled={!campaignData.name || !campaignData.subject}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={createCampaign.isPending}>
              {createCampaign.isPending ? 'Saving...' : 'Save Campaign'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
