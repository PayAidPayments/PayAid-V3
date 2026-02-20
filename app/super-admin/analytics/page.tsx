'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function SuperAdminAnalyticsPage() {
  // Mock data - replace with real API calls
  const merchantGrowth = [
    { month: 'Jan', new: 12, active: 120, churned: 2 },
    { month: 'Feb', new: 15, active: 133, churned: 1 },
    { month: 'Mar', new: 18, active: 150, churned: 3 },
  ]

  const revenueByType = [
    { type: 'SaaS', revenue: 280000 },
    { type: 'E-commerce', revenue: 150000 },
    { type: 'Services', revenue: 120000 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Merchant Analytics</h1>
        <p className="text-muted-foreground">Cross-tenant insights and trends</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <select className="px-3 py-2 border rounded-md text-sm">
          <option>Last 30 days</option>
          <option>Last 90 days</option>
          <option>Last year</option>
        </select>
        <select className="px-3 py-2 border rounded-md text-sm">
          <option>All Segments</option>
          <option>High Volume</option>
          <option>At Risk</option>
        </select>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Merchant Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={merchantGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="new" stroke="#3B82F6" name="New" />
                <Line type="monotone" dataKey="active" stroke="#10B981" name="Active" />
                <Line type="monotone" dataKey="churned" stroke="#EF4444" name="Churned" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Merchant Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Insights */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top 5% Merchants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45%</div>
            <p className="text-xs text-muted-foreground">Generate 45% of revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">WhatsApp Merchants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3x</div>
            <p className="text-xs text-muted-foreground">Higher retention rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Growth Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4x</div>
            <p className="text-xs text-muted-foreground">More deals created</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
