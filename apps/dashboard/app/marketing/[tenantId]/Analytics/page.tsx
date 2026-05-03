'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { PageLoading } from '@/components/ui/loading'

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export default function MarketingAnalyticsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
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
    return <PageLoading message="Loading analytics..." fullScreen={false} />
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch analytics data'
    const isPrismaError = errorMessage.includes('campaign') || errorMessage.includes('Campaign') || errorMessage.includes('prisma')
    
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 mb-2 font-semibold">Error loading analytics</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded break-all">
            {errorMessage}
          </p>
          {isPrismaError && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-md max-w-2xl mx-auto">
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Prisma Client Issue Detected</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                The Campaign model may not be available in the Prisma client. This usually happens when the Prisma client wasn&apos;t regenerated after adding a new model.
              </p>
              <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                <p><strong>To fix:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Stop the dev server (Ctrl+C in the terminal)</li>
                  <li>Run: <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">npx prisma generate</code></li>
                  <li>Restart the dev server: <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">npm run dev</code></li>
                </ol>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 mt-4">
            Check the browser console (F12) and server logs for more details
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => window.location.reload()} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              Retry
            </Button>
            <Link href={`/marketing/${tenantId}/Home`}>
              <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Back to Marketing</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const overview = data?.overview || {}
  const byType = data?.byType || {}
  const topCampaigns = data?.topCampaigns || []
  const monthlyTrend = data?.monthlyTrend || []
  const dailyTrend = data?.dailyTrend || []

  const PAYAID_PURPLE = '#53328A'
  const PAYAID_GOLD = '#F5C700'
  const PAYAID_GREEN = '#10B981'
  const PAYAID_BLUE = '#3B82F6'
  const PAYAID_RED = '#EF4444'
  const CHART_COLORS = [PAYAID_PURPLE, PAYAID_GOLD, PAYAID_GREEN, PAYAID_BLUE, PAYAID_RED]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Marketing Analytics</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Overall campaign performance and insights</p>
        </div>
        <Link href={`/marketing/${tenantId}/Home`}>
          <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Back to Marketing</Button>
        </Link>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{overview.totalCampaigns || 0}</div>
            <CardDescription className="dark:text-gray-400">Sent campaigns</CardDescription>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{overview.totalSent || 0}</div>
            <CardDescription className="dark:text-gray-400">
              {overview.deliveryRate?.toFixed(1)}% delivery rate
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Opened</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{overview.totalOpened || 0}</div>
            <CardDescription className="dark:text-gray-400">
              {overview.openRate?.toFixed(1)}% open rate
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Clicked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{overview.totalClicked || 0}</div>
            <CardDescription className="dark:text-gray-400">
              {overview.clickRate?.toFixed(1)}% click rate
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Delivery Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Delivered</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{overview.totalDelivered || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Bounced</span>
                <span className="font-semibold text-red-600 dark:text-red-400">{overview.totalBounced || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Delivery Rate</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{overview.deliveryRate?.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Engagement Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Open Rate</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{overview.openRate?.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Click Rate</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{overview.clickRate?.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">CTR</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{overview.clickThroughRate?.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">List Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Unsubscribed</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">{overview.totalUnsubscribed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Unsubscribe Rate</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{overview.unsubscribeRate?.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Bounce Rate</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{overview.bounceRate?.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {monthlyTrend.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Monthly Campaign Performance</CardTitle>
              <CardDescription className="dark:text-gray-400">Sent, delivered, opened, and clicked over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="sent" stackId="1" stroke={PAYAID_PURPLE} fill={PAYAID_PURPLE} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="delivered" stackId="1" stroke={PAYAID_GOLD} fill={PAYAID_GOLD} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="opened" stackId="1" stroke={PAYAID_GREEN} fill={PAYAID_GREEN} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="clicked" stackId="1" stroke={PAYAID_BLUE} fill={PAYAID_BLUE} fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {dailyTrend.length > 0 && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Daily Engagement Trend</CardTitle>
                <CardDescription className="dark:text-gray-400">Last 30 days performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="opened" stroke={PAYAID_GREEN} strokeWidth={2} name="Opened" />
                    <Line type="monotone" dataKey="clicked" stroke={PAYAID_BLUE} strokeWidth={2} name="Clicked" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Performance by Channel</CardTitle>
              <CardDescription className="dark:text-gray-400">Compare email, WhatsApp, and SMS performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'Email', sent: byType.email?.sent || 0, opened: byType.email?.opened || 0, clicked: byType.email?.clicked || 0 },
                  { name: 'WhatsApp', sent: byType.whatsapp?.sent || 0, opened: byType.whatsapp?.opened || 0, clicked: byType.whatsapp?.clicked || 0 },
                  { name: 'SMS', sent: byType.sms?.sent || 0, opened: byType.sms?.opened || 0, clicked: byType.sms?.clicked || 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sent" fill={PAYAID_PURPLE} name="Sent" />
                  <Bar dataKey="opened" fill={PAYAID_GREEN} name="Opened" />
                  <Bar dataKey="clicked" fill={PAYAID_BLUE} name="Clicked" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Campaign Distribution</CardTitle>
              <CardDescription className="dark:text-gray-400">Campaigns by channel type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Email', value: byType.email?.count || 0 },
                      { name: 'WhatsApp', value: byType.whatsapp?.count || 0 },
                      { name: 'SMS', value: byType.sms?.count || 0 },
                    ].filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Email', value: byType.email?.count || 0 },
                      { name: 'WhatsApp', value: byType.whatsapp?.count || 0 },
                      { name: 'SMS', value: byType.sms?.count || 0 },
                    ].filter(item => item.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics by Type */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Performance by Channel</CardTitle>
          <CardDescription className="dark:text-gray-400">Compare performance across email, WhatsApp, and SMS</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Email</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Campaigns</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{byType.email?.count || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Sent</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{byType.email?.sent || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Open Rate</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{byType.email?.openRate?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Click Rate</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{byType.email?.clickRate?.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">WhatsApp</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Campaigns</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{byType.whatsapp?.count || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Sent</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{byType.whatsapp?.sent || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Open Rate</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{byType.whatsapp?.openRate?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Click Rate</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{byType.whatsapp?.clickRate?.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">SMS</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Campaigns</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{byType.sms?.count || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Sent</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{byType.sms?.sent || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Click Rate</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{byType.sms?.clickRate?.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Campaigns */}
      {topCampaigns.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Top Performing Campaigns</CardTitle>
            <CardDescription className="dark:text-gray-400">Campaigns with highest open rates</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="dark:text-gray-300">Campaign Name</TableHead>
                  <TableHead className="dark:text-gray-300">Type</TableHead>
                  <TableHead className="dark:text-gray-300">Open Rate</TableHead>
                  <TableHead className="dark:text-gray-300">Click Rate</TableHead>
                  <TableHead className="dark:text-gray-300">Sent</TableHead>
                  <TableHead className="dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCampaigns.map((campaign: any) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium text-gray-900 dark:text-gray-100">{campaign.name}</TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">
                      <span className="capitalize">{campaign.type}</span>
                    </TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100">{campaign.openRate.toFixed(1)}%</TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100">{campaign.clickRate.toFixed(1)}%</TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100">{campaign.sent}</TableCell>
                    <TableCell>
                      <Link href={`/marketing/${tenantId}/Campaigns/${campaign.id}`}>
                        <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">View Details</Button>
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
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No campaign data available yet</p>
            <Link href={`/marketing/${tenantId}/Campaigns/New`}>
              <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Create Your First Campaign</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
