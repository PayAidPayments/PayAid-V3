'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'pl' | 'balance-sheet'>('pl')
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  const { data: plData, isLoading: plLoading } = useQuery({
    queryKey: ['pl-report', startDate, endDate],
    queryFn: async () => {
      const queryString = new URLSearchParams()
      queryString.set('startDate', startDate)
      queryString.set('endDate', endDate)
      
      const response = await fetch(`/api/accounting/reports/pl?${queryString}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch P&L report')
      return response.json()
    },
    enabled: reportType === 'pl',
  })

  const { data: balanceSheetData, isLoading: balanceSheetLoading } = useQuery({
    queryKey: ['balance-sheet-report', startDate, endDate],
    queryFn: async () => {
      const queryString = new URLSearchParams()
      queryString.set('startDate', startDate)
      queryString.set('endDate', endDate)
      
      const response = await fetch(`/api/accounting/reports/balance-sheet?${queryString}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch balance sheet')
      return response.json()
    },
    enabled: reportType === 'balance-sheet',
  })

  const isLoading = reportType === 'pl' ? plLoading : balanceSheetLoading
  const data = reportType === 'pl' ? plData : balanceSheetData

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="mt-2 text-gray-600">View your business financial reports</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/accounting/reports/revenue">
            <Button variant="outline">📈 Revenue Dashboard</Button>
          </Link>
          <Link href="/dashboard/accounting/reports/expenses">
            <Button variant="outline">📊 Expense Dashboard</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'pl' | 'balance-sheet')}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="pl">Profit & Loss Statement</option>
                <option value="balance-sheet">Balance Sheet</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">Loading...</div>
      ) : data ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {reportType === 'pl' ? 'Profit & Loss Statement' : 'Balance Sheet'}
            </CardTitle>
            <CardDescription>
              {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportType === 'pl' && data.revenue !== undefined && (
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-3">Revenue</h3>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between">
                      <span>Total Revenue</span>
                      <span className="font-medium">
                        ₹{(data.revenue?.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-3">Expenses</h3>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between">
                      <span>Total Expenses</span>
                      <span className="font-medium">
                        ₹{(data.expenses?.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Net Profit/Loss</span>
                    <span className={data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ₹{data.netProfit?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {reportType === 'balance-sheet' && data.assets !== undefined && (
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-3">Assets</h3>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between">
                      <span>Total Assets</span>
                      <span className="font-medium">
                        ₹{data.assets?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-3">Liabilities</h3>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between">
                      <span>Total Liabilities</span>
                      <span className="font-medium">
                        ₹{data.liabilities?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Equity</span>
                    <span className="font-medium">
                      ₹{data.equity?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No data available for the selected period</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
