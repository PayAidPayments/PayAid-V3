'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const CHART_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444']

export default function OnboardingAnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/onboarding-analytics')
      if (res.ok) {
        const json = await res.json()
        setData(json.data)
      }
    } catch (error) {
      console.error('Failed to load analytics', error)
    } finally {
      setLoading(false)
    }
  }

  // Mock data for demonstration
  const completionRateData = [
    { month: 'Jan', rate: 65 },
    { month: 'Feb', rate: 72 },
    { month: 'Mar', rate: 68 },
    { month: 'Apr', rate: 75 },
    { month: 'May', rate: 78 },
    { month: 'Jun', rate: 82 },
  ]

  const dropOffData = [
    { step: 'Signup', count: 100 },
    { step: 'Business Info', count: 85 },
    { step: 'KYC Upload', count: 70 },
    { step: 'Document Review', count: 65 },
    { step: 'Approved', count: 60 },
  ]

  const statusDistribution = [
    { name: 'Approved', value: 60, color: CHART_COLORS[1] },
    { name: 'Pending', value: 25, color: CHART_COLORS[2] },
    { name: 'Rejected', value: 10, color: CHART_COLORS[4] },
    { name: 'Needs Info', value: 5, color: CHART_COLORS[3] },
  ]

  const timeToApprovalData = [
    { period: '0-24h', count: 15 },
    { period: '1-3 days', count: 30 },
    { period: '3-7 days', count: 10 },
    { period: '7+ days', count: 5 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Onboarding Analytics</h1>
        <p className="text-muted-foreground">Track merchant onboarding performance and identify bottlenecks</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">82%</div>
            <p className="text-xs text-muted-foreground">+7% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Time to Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3 days</div>
            <p className="text-xs text-muted-foreground">-0.5 days improvement</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Drop-off Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18%</div>
            <p className="text-xs text-muted-foreground">-3% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Completion Rate Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Completion Rate Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={completionRateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="rate" stroke="#8B5CF6" name="Completion Rate (%)" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Drop-off Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Onboarding Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dropOffData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="step" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" name="Merchants" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Time to Approval */}
        <Card>
          <CardHeader>
            <CardTitle>Time to Approval Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeToApprovalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10B981" name="Merchants" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
              <div>
                <p className="font-medium">Completion rate improved by 7%</p>
                <p className="text-sm text-muted-foreground">
                  Streamlined KYC upload process has reduced drop-offs at document stage
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2" />
              <div>
                <p className="font-medium">Average review time: 2.3 days</p>
                <p className="text-sm text-muted-foreground">
                  Most merchants are approved within 1-3 days. Consider automation for low-risk cases.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
              <div>
                <p className="font-medium">Main drop-off point: KYC Upload</p>
                <p className="text-sm text-muted-foreground">
                  15% of merchants drop off during document upload. Consider improving UX and guidance.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
