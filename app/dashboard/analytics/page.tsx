'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

interface Website {
  id: string
  name: string
  domain?: string
  subdomain?: string
  status: string
  trackingCode: string
  _count: {
    visits: number
    sessions: number
    pages: number
  }
}

export default function AnalyticsPage() {
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')

  const { data: websitesData } = useQuery<{ websites: Website[] }>({
    queryKey: ['websites'],
    queryFn: async () => {
      const response = await fetch('/api/websites')
      if (!response.ok) throw new Error('Failed to fetch websites')
      return response.json()
    },
  })

  const { data: analyticsData } = useQuery({
    queryKey: ['analytics-dashboard', selectedWebsiteId, dateRange],
    queryFn: async () => {
      if (!selectedWebsiteId) return null

      const endDate = new Date()
      const startDate = new Date()
      if (dateRange === '7d') startDate.setDate(endDate.getDate() - 7)
      else if (dateRange === '30d') startDate.setDate(endDate.getDate() - 30)
      else startDate.setDate(endDate.getDate() - 90)

      const response = await fetch(
        `/api/analytics/dashboard?websiteId=${selectedWebsiteId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )
      if (!response.ok) throw new Error('Failed to fetch analytics')
      return response.json()
    },
    enabled: !!selectedWebsiteId,
  })

  const websites = websitesData?.websites || []

  // Auto-select first website if available
  useEffect(() => {
    if (websites.length > 0 && !selectedWebsiteId) {
      setSelectedWebsiteId(websites[0].id)
    }
  }, [websites, selectedWebsiteId])

  const analytics = analyticsData

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Website Analytics</h1>
          <p className="mt-2 text-gray-600">Track visitor behavior and website performance</p>
        </div>
        <Link href="/dashboard/websites">
          <Button variant="outline">Manage Websites</Button>
        </Link>
      </div>

      {/* Website Selector */}
      {websites.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Select Website:</label>
              <select
                value={selectedWebsiteId || ''}
                onChange={(e) => setSelectedWebsiteId(e.target.value)}
                className="flex-1 h-10 rounded-md border border-gray-300 px-3"
              >
                {websites.map((website) => (
                  <option key={website.id} value={website.id}>
                    {website.name} ({website.domain || website.subdomain || 'No domain'})
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button
                  variant={dateRange === '7d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('7d')}
                >
                  7 Days
                </Button>
                <Button
                  variant={dateRange === '30d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('30d')}
                >
                  30 Days
                </Button>
                <Button
                  variant={dateRange === '90d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('90d')}
                >
                  90 Days
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {websites.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-gray-500 mb-4">No websites found</p>
              <Link href="/dashboard/websites">
                <Button>Create Your First Website</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : !selectedWebsiteId ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">Select a website to view analytics</div>
          </CardContent>
        </Card>
      ) : analytics ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Total Visits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.summary.totalVisits.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Unique Visitors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.summary.uniqueVisitors.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Bounce Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.summary.bounceRate.toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Avg Session Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(analytics.summary.avgSessionDuration / 60)}m</div>
              </CardContent>
            </Card>
          </div>

          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>Most visited pages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.topPages.map((page: any, idx: number) => (
                  <div key={page.pageId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{page.title || page.path}</div>
                      <div className="text-sm text-gray-500">{page.path}</div>
                    </div>
                    <div className="text-lg font-semibold">{page.visits.toLocaleString()} visits</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Traffic Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.trafficSources.map((source: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm">{source.referrer}</span>
                    <span className="font-semibold">{source.visits.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Device Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Devices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.deviceBreakdown.map((device: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{device.device}</span>
                      <span className="font-semibold">{device.visits.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Browsers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.browserBreakdown.slice(0, 5).map((browser: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm">{browser.browser}</span>
                      <span className="font-semibold">{browser.visits.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">Loading analytics...</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
