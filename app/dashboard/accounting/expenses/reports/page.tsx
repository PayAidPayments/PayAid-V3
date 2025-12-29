'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export default function ExpenseReportsPage() {
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
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const summary = data?.summary
  const byCategory = data?.byCategory || []
  const byEmployee = data?.byEmployee || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense Reports</h1>
          <p className="mt-2 text-gray-600">View expense summaries and analytics</p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10 rounded-md border border-gray-300 px-3"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-10 rounded-md border border-gray-300 px-3"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.totalExpenses || 0}</div>
            <CardDescription>Approved expenses</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ₹{((summary?.grandTotal || 0) / 1000).toFixed(1)}K
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
              ₹{((summary?.grandGstTotal || 0) / 1000).toFixed(1)}K
            </div>
            <CardDescription>GST amount</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Grand Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ₹{((summary?.grandTotalWithGst || 0) / 1000).toFixed(1)}K
            </div>
            <CardDescription>Including GST</CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* By Category */}
      {byCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Breakdown of expenses by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
            <CardTitle>Expenses by Employee</CardTitle>
            <CardDescription>Employee reimbursement expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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

