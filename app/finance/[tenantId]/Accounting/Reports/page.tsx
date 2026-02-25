'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageLoading } from '@/components/ui/loading'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatINRStandard } from '@/lib/utils/formatINR'

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export default function FinanceReportsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [reportType, setReportType] = useState<'pl' | 'balance-sheet' | 'trial-balance'>('pl')
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0])

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
    queryKey: ['balance-sheet-report', asOfDate],
    queryFn: async () => {
      const response = await fetch(`/api/accounting/reports/balance-sheet?asOfDate=${asOfDate}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch balance sheet')
      return response.json()
    },
    enabled: reportType === 'balance-sheet',
  })

  const { data: trialBalanceData, isLoading: trialBalanceLoading } = useQuery({
    queryKey: ['trial-balance-report', asOfDate],
    queryFn: async () => {
      const response = await fetch(`/api/accounting/reports/trial-balance?asOfDate=${asOfDate}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch trial balance')
      return response.json()
    },
    enabled: reportType === 'trial-balance',
  })

  const isLoading = reportType === 'pl' ? plLoading : reportType === 'balance-sheet' ? balanceSheetLoading : trialBalanceLoading
  const data = reportType === 'pl' ? plData : reportType === 'balance-sheet' ? balanceSheetData : trialBalanceData

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Financial Reports</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">View your business financial reports</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/finance/${tenantId}/Accounting/Reports/Revenue`}>
            <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">📈 Revenue Dashboard</Button>
          </Link>
          <Link href={`/finance/${tenantId}/Accounting/Reports/Expenses`}>
            <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">📊 Expense Dashboard</Button>
          </Link>
        </div>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Report Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block dark:text-gray-300">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'pl' | 'balance-sheet' | 'trial-balance')}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3 py-2 text-sm"
              >
                <option value="pl">Profit & Loss Statement</option>
                <option value="balance-sheet">Balance Sheet</option>
                <option value="trial-balance">Trial Balance</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block dark:text-gray-300">
                {reportType === 'trial-balance' || reportType === 'balance-sheet' ? 'As of date' : 'Start Date'}
              </label>
              <Input
                type="date"
                value={reportType === 'trial-balance' || reportType === 'balance-sheet' ? asOfDate : startDate}
                onChange={(e) =>
                  reportType === 'trial-balance' || reportType === 'balance-sheet'
                    ? setAsOfDate(e.target.value)
                    : setStartDate(e.target.value)
                }
                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block dark:text-gray-300">
                {reportType === 'trial-balance' || reportType === 'balance-sheet' ? '—' : 'End Date'}
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                disabled={reportType === 'trial-balance' || reportType === 'balance-sheet'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <PageLoading message="Loading financial reports..." fullScreen={false} />
      ) : data ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">
              {reportType === 'pl' ? 'Profit & Loss Statement' : reportType === 'balance-sheet' ? 'Balance Sheet' : 'Trial Balance'}
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              {reportType === 'trial-balance' || reportType === 'balance-sheet'
                ? `As of ${new Date(reportType === 'trial-balance' ? asOfDate : asOfDate).toLocaleDateString()}`
                : `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportType === 'trial-balance' && data?.rows !== undefined && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-gray-700">
                        <TableHead className="dark:text-gray-300">Account</TableHead>
                        <TableHead className="dark:text-gray-300">Type</TableHead>
                        <TableHead className="dark:text-gray-300 text-right">Debit (₹)</TableHead>
                        <TableHead className="dark:text-gray-300 text-right">Credit (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.rows.map((row: { accountCode: string; accountName: string; accountType: string; debit: number; credit: number }, i: number) => (
                        <TableRow key={i} className="dark:border-gray-700">
                          <TableCell className="dark:text-gray-200">{row.accountCode} – {row.accountName}</TableCell>
                          <TableCell className="dark:text-gray-200 capitalize">{row.accountType}</TableCell>
                          <TableCell className="dark:text-gray-200 text-right">
                            {row.debit > 0 ? formatINRStandard(row.debit) : '—'}
                          </TableCell>
                          <TableCell className="dark:text-gray-200 text-right">
                            {row.credit > 0 ? formatINRStandard(row.credit) : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end gap-8 border-t dark:border-gray-700 pt-4">
                  <span className="font-semibold dark:text-gray-100">
                    Total Debit: {formatINRStandard(data.totalDebit ?? 0)}
                  </span>
                  <span className="font-semibold dark:text-gray-100">
                    Total Credit: {formatINRStandard(data.totalCredit ?? 0)}
                  </span>
                </div>
                {data.isBalanced !== undefined && (
                  <p className={`text-sm ${data.isBalanced ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {data.isBalanced ? 'Books balance.' : 'Debit and credit totals do not match — check postings.'}
                  </p>
                )}
              </div>
            )}

            {reportType === 'pl' && data?.revenue !== undefined && (
              <div className="space-y-4">
                <div className="border-b dark:border-gray-700 pb-4">
                  <h3 className="font-semibold mb-3 dark:text-gray-100">Revenue</h3>
                  <div className="space-y-2 pl-4">
                    {data.revenue?.breakdown?.invoices != null && data.revenue.breakdown.invoices !== 0 && (
                      <div className="flex justify-between dark:text-gray-300">
                        <span>From invoices (paid)</span>
                        <span>{formatINRStandard(data.revenue.breakdown.invoices)}</span>
                      </div>
                    )}
                    {data.revenue?.breakdown?.ledger != null && data.revenue.breakdown.ledger !== 0 && (
                      <div className="flex justify-between dark:text-gray-300">
                        <span>From ledger (revenue accounts)</span>
                        <span>{formatINRStandard(data.revenue.breakdown.ledger)}</span>
                      </div>
                    )}
                    <div className="flex justify-between dark:text-gray-100 font-medium pt-2">
                      <span>Total Revenue</span>
                      <span>{formatINRStandard(data.revenue?.total || 0)}</span>
                    </div>
                  </div>
                </div>
                <div className="border-b dark:border-gray-700 pb-4">
                  <h3 className="font-semibold mb-3 dark:text-gray-100">Expenses</h3>
                  <div className="space-y-2 pl-4">
                    {data.expenses?.breakdown?.expenseTable != null && data.expenses.breakdown.expenseTable !== 0 && (
                      <div className="flex justify-between dark:text-gray-300">
                        <span>From expense records</span>
                        <span>{formatINRStandard(data.expenses.breakdown.expenseTable)}</span>
                      </div>
                    )}
                    {data.expenses?.breakdown?.byCategory != null && Object.keys(data.expenses.breakdown.byCategory).length > 0 && (
                      <>
                        {Object.entries(data.expenses.breakdown.byCategory).map(([cat, amt]: [string, number]) => (
                          <div key={cat} className="flex justify-between dark:text-gray-300 pl-2">
                            <span>{cat}</span>
                            <span>{formatINRStandard(amt)}</span>
                          </div>
                        ))}
                      </>
                    )}
                    {data.expenses?.breakdown?.ledger != null && data.expenses.breakdown.ledger !== 0 && (
                      <div className="flex justify-between dark:text-gray-300">
                        <span>From ledger (expense accounts)</span>
                        <span>{formatINRStandard(data.expenses.breakdown.ledger)}</span>
                      </div>
                    )}
                    <div className="flex justify-between dark:text-gray-100 font-medium pt-2">
                      <span>Total Expenses</span>
                      <span>{formatINRStandard(data.expenses?.total || 0)}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <div className="flex justify-between text-lg font-bold dark:text-gray-100">
                    <span>Net Profit/Loss</span>
                    <span className={data.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {formatINRStandard(data.netProfit || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {reportType === 'balance-sheet' && (data.assets !== undefined || data.totals !== undefined) && (
              <div className="space-y-4">
                <div className="border-b dark:border-gray-700 pb-4">
                  <h3 className="font-semibold mb-3 dark:text-gray-100">Assets</h3>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between dark:text-gray-300">
                      <span>Total Assets</span>
                      <span className="font-medium">
                        {formatINRStandard(data.totals?.assets ?? data.assets ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="border-b dark:border-gray-700 pb-4">
                  <h3 className="font-semibold mb-3 dark:text-gray-100">Liabilities</h3>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between dark:text-gray-300">
                      <span>Total Liabilities</span>
                      <span className="font-medium">
                        {formatINRStandard(data.totals?.liabilities ?? data.liabilities ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <div className="flex justify-between text-lg font-bold dark:text-gray-100">
                    <span>Equity</span>
                    <span className="font-medium">
                      {formatINRStandard(data.totals?.equity ?? data.equity ?? 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">No data available for the selected period</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
