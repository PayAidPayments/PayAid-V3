'use client'

import { useState, useRef } from 'react'
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
import { Printer, FileDown } from 'lucide-react'

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
  const reportCardRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  const handleExportPdf = () => {
    window.print()
  }

  return (
    <div className="space-y-5">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * { visibility: hidden; }
              .financial-report-print-area,
              .financial-report-print-area * { visibility: visible; }
              .financial-report-print-area { position: absolute; left: 0; top: 0; width: 100%; max-width: 100%; }
            }
          `,
        }}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Financial Reports</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Trial Balance, P&L, and Balance Sheet</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/finance/${tenantId}/Accounting/Reports/Revenue`}>
            <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">Revenue Dashboard</Button>
          </Link>
          <Link href={`/finance/${tenantId}/Accounting/Reports/Expenses`}>
            <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">Expense Dashboard</Button>
          </Link>
        </div>
      </div>

      <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">Report Settings</CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">Choose report type and date range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2 block">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'pl' | 'balance-sheet' | 'trial-balance')}
                className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 px-3 py-2 text-sm"
              >
                <option value="pl">Profit & Loss Statement</option>
                <option value="balance-sheet">Balance Sheet</option>
                <option value="trial-balance">Trial Balance</option>
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2 block">
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
                className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2 block">
                {reportType === 'trial-balance' || reportType === 'balance-sheet' ? '—' : 'End Date'}
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                disabled={reportType === 'trial-balance' || reportType === 'balance-sheet'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <PageLoading message="Loading financial reports..." fullScreen={false} />
      ) : data ? (
        <Card
          ref={reportCardRef}
          className="financial-report-print-area rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
        >
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {reportType === 'pl' ? 'Profit & Loss Statement' : reportType === 'balance-sheet' ? 'Balance Sheet' : 'Trial Balance'}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                {reportType === 'trial-balance' || reportType === 'balance-sheet'
                  ? `As of ${new Date(reportType === 'trial-balance' ? asOfDate : asOfDate).toLocaleDateString('en-IN')}`
                  : `${new Date(startDate).toLocaleDateString('en-IN')} to ${new Date(endDate).toLocaleDateString('en-IN')}`}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0 print:hidden">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 border-slate-200 dark:border-slate-700" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 border-slate-200 dark:border-slate-700" onClick={handleExportPdf} title="Opens print dialog; choose Save as PDF">
                  <FileDown className="h-4 w-4" />
                  Export PDF
                </Button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Export PDF: choose “Save as PDF” in the print dialog.</p>
            </div>
          </CardHeader>
          <CardContent>
            {reportType === 'trial-balance' && data?.rows !== undefined && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200 dark:border-slate-700">
                        <TableHead className="text-slate-600 dark:text-slate-400">Account</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Type</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400 text-right">Debit (₹)</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400 text-right">Credit (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.rows.map((row: { accountCode: string; accountName: string; accountType: string; debit: number; credit: number }, i: number) => (
                        <TableRow key={i} className="border-slate-200 dark:border-slate-700">
                          <TableCell className="text-slate-900 dark:text-slate-100">{row.accountCode} – {row.accountName}</TableCell>
                          <TableCell className="text-slate-700 dark:text-slate-300 capitalize">{row.accountType}</TableCell>
                          <TableCell className="text-slate-900 dark:text-slate-100 text-right tabular-nums">
                            {row.debit > 0 ? formatINRStandard(row.debit) : '—'}
                          </TableCell>
                          <TableCell className="text-slate-900 dark:text-slate-100 text-right tabular-nums">
                            {row.credit > 0 ? formatINRStandard(row.credit) : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end gap-8 border-t border-slate-200 dark:border-slate-700 pt-4">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Total Debit: {formatINRStandard(data.totalDebit ?? 0)}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Total Credit: {formatINRStandard(data.totalCredit ?? 0)}
                  </span>
                </div>
                {data.isBalanced !== undefined && (
                  <p className={`text-xs ${data.isBalanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {data.isBalanced ? '✓ Books balance.' : 'Debit and credit totals do not match — check postings.'}
                  </p>
                )}
              </div>
            )}

            {reportType === 'pl' && data?.revenue !== undefined && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">Revenue</h3>
                  <div className="space-y-2 pl-4">
                    {data.revenue?.breakdown?.invoices != null && data.revenue.breakdown.invoices !== 0 && (
                      <div className="flex justify-between text-sm text-slate-700 dark:text-slate-300">
                        <span>From invoices (paid)</span>
                        <span className="tabular-nums">{formatINRStandard(data.revenue.breakdown.invoices)}</span>
                      </div>
                    )}
                    {data.revenue?.breakdown?.ledger != null && data.revenue.breakdown.ledger !== 0 && (
                      <div className="flex justify-between text-sm text-slate-700 dark:text-slate-300">
                        <span>From ledger (revenue accounts)</span>
                        <span className="tabular-nums">{formatINRStandard(data.revenue.breakdown.ledger)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-medium text-slate-900 dark:text-slate-50 pt-2">
                      <span>Total Revenue</span>
                      <span className="tabular-nums">{formatINRStandard(data.revenue?.total || 0)}</span>
                    </div>
                  </div>
                </div>
                <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">Expenses</h3>
                  <div className="space-y-2 pl-4">
                    {data.expenses?.breakdown?.expenseTable != null && data.expenses.breakdown.expenseTable !== 0 && (
                      <div className="flex justify-between text-sm text-slate-700 dark:text-slate-300">
                        <span>From expense records</span>
                        <span className="tabular-nums">{formatINRStandard(data.expenses.breakdown.expenseTable)}</span>
                      </div>
                    )}
                    {data.expenses?.breakdown?.byCategory != null && Object.keys(data.expenses.breakdown.byCategory).length > 0 && (
                      <>
                        {Object.entries(data.expenses.breakdown.byCategory).map(([cat, amt]: [string, number]) => (
                          <div key={cat} className="flex justify-between text-sm text-slate-700 dark:text-slate-300 pl-2">
                            <span>{cat}</span>
                            <span className="tabular-nums">{formatINRStandard(amt)}</span>
                          </div>
                        ))}
                      </>
                    )}
                    {data.expenses?.breakdown?.ledger != null && data.expenses.breakdown.ledger !== 0 && (
                      <div className="flex justify-between text-sm text-slate-700 dark:text-slate-300">
                        <span>From ledger (expense accounts)</span>
                        <span className="tabular-nums">{formatINRStandard(data.expenses.breakdown.ledger)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-medium text-slate-900 dark:text-slate-50 pt-2">
                      <span>Total Expenses</span>
                      <span className="tabular-nums">{formatINRStandard(data.expenses?.total || 0)}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <div className="flex justify-between text-base font-semibold text-slate-900 dark:text-slate-50">
                    <span>Net Profit/Loss</span>
                    <span className={`tabular-nums ${data.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatINRStandard(data.netProfit || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {reportType === 'balance-sheet' && (data.assets !== undefined || data.totals !== undefined) && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">Assets</h3>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between text-sm text-slate-700 dark:text-slate-300">
                      <span>Total Assets</span>
                      <span className="font-medium tabular-nums">
                        {formatINRStandard(data.totals?.assets ?? data.assets ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">Liabilities</h3>
                  <div className="space-y-2 pl-4">
                    <div className="flex justify-between text-sm text-slate-700 dark:text-slate-300">
                      <span>Total Liabilities</span>
                      <span className="font-medium tabular-nums">
                        {formatINRStandard(data.totals?.liabilities ?? data.liabilities ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <div className="flex justify-between text-base font-semibold text-slate-900 dark:text-slate-50">
                    <span>Equity</span>
                    <span className="tabular-nums">
                      {formatINRStandard(data.totals?.equity ?? data.equity ?? 0)}
                    </span>
                  </div>
                </div>
                {data.totals?.balance != null && Math.abs(data.totals.balance) >= 0.02 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                    Balance check: Assets − Liabilities − Equity = {formatINRStandard(data.totals.balance)}. Expected 0 — verify account types and postings.
                  </p>
                )}
                {data.totals?.balance != null && Math.abs(data.totals.balance) < 0.02 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 pt-2">✓ Balance sheet balances.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <CardContent className="py-12 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">No data available for the selected period. Run a report to see results.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
