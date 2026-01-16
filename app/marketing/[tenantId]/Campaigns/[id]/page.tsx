'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { useAuthStore } from '@/lib/stores/auth'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { PageLoading } from '@/components/ui/loading'

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

export default function CampaignDetailPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const router = useRouter()
  const id = params.id as string
  const { token } = useAuthStore()
  const queryClient = useQueryClient()

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

  const sendCampaign = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/marketing/campaigns/${id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send campaign')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] })
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      alert('Campaign queued for sending!')
    },
  })

  if (isLoading) {
    return <PageLoading message="Loading campaign..." fullScreen={false} />
  }

  if (!campaign) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Campaign not found</p>
        <Link href={`/marketing/${tenantId}/Campaigns`}>
          <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Back to Campaigns</Button>
        </Link>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      sent: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{campaign.name}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 capitalize">{campaign.type} Campaign</p>
        </div>
        <div className="flex gap-2">
          {campaign?.status === 'draft' && (
            <Button
              onClick={() => {
                if (confirm(`Are you sure you want to send this campaign to ${campaign.recipientCount} recipients?`)) {
                  sendCampaign.mutate()
                }
              }}
              disabled={sendCampaign.isPending}
              className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
            >
              {sendCampaign.isPending ? 'Sending...' : '📤 Send Now'}
            </Button>
          )}
          <Link href={`/marketing/${tenantId}/Campaigns`}>
            <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Back</Button>
          </Link>
        </div>
      </div>

      {/* Status and Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</CardTitle>
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
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{campaign.recipientCount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{campaign.sent.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics */}
      {campaign.status === 'sent' && campaign.sent > 0 && (
        <>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Campaign Analytics</CardTitle>
              <CardDescription className="dark:text-gray-400">Performance metrics for this campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Delivered</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{campaign.delivered.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {campaign.sent > 0
                      ? `${((campaign.delivered / campaign.sent) * 100).toFixed(1)}%`
                      : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Opened</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{campaign.opened.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {campaign.delivered > 0
                      ? `${((campaign.opened / campaign.delivered) * 100).toFixed(1)}%`
                      : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Clicked</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{campaign.clicked.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {campaign.opened > 0
                      ? `${((campaign.clicked / campaign.opened) * 100).toFixed(1)}%`
                      : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Bounced</div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {campaign.bounced.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {campaign.sent > 0
                      ? `${((campaign.bounced / campaign.sent) * 100).toFixed(1)}%`
                      : '-'}
                  </div>
                </div>
              </div>

              {/* Visualization Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Delivery Status Pie Chart */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Delivery Status</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Delivered', value: campaign.delivered, fill: '#10b981' },
                          { name: 'Bounced', value: campaign.bounced, fill: '#ef4444' },
                          { name: 'Pending', value: campaign.sent - campaign.delivered - campaign.bounced, fill: '#f59e0b' },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Delivered', value: campaign.delivered, fill: '#10b981' },
                          { name: 'Bounced', value: campaign.bounced, fill: '#ef4444' },
                          { name: 'Pending', value: campaign.sent - campaign.delivered - campaign.bounced, fill: '#f59e0b' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Engagement Bar Chart */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Engagement Metrics</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={[
                        { name: 'Sent', value: campaign.sent },
                        { name: 'Delivered', value: campaign.delivered },
                        { name: 'Opened', value: campaign.opened },
                        { name: 'Clicked', value: campaign.clicked },
                      ]}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#53328A" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Campaign Details */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Campaign Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {campaign.subject && (
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Subject</div>
              <div className="font-medium text-gray-900 dark:text-gray-100">{campaign.subject}</div>
            </div>
          )}
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Content</div>
            <div className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 p-4 rounded-md text-gray-900 dark:text-gray-100">
              {campaign.content}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Created</div>
              <div className="text-gray-900 dark:text-gray-100">
                {campaign.createdAt
                  ? format(new Date(campaign.createdAt), 'MMMM dd, yyyy HH:mm')
                  : '-'}
              </div>
            </div>
            {campaign.scheduledFor && (
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Scheduled For</div>
                <div className="text-gray-900 dark:text-gray-100">
                  {format(new Date(campaign.scheduledFor), 'MMMM dd, yyyy HH:mm')}
                </div>
              </div>
            )}
            {campaign.sentAt && (
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sent At</div>
                <div className="text-gray-900 dark:text-gray-100">{format(new Date(campaign.sentAt), 'MMMM dd, yyyy HH:mm')}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
