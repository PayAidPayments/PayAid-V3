'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

const PAYAID_PURPLE = '#53328A'
const PAYAID_GOLD = '#F5C700'

export default function RevenueDashboardPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', period],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch dashboard stats')
      return response.json()
    },
  })

  const { data: expenseSummary } = useQuery({
    queryKey: ['expense-summary', period],
    queryFn: async () => {
      const endDate = new Date()
      const startDate = new Date()
      if (period === '7d') startDate.setDate(endDate.getDate() - 7)
      else if (period === '30d') startDate.setDate(endDate.getDate() - 30)
      else if (period === '90d') startDate.setDate(endDate.getDate() - 90)
      else startDate.setFullYear(endDate.getFullYear() - 1)

      const response = await fetch(
        `/api/accounting/expenses/reports/summary?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        { headers: getAuthHeaders() }
      )
      if (!response.ok) return { summary: { grandTotal: 0, grandGstTotal: 0, grandTotalWithGst: 0 } }
      return response.json()
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const revenue = dashboardStats?.revenue || {}
  const expenses = expenseSummary?.summary || {}
  const netProfit = (revenue.last30Days || 0) - (expenses.grandTotalWithGst || 0)
  const revenueData = dashboardStats?.revenueData || []
  const salesTrendData = dashboardStats?.salesTrendData || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revenue Dashboard</h1>
          <p className="mt-2 text-gray-600">Track revenue trends and performance</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={period === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('7d')}
          >
            7 Days
          </Button>
          <Button
            variant={period === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('30d')}
          >
            30 Days
          </Button>
          <Button
            variant={period === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('90d')}
          >
            90 Days
          </Button>
          <Button
            variant={period === '1y' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('1y')}
          >
            1 Year
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Revenue (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: PAYAID_PURPLE }}>
              ₹{((revenue.last30Days || 0) / 1000).toFixed(1)}K
            </div>
            <CardDescription>Last 30 days</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              ₹{((expenses.grandTotalWithGst || 0) / 1000).toFixed(1)}K
            </div>
            <CardDescription>Including GST</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{(netProfit / 1000).toFixed(1)}K
            </div>
            <CardDescription>Revenue - Expenses</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: PAYAID_GOLD }}>
              {revenue.last30Days > 0
                ? ((netProfit / revenue.last30Days) * 100).toFixed(1)
                : 0}%
            </div>
            <CardDescription>Profit percentage</CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      {revenueData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `₹${(value / 1000).toFixed(1)}K`} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={PAYAID_PURPLE}
                  fill={PAYAID_PURPLE}
                  fillOpacity={0.6}
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.4}
                  name="Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Sales Performance Chart */}
      {salesTrendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sales Performance</CardTitle>
            <CardDescription>Actual vs Target sales</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `₹${(value / 1000).toFixed(1)}K`} />
                <Legend />
                <Bar dataKey="value" fill={PAYAID_PURPLE} name="Actual" />
                <Bar dataKey="target" fill={PAYAID_GOLD} name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Last 7 Days</span>
                <span className="font-bold">₹{((revenue.last7Days || 0) / 1000).toFixed(1)}K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last 30 Days</span>
                <span className="font-bold">₹{((revenue.last30Days || 0) / 1000).toFixed(1)}K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last 90 Days</span>
                <span className="font-bold">₹{((revenue.last90Days || 0) / 1000).toFixed(1)}K</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">All Time</span>
                <span className="font-bold text-lg">₹{((revenue.allTime || 0) / 1000).toFixed(1)}K</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Expenses</span>
                <span className="font-bold text-red-600">₹{((expenses.grandTotal || 0) / 1000).toFixed(1)}K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST Amount</span>
                <span className="font-bold">₹{((expenses.grandGstTotal || 0) / 1000).toFixed(1)}K</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Total with GST</span>
                <span className="font-bold text-lg text-red-600">
                  ₹{((expenses.grandTotalWithGst || 0) / 1000).toFixed(1)}K
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

