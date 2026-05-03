'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/loading'
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

export default function FinanceExpensesReportsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
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
    return <PageLoading message="Loading expense dashboard..." fullScreen={false} />
  }

  const summary = expenseSummary?.summary || {}
  const byCategory = expenseSummary?.byCategory || []
  const byEmployee = expenseSummary?.byEmployee || []

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Expense Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Track and analyze business expenses</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={period === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('7d')}
            className="dark:border-gray-600 dark:text-gray-300"
          >
            7 Days
          </Button>
          <Button
            variant={period === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('30d')}
            className="dark:border-gray-600 dark:text-gray-300"
          >
            30 Days
          </Button>
          <Button
            variant={period === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('90d')}
            className="dark:border-gray-600 dark:text-gray-300"
          >
            90 Days
          </Button>
          <Button
            variant={period === '1y' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('1y')}
            className="dark:border-gray-600 dark:text-gray-300"
          >
            1 Year
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {summary.totalExpenses || 0}
            </div>
            <CardDescription className="dark:text-gray-400">Approved expenses</CardDescription>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold dark:text-gray-100">
              ₹{((summary.grandTotal || 0) / 1000).toFixed(1)}K
            </div>
            <CardDescription className="dark:text-gray-400">Before GST</CardDescription>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total GST</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold dark:text-gray-100">
              ₹{((summary.grandGstTotal || 0) / 1000).toFixed(1)}K
            </div>
            <CardDescription className="dark:text-gray-400">GST amount</CardDescription>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Grand Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              ₹{((summary.grandTotalWithGst || 0) / 1000).toFixed(1)}K
            </div>
            <CardDescription className="dark:text-gray-400">Including GST</CardDescription>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categoryChartData.length > 0 && (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Expenses by Category</CardTitle>
              <CardDescription className="dark:text-gray-400">Distribution of expenses</CardDescription>
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
                  <Tooltip formatter={(value: any) => value ? `₹${(Number(value) / 1000).toFixed(1)}K` : ''} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {categoryChartData.length > 0 && (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Expenses by Category (Bar)</CardTitle>
              <CardDescription className="dark:text-gray-400">Category-wise expense comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => value ? `₹${(Number(value) / 1000).toFixed(1)}K` : ''} />
                  <Bar dataKey="value" fill={PAYAID_PURPLE} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {employeeChartData.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Employee Reimbursements</CardTitle>
            <CardDescription className="dark:text-gray-400">Expenses by employee</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number | undefined) => value ? `₹${(value / 1000).toFixed(1)}K` : ''} />
                <Bar dataKey="value" fill={PAYAID_GOLD} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {byCategory.length > 0 && (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {byCategory.map((item: any) => (
                  <div key={item.category} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-medium dark:text-gray-100">{item.category}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{item.count} expenses</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold dark:text-gray-100">₹{((item.totalWithGst || 0) / 1000).toFixed(1)}K</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        ₹{((item.total || 0) / 1000).toFixed(1)}K + ₹{((item.gstTotal || 0) / 1000).toFixed(1)}K GST
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {byEmployee.length > 0 && (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Employee Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {byEmployee.map((item: any) => (
                  <div key={item.employeeId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-medium dark:text-gray-100">{item.employeeName}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{item.count} expenses</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold dark:text-gray-100">₹{((item.total || 0) / 1000).toFixed(1)}K</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Total reimbursement</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {(!byCategory.length && !byEmployee.length) && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
            No expense data found for the selected period
          </CardContent>
        </Card>
      )}
    </div>
  )
}
