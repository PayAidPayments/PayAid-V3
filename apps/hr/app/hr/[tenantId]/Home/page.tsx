'use client'

import { useParams } from 'next/navigation'
import {
  Users,
  Briefcase,
  IndianRupee,
  CheckCircle,
  UserPlus,
  Calendar,
  Wallet,
} from 'lucide-react'
import {
  ModuleDashboardShell,
  DashboardEmptyState,
  DashboardSkeleton,
  type DashboardKpi,
  type DashboardAction,
} from '@/components/modules/dashboard'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { useHRSummary } from '@/lib/hooks/hr/useHRSummary'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export default function HRDashboardPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) ?? ''
  const { data: stats, isLoading, error: fetchError } = useHRSummary({ tenantId })
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!

  if (!tenantId || isLoading) {
    return <DashboardSkeleton />
  }

  const safeStats = stats ?? {
    headcount: 0,
    contractors: 0,
    turnover: 0,
    absentToday: 0,
    nextPayroll: '',
    nextPayrollAmount: 0,
    complianceScore: 0,
    pendingReimbursements: 0,
    pendingReimbursementsAmount: 0,
    arrears: 0,
    avgEngagement: 0,
    okrCompletion: 0,
    trainingDue: 0,
    flightRisks: [] as unknown[],
    hiringVelocity: 0,
    overtimeRisk: { team: '', risk: 0 },
    healthScore: 0,
    healthScoreChange: 0,
    aiInsights: [] as unknown[],
    attritionTrend: [] as { month: string; rate: number }[],
    hiringVelocityTrend: [] as { month: string; days: number }[],
    payrollCostTrend: [] as { month: string; cost: number }[],
  }

  const kpis: DashboardKpi[] = [
    {
      label: 'Active employees',
      value: safeStats.headcount,
      change: safeStats.headcount > 0 ? 2 : undefined,
      trend: 'up',
      icon: <Users className="w-5 h-5" />,
      tone: 'purple',
      href: `/hr/${tenantId}/Employees`,
    },
    {
      label: 'Contractors',
      value: safeStats.contractors,
      icon: <Briefcase className="w-5 h-5" />,
      tone: 'info',
      href: `/hr/${tenantId}/Contractors`,
    },
    {
      label: 'Next payroll',
      value: formatINRForDisplay(safeStats.nextPayrollAmount || 0),
      icon: <IndianRupee className="w-5 h-5" />,
      tone: 'gold',
      href: `/hr/${tenantId}/Payroll-Runs`,
    },
    {
      label: 'Compliance',
      value: `${safeStats.complianceScore || 0}%`,
      icon: <CheckCircle className="w-5 h-5" />,
      tone: 'success',
      href: `/hr/${tenantId}/Statutory-Compliance`,
    },
  ]

  const insightText =
    safeStats.absentToday > 0
      ? `${safeStats.absentToday} absent today. Next payroll ${formatINRForDisplay(safeStats.nextPayrollAmount || 0)}${safeStats.nextPayroll ? ` on ${safeStats.nextPayroll}` : ''}.`
      : safeStats.headcount > 0
        ? `Workforce steady at ${safeStats.headcount} employees. Compliance score ${safeStats.complianceScore}%.`
        : 'No workforce data yet. Add employees to unlock HR insights.'

  const actions: DashboardAction[] = [
    {
      label: 'Add employee',
      href: `/hr/${tenantId}/Employees/new`,
      icon: <UserPlus className="w-4 h-4" />,
    },
    {
      label: 'Attendance',
      href: `/hr/${tenantId}/Attendance`,
      icon: <Calendar className="w-4 h-4" />,
      variant: 'secondary',
    },
    {
      label: 'Payroll',
      href: `/hr/${tenantId}/Payroll-Runs`,
      icon: <Wallet className="w-4 h-4" />,
      variant: 'secondary',
    },
    {
      label: 'Leave',
      href: `/hr/${tenantId}/Leave`,
      variant: 'secondary',
    },
  ]

  const attritionData =
    safeStats.attritionTrend && safeStats.attritionTrend.length > 0
      ? safeStats.attritionTrend
      : []

  return (
    <ModuleDashboardShell
      moduleId="hr"
      title="HR & Payroll"
      moduleIcon={<moduleConfig.icon className="w-7 h-7" />}
      error={fetchError ? ((fetchError as Error)?.message || 'Failed to load HR summary') : null}
      kpis={kpis}
      insight={{
        text: insightText,
        status: safeStats.headcount > 0 ? 'ready' : 'unavailable',
        href: `/hr/${tenantId}/Analytics`,
        hrefLabel: 'More insights',
      }}
      actions={actions}
      secondaryTitle="Attrition trend"
      secondaryDescription="Primary workforce health chart — deeper AI panels live under Analytics"
      secondary={
        attritionData.length > 0 ? (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attritionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#53328A"
                  fill="#53328A"
                  fillOpacity={0.15}
                  name="Attrition %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <DashboardEmptyState
            icon={<Users />}
            title="No attrition history yet"
            description="Once payroll and headcount data accumulate, trend charts appear here."
            actionLabel="Add employee"
            actionHref={`/hr/${tenantId}/Employees/new`}
          />
        )
      }
    />
  )
}
