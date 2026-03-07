'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageLoading } from '@/components/ui/loading'
import { formatINR } from '@/lib/utils/formatINR'
import { useAuthStore } from '@/lib/stores/auth'
import {
  Calendar,
  Users,
  Wallet,
  FileCheck,
  Play,
  FileSpreadsheet,
  MessageCircle,
  Sliders,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  BarChart3,
  UserCircle,
  Download,
} from 'lucide-react'
import { format } from 'date-fns'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  READY: 'Ready',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  LOCKED: 'Locked',
}

export default function HRPayrollPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const token = useAuthStore((s) => s.token)

  const { data, isLoading } = useQuery({
    queryKey: ['payroll-dashboard', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/hr/payroll/dashboard', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to fetch payroll dashboard')
      return res.json()
    },
    enabled: !!token,
  })

  if (isLoading) {
    return <PageLoading message="Loading payroll dashboard..." fullScreen={false} />
  }

  const nextPayrollDate = data?.nextPayrollDate
    ? format(new Date(data.nextPayrollDate), 'MMM d')
    : '—'
  const employeeCount = data?.employeeCount ?? 0
  const grossPayroll = data?.grossPayroll ?? 0
  const netPayroll = data?.netPayroll ?? 0
  const payrollStatus = data?.payrollStatus ?? 'DRAFT'
  const deductionsBreakdown = data?.deductionsBreakdown ?? {
    tds: 0,
    pf: 0,
    pt: 0,
    esi: 0,
    other: 0,
  }
  const compliance = data?.complianceSummary ?? {
    tds: { calculated: false, form24QReady: false },
    pf: { amount: 0, ecrFiled: false },
    pt: { amount: 0, challansReady: false },
    esi: { amount: 0, returnReady: false },
    missingPanCount: 0,
  }
  const grossTotal = grossPayroll || 1
  const tdsPct = grossTotal ? ((deductionsBreakdown.tds / grossTotal) * 100).toFixed(0) : '0'
  const pfPct = grossTotal ? ((deductionsBreakdown.pf / grossTotal) * 100).toFixed(0) : '0'
  const ptPct = grossTotal ? ((deductionsBreakdown.pt / grossTotal) * 100).toFixed(0) : '0'
  const esiPct = grossTotal ? ((deductionsBreakdown.esi / grossTotal) * 100).toFixed(0) : '0'

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Band 0: Header + current payroll status */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Payroll</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            One-click payroll · India compliance · PayAid Payments
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/hr/${tenantId}/Payroll-Runs/new`}>
            <Button size="sm" className="gap-2">
              <Play className="h-4 w-4" />
              Run Payroll
            </Button>
          </Link>
          <Link href={`/hr/${tenantId}/Payroll/Cycles`}>
            <Button variant="outline" size="sm">
              Preview
            </Button>
          </Link>
          <Link href={`/hr/${tenantId}/Payroll/Reports`}>
            <Button variant="outline" size="sm" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Export Tally
            </Button>
          </Link>
          <Link href={`/hr/${tenantId}/Payroll/AI-Payslip`}>
            <Button variant="outline" size="sm" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              AI Payslip Chat
            </Button>
          </Link>
        </div>
      </div>

      {/* Top stat bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Next Payroll"
          value={nextPayrollDate}
          subtitle="Scheduled pay date"
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          title="Employees"
          value={employeeCount}
          subtitle="In scope this run"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Gross"
          value={formatINR(grossPayroll)}
          subtitle="This cycle"
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          title="Net Transfer"
          value={formatINR(netPayroll)}
          subtitle="After deductions"
          status={STATUS_LABELS[payrollStatus] ?? payrollStatus}
          icon={<FileCheck className="h-4 w-4" />}
        />
      </div>

      {/* Payroll Summary + Compliance Dashboard */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Payroll Summary</CardTitle>
            <CardDescription>Gross, deductions and net for current cycle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              Gross Payroll: {formatINR(grossPayroll)}
            </div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Deductions breakdown
            </div>
            <ul className="space-y-1.5 text-sm">
              <li className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">TDS</span>
                <span>{formatINR(deductionsBreakdown.tds)} ({tdsPct}%)</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">PF</span>
                <span>{formatINR(deductionsBreakdown.pf)} ({pfPct}%)</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">PT</span>
                <span>{formatINR(deductionsBreakdown.pt)} ({ptPct}%)</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">ESI</span>
                <span>{formatINR(deductionsBreakdown.esi)} ({esiPct}%)</span>
              </li>
              {deductionsBreakdown.other > 0 && (
                <li className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Other</span>
                  <span>{formatINR(deductionsBreakdown.other)}</span>
                </li>
              )}
            </ul>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 font-semibold flex justify-between">
              <span>Net Transfer</span>
              <span className="text-emerald-600 dark:text-emerald-400">{formatINR(netPayroll)}</span>
            </div>
            <Link href={`/hr/${tenantId}/Payroll/Salary-Structures`}>
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Sliders className="h-4 w-4" />
                Adjust Components
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Compliance Dashboard</CardTitle>
            <CardDescription>Statutory status and filings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  {compliance.tds?.form24QReady ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-slate-400" />
                  )}
                  TDS
                </span>
                <span>
                  {compliance.tds?.calculated ? 'Calculated' : '—'} · Form 24Q{' '}
                  {compliance.tds?.form24QReady ? 'Ready' : 'Pending'}
                </span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  {compliance.pf?.ecrFiled ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-slate-400" />
                  )}
                  PF
                </span>
                <span>
                  {formatINR(compliance.pf?.amount ?? 0)} · ECR{' '}
                  {compliance.pf?.ecrFiled ? 'Filed' : 'Pending'}
                </span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  {compliance.pt?.challansReady ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-slate-400" />
                  )}
                  PT
                </span>
                <span>
                  {formatINR(compliance.pt?.amount ?? 0)} · Challans{' '}
                  {compliance.pt?.challansReady ? 'Ready' : 'Pending'}
                </span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  {compliance.esi?.returnReady ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-slate-400" />
                  )}
                  ESI
                </span>
                <span>
                  {formatINR(compliance.esi?.amount ?? 0)} · Return{' '}
                  {compliance.esi?.returnReady ? 'Ready' : 'Pending'}
                </span>
              </li>
            </ul>
            {compliance.missingPanCount > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-sm">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {compliance.missingPanCount} employee(s) missing PAN
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Link href={`/hr/${tenantId}/Payroll/Compliance`}>
                <Button variant="outline" size="sm" className="flex-1">
                  File All Returns
                </Button>
              </Link>
              <Link href={`/hr/${tenantId}/Payroll/Reports`}>
                <Button variant="outline" size="sm" className="flex-1">
                  View Challans
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salary Components · ESS · Reports sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href={`/hr/${tenantId}/Payroll/Salary-Structures`}>
          <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sliders className="h-4 w-4" />
                Salary Components
              </CardTitle>
              <CardDescription>Structures, allowances, deductions</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                Manage <ChevronRight className="h-3 w-3" />
              </span>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/hr/${tenantId}/ESS`}>
          <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                Employee Self-Service
              </CardTitle>
              <CardDescription>Payslips, declarations, leave</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                Open ESS <ChevronRight className="h-3 w-3" />
              </span>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/hr/${tenantId}/Payroll/Reports`}>
          <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Reports & Analytics
              </CardTitle>
              <CardDescription>Register, statutory, cost analysis</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                View reports <ChevronRight className="h-3 w-3" />
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions bar */}
      <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link href={`/hr/${tenantId}/Payroll-Runs/new`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Play className="h-4 w-4" />
                Run Payroll
              </Button>
            </Link>
            <Link href={`/hr/${tenantId}/Payroll/Bulk`}>
              <Button variant="outline" size="sm" className="gap-2">
                Bulk Salary Revision
              </Button>
            </Link>
            <Link href={`/hr/${tenantId}/Payroll/Cycles`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Receipt className="h-4 w-4" />
                Issue Payslips
              </Button>
            </Link>
            <Link href={`/hr/${tenantId}/Reimbursements`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Receipt className="h-4 w-4" />
                Reimbursements
              </Button>
            </Link>
            <Link href={`/hr/${tenantId}/Payroll/Reports`}>
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Reports
              </Button>
            </Link>
            <Link href={`/hr/${tenantId}/ctc-calculator`}>
              <Button variant="outline" size="sm" className="gap-2">
                CTC Calculator
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
