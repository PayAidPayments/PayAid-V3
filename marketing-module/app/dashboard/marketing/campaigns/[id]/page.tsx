'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ModuleGate } from '@/components/modules/ModuleGate'
import { useAuthStore } from '@/lib/stores/auth'

interface Campaign {
  id: string
  name: string
  type: string
  subject?: string
  content: string
  status: string
  scheduledFor?: string
  sentAt?: string
  recipientCount: number
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  unsubscribed: number
  analytics?: {
    openRate: number
    clickRate: number
    clickThroughRate: number
  }
  createdAt: string
}

function CampaignDetailPageContent() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { token } = useAuthStore()

  const { data: campaign, isLoading } = useQuery<Campaign>({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const response = await fetch(`/api/marketing/campaigns/${id}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (!response.ok) throw new Error('Failed to fetch campaign')
      return response.json()
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Campaign not found</p>
        <Link href="/dashboard/marketing/campaigns">
          <Button>Back to Campaigns</Button>
        </Link>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      sent: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
          <p className="mt-2 text-gray-600 capitalize">{campaign.type} Campaign</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/marketing/campaigns">
            <Button variant="outline">Back</Button>
          </Link>
        </div>
      </div>

      {/* Status and Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                campaign.status
              )}`}
            >
              {campaign.status}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.recipientCount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.sent.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics */}
      {campaign.status === 'sent' && campaign.sent > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Analytics</CardTitle>
            <CardDescription>Performance metrics for this campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Delivered</div>
                <div className="text-2xl font-bold">{campaign.delivered.toLocaleString()}</div>
                <div className="text-xs text-gray-500">
                  {campaign.sent > 0
                    ? `${((campaign.delivered / campaign.sent) * 100).toFixed(1)}%`
                    : '-'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Opened</div>
                <div className="text-2xl font-bold">{campaign.opened.toLocaleString()}</div>
                <div className="text-xs text-gray-500">
                  {campaign.delivered > 0
                    ? `${((campaign.opened / campaign.delivered) * 100).toFixed(1)}%`
                    : '-'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Clicked</div>
                <div className="text-2xl font-bold">{campaign.clicked.toLocaleString()}</div>
                <div className="text-xs text-gray-500">
                  {campaign.opened > 0
                    ? `${((campaign.clicked / campaign.opened) * 100).toFixed(1)}%`
                    : '-'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Bounced</div>
                <div className="text-2xl font-bold text-red-600">
                  {campaign.bounced.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  {campaign.sent > 0
                    ? `${((campaign.bounced / campaign.sent) * 100).toFixed(1)}%`
                    : '-'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign Details */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {campaign.subject && (
            <div>
              <div className="text-sm text-gray-600 mb-1">Subject</div>
              <div className="font-medium">{campaign.subject}</div>
            </div>
          )}
          <div>
            <div className="text-sm text-gray-600 mb-1">Content</div>
            <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
              {campaign.content}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Created</div>
              <div>
                {campaign.createdAt
                  ? format(new Date(campaign.createdAt), 'MMMM dd, yyyy HH:mm')
                  : '-'}
              </div>
            </div>
            {campaign.scheduledFor && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Scheduled For</div>
                <div>
                  {format(new Date(campaign.scheduledFor), 'MMMM dd, yyyy HH:mm')}
                </div>
              </div>
            )}
            {campaign.sentAt && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Sent At</div>
                <div>{format(new Date(campaign.sentAt), 'MMMM dd, yyyy HH:mm')}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
  )
}

export default function CampaignDetailPage() {
  return (
    <ModuleGate module="marketing">
      <CampaignDetailPageContent />
    </ModuleGate>
  )
}
