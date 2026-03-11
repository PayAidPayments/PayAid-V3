'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageLoading } from '@/components/ui/loading'
import { format } from 'date-fns'
import {
  IndianRupee,
  Users,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  PieChart,
  Play,
  Eye,
  Activity,
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { formatINR } from '@/lib/utils/formatINR'

interface CycleDetail {
  id: string
  cycleName: string
  month: number
  year: number
  status: string
  runType: string
  employeeCount: number
  totalNetPayInr: number
  totalGrossEarningsInr: number
  payrollRuns: Array<{
    id: string
    netPayInr: number
    grossEarningsInr: number
    grossDeductionsInr?: number
    payoutStatus: string
    employee: {
      id: string
      employeeCode: string
      firstName: string
      lastName: string
      department?: { name: string }
      designation?: { name: string }
    }
  }>
  createdAt: string
  updatedAt: string
}

// Stub data for payroll console (replace with API when available)
const STUB = {
  deductionsTotal: 280000,
  bankTransfer: 1420000,
  cashPay: 140000,
  vsLastMonthPercent: 8,
  vsLastMonthReason: '3 new hires',
  compliance: {
    pf: { amount: 184000, matched: true },
    esi: { amount: 92000, matched: true },
    tds: { amount: 210000, calculated: true },
    missingBankCount: 2,
    gstr3bReady: true,
  },
  salaryStructure: [
    { label: 'Basic', amount: 832000, pct: 45 },
    { label: 'HRA', amount: 368000, pct: 20 },
    { label: 'Allowances', amount: 460000, pct: 25 },
    { label: 'Variable Pay', amount: 180000, pct: 10 },
  ],
  steps: [
    { label: 'Review Structure', done: true },
    { label: 'Apply Deductions', done: true },
    { label: 'Generate Payslips', done: true },
    { label: 'Approve & Disburse', done: false },
  ],
  topDeductions: [
    { label: 'TDS', amount: 210000, pct: 12 },
    { label: 'PF', amount: 184000, pct: 10 },
    { label: 'Professional Tax', amount: 28000, pct: 0 },
    { label: 'Loans/Advances', amount: 60000, pct: 0 },
  ],
  recentChanges: [
    { date: '2026-03-06', text: 'Priya promoted (salary +15%)' },
    { date: '2026-03-05', text: 'Ravi joined (₹6L CTC)' },
    { date: '2026-03-03', text: '2 employees salary revised (inflation adjustment)' },
  ],
  employeesReady: 26,
  employeesPending: 2,
  lastRunDate: '2026-02-28',
}

export default function HRPayrollRunDetailPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const id = params.id as string
  const { token } = useAuthStore()

  const { data, isLoading } = useQuery<CycleDetail>({
    queryKey: ['payroll-run-detail', id],
    queryFn: async () => {
      const res = await fetch(`/api/hr/payroll-runs/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    enabled: !!token,
  })

  if (isLoading) {
    return <PageLoading message="Loading payroll run..." fullScreen={false} />
  }

  if (!data || !('cycleName' in data)) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400 mb-4">Payroll run not found</p>
        <Link href={`/hr/${tenantId}/Payroll-Runs`}>
          <Button variant="outline" className="dark:border-slate-600 dark:text-slate-300">Back to Payroll Runs</Button>
        </Link>
      </div>
    )
  }

  const cycle = data as CycleDetail
  const gross = cycle.totalGrossEarningsInr || 0
  const net = cycle.totalNetPayInr || 0
  const deductions = gross > 0 ? gross - net : STUB.deductionsTotal
  const deductionsPct = gross > 0 ? Math.round((deductions / gross) * 100) : 15
  const runs = cycle.payrollRuns || []

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      IN_PROGRESS: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
      LOCKED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
      PAID: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
    }
    return map[status] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
  }

  return (
    <div className="space-y-5 pb-28">
      {/* ——— Sticky header: Period, counts, Gross/Net, actions, status ——— */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-slate-50/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80 dark:supports-[backdrop-filter]:bg-slate-950/80">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50">Payroll Period: {cycle.cycleName}</h1>
            <Badge variant="secondary" className={getStatusBadge(cycle.status)}>{cycle.status}</Badge>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Employees: {cycle.employeeCount} · Gross: {formatINR(gross)} · Net: {formatINR(net)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" className="dark:bg-slate-700 dark:hover:bg-slate-600" disabled><Play className="h-4 w-4 mr-1" /> Run Payroll</Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled><Eye className="h-4 w-4 mr-1" /> Preview All</Button>
            <a href={`/api/hr/payroll-runs/export?format=csv&cycleId=${id}`} download target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300"><Download className="h-4 w-4 mr-1" /> Download Summary</Button>
            </a>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Export Tally</Button>
            <Link href={`/hr/${tenantId}/Payroll-Runs`}>
              <Button variant="ghost" size="sm" className="dark:text-slate-400"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ——— Two-column: Payroll Summary | Compliance Status ——— */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <IndianRupee className="h-4 w-4" /> Payroll Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Gross Payroll</span>
                <span className="font-semibold text-slate-900 dark:text-slate-50">{formatINR(gross)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Deductions</span>
                <span className="font-semibold text-slate-900 dark:text-slate-50">{formatINR(deductions)} ({deductionsPct}%)</span>
              </div>
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-slate-700 dark:text-slate-200">Net Payroll</span>
                <span className="text-slate-900 dark:text-slate-50">{formatINR(net)}</span>
              </div>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Bank transfer: {formatINR(STUB.bankTransfer)} · Cash: {formatINR(STUB.cashPay)}
            </div>
            <p className="text-sm text-green-600 dark:text-green-400">
              Compared to last month: ↑{STUB.vsLastMonthPercent}% ({STUB.vsLastMonthReason})
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>PF: {formatINR(STUB.compliance.pf.amount)} (matched)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>ESI: {formatINR(STUB.compliance.esi.amount)} (matched)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>TDS: {formatINR(STUB.compliance.tds.amount)} (calculated)</span>
            </div>
            {STUB.compliance.missingBankCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <span>{STUB.compliance.missingBankCount} employees missing bank details</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>GSTR‑3B ready for filing</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>View Compliance Report</Button>
              <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Fix Issues</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ——— Salary Structure ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <PieChart className="h-4 w-4" /> Salary Structure
          </CardTitle>
          <CardDescription className="text-xs">Breakdown for this cycle</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STUB.salaryStructure.map((row, i) => (
              <div key={i} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">{row.label}</p>
                <p className="font-semibold text-slate-900 dark:text-slate-50">{formatINR(row.amount)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{row.pct}%</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>View Detailed Structure</Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Bulk Edit Structure</Button>
          </div>
        </CardContent>
      </Card>

      {/* ——— Payroll Run (4 steps) ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">Payroll Run</CardTitle>
          <CardDescription className="text-xs">
            Status: {cycle.status} · Last Run: {format(new Date(STUB.lastRunDate), 'MMM d, yyyy')} · Employees ready: {STUB.employeesReady}/{cycle.employeeCount} · Pending approval: {STUB.employeesPending}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {STUB.steps.map((step, i) => (
              <Button
                key={i}
                variant={step.done ? 'default' : 'outline'}
                size="sm"
                className={step.done ? 'dark:bg-green-700 dark:hover:bg-green-600' : 'dark:border-slate-600 dark:text-slate-300'}
                disabled
              >
                {i + 1}. {step.label} {step.done ? '✓' : '⏳'}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled><Eye className="h-4 w-4 mr-1" /> Preview Payslips</Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Approve All</Button>
            <Button size="sm" className="dark:bg-slate-700 dark:hover:bg-slate-600" disabled>Process Payments</Button>
          </div>
        </CardContent>
      </Card>

      {/* ——— Payslips & Deductions ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <FileText className="h-4 w-4" /> Payslips & Deductions
          </CardTitle>
          <CardDescription className="text-xs">Top deductions this cycle</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STUB.topDeductions.map((d, i) => (
              <div key={i} className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">{d.label}</p>
                <p className="font-semibold text-slate-900 dark:text-slate-50">{formatINR(d.amount)}{d.pct ? ` (${d.pct}%)` : ''}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Download All Payslips ZIP</Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Reimbursements Queue</Button>
          </div>
        </CardContent>
      </Card>

      {/* ——— Payslips table (existing) ——— */}
      {runs.length > 0 && (
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">Payslips in this run</CardTitle>
            <CardDescription className="text-xs">Employee-wise net pay for this cycle</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-800">
                  <TableHead className="text-slate-600 dark:text-slate-400">Employee</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">Code</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">Department</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">Gross</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">Net Pay</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">Payout Status</TableHead>
                  <TableHead className="text-right text-slate-600 dark:text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id} className="border-slate-200 dark:border-slate-800">
                    <TableCell className="font-medium text-slate-900 dark:text-slate-50">
                      {run.employee?.firstName} {run.employee?.lastName}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{run.employee?.employeeCode}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{run.employee?.department?.name || '—'}</TableCell>
                    <TableCell>{formatINR(Number(run.grossEarningsInr || 0))}</TableCell>
                    <TableCell className="font-medium">{formatINR(Number(run.netPayInr || 0))}</TableCell>
                    <TableCell>
                      <Badge variant={run.payoutStatus === 'PAID' ? 'default' : 'secondary'} className="text-xs">
                        {run.payoutStatus || 'PENDING'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/hr/${tenantId}/Payroll/Runs/${run.id}`}>
                        <Button variant="ghost" size="sm" className="dark:text-slate-300 dark:hover:bg-slate-800">
                          <FileText className="mr-1 h-4 w-4" /> Payslip
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ——— Recent Changes ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Activity className="h-4 w-4" /> Recent Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-0">
            {STUB.recentChanges.map((item, i) => (
              <li key={i} className="flex gap-3 py-3 border-b border-slate-200 dark:border-slate-800 last:border-0">
                <div className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{item.text}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{format(new Date(item.date), 'MMM d, yyyy')}</p>
                </div>
              </li>
            ))}
          </ul>
          <Button variant="ghost" size="sm" className="mt-2 dark:text-slate-400" disabled>View Change Log</Button>
        </CardContent>
      </Card>

      {/* ——— Bulk Actions (sticky bottom) ——— */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Select employees:</span>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>All {cycle.employeeCount}</Button>
            <Button variant="ghost" size="sm" className="dark:text-slate-400" disabled>Managers</Button>
            <Button variant="ghost" size="sm" className="dark:text-slate-400" disabled>Sales Team</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Adjust Salary</Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Issue Payslip</Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Mark Absent</Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Advance Payment</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
