'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

const PAYAID_PURPLE = '#53328A'
const PAYAID_GOLD = '#F5C700'
const PAYAID_LIGHT_PURPLE = '#6B4BA1'

const COLORS = [PAYAID_PURPLE, PAYAID_GOLD, PAYAID_LIGHT_PURPLE, '#ef4444', '#10b981', '#3b82f6']

export default function ExpenseDashboardPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  const { data: expenseSummary, isLoading } = useQuery({
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
      if (!response.ok) return { summary: {}, byCategory: [], byEmployee: [] }
      return response.json()
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const summary = expenseSummary?.summary || {}
  const byCategory = expenseSummary?.byCategory || []
  const byEmployee = expenseSummary?.byEmployee || []

  // Prepare chart data
  const categoryChartData = byCategory.map((item: any) => ({
    name: item.category,
    value: item.totalWithGst || 0,
  }))

  const employeeChartData = byEmployee.map((item: any) => ({
    name: item.employeeName,
    value: item.total || 0,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense Dashboard</h1>
          <p className="mt-2 text-gray-600">Track and analyze business expenses</p>
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
            <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {summary.totalExpenses || 0}
            </div>
            <CardDescription>Approved expenses</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ₹{((summary.grandTotal || 0) / 1000).toFixed(1)}K
            </div>
            <CardDescription>Before GST</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total GST</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ₹{((summary.grandGstTotal || 0) / 1000).toFixed(1)}K
            </div>
            <CardDescription>GST amount</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Grand Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              ₹{((summary.grandTotalWithGst || 0) / 1000).toFixed(1)}K
            </div>
            <CardDescription>Including GST</CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Pie Chart */}
        {categoryChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
              <CardDescription>Distribution of expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) => {
                      const { name, percent } = props
                      return `${name || ''} ${percent ? (percent * 100).toFixed(0) : 0}%`
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryChartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${(value / 1000).toFixed(1)}K`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Category Bar Chart */}
        {categoryChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category (Bar)</CardTitle>
              <CardDescription>Category-wise expense comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `₹${(value / 1000).toFixed(1)}K`} />
                  <Bar dataKey="value" fill={PAYAID_PURPLE} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Employee Expenses Chart */}
      {employeeChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Employee Reimbursements</CardTitle>
            <CardDescription>Expenses by employee</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `₹${(value / 1000).toFixed(1)}K`} />
                <Bar dataKey="value" fill={PAYAID_GOLD} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By Category */}
        {byCategory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {byCategory.map((item: any) => (
                  <div key={item.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{item.category}</div>
                      <div className="text-sm text-gray-600">{item.count} expenses</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">₹{((item.totalWithGst || 0) / 1000).toFixed(1)}K</div>
                      <div className="text-xs text-gray-600">
                        ₹{((item.total || 0) / 1000).toFixed(1)}K + ₹{((item.gstTotal || 0) / 1000).toFixed(1)}K GST
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* By Employee */}
        {byEmployee.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Employee Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {byEmployee.map((item: any) => (
                  <div key={item.employeeId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{item.employeeName}</div>
                      <div className="text-sm text-gray-600">{item.count} expenses</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">₹{((item.total || 0) / 1000).toFixed(1)}K</div>
                      <div className="text-xs text-gray-600">Total reimbursement</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {(!byCategory.length && !byEmployee.length) && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No expense data found for the selected period
          </CardContent>
        </Card>
      )}
    </div>
  )
}

