'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/loading'
import { format } from 'date-fns'

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export default function FinanceExpensesReportsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  const { data, isLoading } = useQuery({
    queryKey: ['expense-summary', startDate, endDate],
    queryFn: async () => {
      const queryString = new URLSearchParams()
      if (startDate) queryString.set('startDate', startDate)
      if (endDate) queryString.set('endDate', endDate)
      
      const response = await fetch(`/api/accounting/expenses/reports/summary?${queryString}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch expense summary')
      return response.json()
    },
  })

  if (isLoading) {
    return <PageLoading message="Loading expense reports..." fullScreen={false} />
  }

  const summary = data?.summary
  const byCategory = data?.byCategory || []
  const byEmployee = data?.byEmployee || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Expense Reports</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">View expense summaries and analytics</p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold dark:text-gray-100">{summary?.totalExpenses || 0}</div>
            <CardDescription className="dark:text-gray-400">Approved expenses</CardDescription>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold dark:text-gray-100">
              ₹{((summary?.grandTotal || 0) / 1000).toFixed(1)}K
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
              ₹{((summary?.grandGstTotal || 0) / 1000).toFixed(1)}K
            </div>
            <CardDescription className="dark:text-gray-400">GST amount</CardDescription>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Grand Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              ₹{((summary?.grandTotalWithGst || 0) / 1000).toFixed(1)}K
            </div>
            <CardDescription className="dark:text-gray-400">Including GST</CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* By Category */}
      {byCategory.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Expenses by Category</CardTitle>
            <CardDescription className="dark:text-gray-400">Breakdown of expenses by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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

      {/* By Employee */}
      {byEmployee.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Expenses by Employee</CardTitle>
            <CardDescription className="dark:text-gray-400">Employee reimbursement expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
