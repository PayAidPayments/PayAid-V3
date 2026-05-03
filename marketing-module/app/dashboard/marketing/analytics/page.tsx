'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export default function MarketingAnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['marketing-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/marketing/analytics', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.details || errorData.error || `HTTP ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    )
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch analytics data'
    const isPrismaError = errorMessage.includes('campaign') || errorMessage.includes('Campaign') || errorMessage.includes('prisma')
    
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-2 font-semibold">Error loading analytics</p>
          <p className="text-sm text-gray-700 mb-2 font-mono bg-gray-100 p-3 rounded break-all">
            {errorMessage}
          </p>
          {isPrismaError && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md max-w-2xl mx-auto">
              <p className="text-sm font-semibold text-yellow-800 mb-2">⚠️ Prisma Client Issue Detected</p>
              <p className="text-xs text-yellow-700 mb-3">
                The Campaign model may not be available in the Prisma client. This usually happens when the Prisma client wasn&apos;t regenerated after adding a new model.
              </p>
              <div className="text-xs text-yellow-700 space-y-1">
                <p><strong>To fix:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Stop the dev server (Ctrl+C in the terminal)</li>
                  <li>Run: <code className="bg-yellow-100 px-1 rounded">npx prisma generate</code></li>
                  <li>Restart the dev server: <code className="bg-yellow-100 px-1 rounded">npm run dev</code></li>
                </ol>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 mb-4 mt-4">
            Check the browser console (F12) and server logs for more details
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
            <Link href="/dashboard/marketing">
              <Button variant="outline">Back to Marketing</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const overview = data?.overview || {}
  const byType = data?.byType || {}
  const topCampaigns = data?.topCampaigns || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketing Analytics</h1>
          <p className="mt-2 text-gray-600">Overall campaign performance and insights</p>
        </div>
        <Link href="/dashboard/marketing">
          <Button variant="outline">Back to Marketing</Button>
        </Link>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalCampaigns || 0}</div>
            <CardDescription>Sent campaigns</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalSent || 0}</div>
            <CardDescription>
              {overview.deliveryRate?.toFixed(1)}% delivery rate
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Opened</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalOpened || 0}</div>
            <CardDescription>
              {overview.openRate?.toFixed(1)}% open rate
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalClicked || 0}</div>
            <CardDescription>
              {overview.clickRate?.toFixed(1)}% click rate
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Delivery Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Delivered</span>
                <span className="font-semibold">{overview.totalDelivered || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Bounced</span>
                <span className="font-semibold text-red-600">{overview.totalBounced || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Delivery Rate</span>
                <span className="font-semibold">{overview.deliveryRate?.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Open Rate</span>
                <span className="font-semibold">{overview.openRate?.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Click Rate</span>
                <span className="font-semibold">{overview.clickRate?.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">CTR</span>
                <span className="font-semibold">{overview.clickThroughRate?.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>List Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Unsubscribed</span>
                <span className="font-semibold text-yellow-600">{overview.totalUnsubscribed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Unsubscribe Rate</span>
                <span className="font-semibold">{overview.unsubscribeRate?.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Bounce Rate</span>
                <span className="font-semibold">{overview.bounceRate?.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Channel</CardTitle>
          <CardDescription>Compare performance across email, WhatsApp, and SMS</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-3">Email</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Campaigns</span>
                  <span className="font-semibold">{byType.email?.count || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sent</span>
                  <span className="font-semibold">{byType.email?.sent || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Open Rate</span>
                  <span className="font-semibold">{byType.email?.openRate?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Click Rate</span>
                  <span className="font-semibold">{byType.email?.clickRate?.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-3">WhatsApp</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Campaigns</span>
                  <span className="font-semibold">{byType.whatsapp?.count || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sent</span>
                  <span className="font-semibold">{byType.whatsapp?.sent || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Open Rate</span>
                  <span className="font-semibold">{byType.whatsapp?.openRate?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Click Rate</span>
                  <span className="font-semibold">{byType.whatsapp?.clickRate?.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-3">SMS</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Campaigns</span>
                  <span className="font-semibold">{byType.sms?.count || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sent</span>
                  <span className="font-semibold">{byType.sms?.sent || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Click Rate</span>
                  <span className="font-semibold">{byType.sms?.clickRate?.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Campaigns */}
      {topCampaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Campaigns</CardTitle>
            <CardDescription>Campaigns with highest open rates</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Open Rate</TableHead>
                  <TableHead>Click Rate</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCampaigns.map((campaign: any) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      <span className="capitalize">{campaign.type}</span>
                    </TableCell>
                    <TableCell>{campaign.openRate.toFixed(1)}%</TableCell>
                    <TableCell>{campaign.clickRate.toFixed(1)}%</TableCell>
                    <TableCell>{campaign.sent}</TableCell>
                    <TableCell>
                      <Link href={`/dashboard/marketing/campaigns/${campaign.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {overview.totalCampaigns === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">No campaign data available yet</p>
            <Link href="/dashboard/marketing/campaigns/new">
              <Button>Create Your First Campaign</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
