'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  IndianRupee, 
  Calendar, 
  Clock, 
  Briefcase, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
  FileText,
  AlertCircle,
  Target,
  Award,
  Wallet,
  CheckCircle,
  BarChart3,
  Mail,
  Zap,
  Receipt,
  Settings
} from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { PageLoading } from '@/components/ui/loading'
import { useHRSummary } from '@/lib/hooks/hr/useHRSummary'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts'

// Lazy load AI components
const HRAICommandCenter = dynamic(
  () => import('@/components/hr/HRAICommandCenter').then(mod => ({ default: mod.HRAICommandCenter })),
  { ssr: false, loading: () => null }
)
const HRAIInsightsAndAlerts = dynamic(
  () => import('@/components/hr/HRAIInsightsAndAlerts').then(mod => ({ default: mod.HRAIInsightsAndAlerts })),
  { ssr: false, loading: () => null }
)
const HRPredictiveAnalytics = dynamic(
  () => import('@/components/hr/HRPredictiveAnalytics').then(mod => ({ default: mod.HRPredictiveAnalytics })),
  { ssr: false, loading: () => null }
)
const HRHealthMonitoring = dynamic(
  () => import('@/components/hr/HRHealthMonitoring').then(mod => ({ default: mod.HRHealthMonitoring })),
  { ssr: false, loading: () => null }
)
const HRAIQuestionInput = dynamic(
  () => import('@/components/hr/HRAIQuestionInput').then(mod => ({ default: mod.HRAIQuestionInput })),
  { ssr: false, loading: () => null }
)

const PURPLE_PRIMARY = '#53328A'
const GOLD_ACCENT = '#F5C700'
const SUCCESS = '#059669'
const INFO = '#0284C7'
const CHART_COLORS = [PURPLE_PRIMARY, GOLD_ACCENT, SUCCESS, INFO, '#8B5CF6', '#FCD34D']

export default function HRDashboardPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) ?? ''
  const { user, tenant } = useAuthStore()
  const { data: stats, isLoading, error: fetchError } = useHRSummary({ tenantId })
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  if (!tenantId) {
    return <PageLoading message="Loading..." fullScreen={true} />
  }
  if (isLoading) {
    return <PageLoading message="Loading HR dashboard..." fullScreen={true} />
  }

  const safeStats = stats ?? {
    headcount: 47,
    contractors: 12,
    turnover: 8.2,
    absentToday: 3,
    nextPayroll: '2026-02-28',
    nextPayrollAmount: 420000,
    complianceScore: 98,
    pendingReimbursements: 15,
    pendingReimbursementsAmount: 45000,
    arrears: 12000,
    avgEngagement: 82,
    okrCompletion: 76,
    trainingDue: 8,
    flightRisks: [],
    hiringVelocity: 14,
    overtimeRisk: { team: 'Engineering', risk: 18 },
    healthScore: 78,
    healthScoreChange: 2,
    aiInsights: [],
    attritionTrend: [],
    hiringVelocityTrend: [],
    payrollCostTrend: [],
  }

  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!

  const heroMetrics = [
    { 
      label: 'Active Employees', 
      value: safeStats.headcount, 
      change: safeStats.headcount > 0 ? 2 : undefined,
      trend: 'up' as const, 
      icon: <Users className="w-5 h-5" />, 
      color: 'purple' as const, 
      href: `/hr/${tenantId}/Employees` 
    },
    { 
      label: 'Contractors', 
      value: safeStats.contractors, 
      icon: <Briefcase className="w-5 h-5" />, 
      color: 'info' as const, 
      href: `/hr/${tenantId}/Contractors` 
    },
    { 
      label: 'Next Payroll', 
      value: formatINRForDisplay(safeStats.nextPayrollAmount), 
      icon: <IndianRupee className="w-5 h-5" />, 
      color: 'gold' as const, 
      href: `/hr/${tenantId}/Payroll-Runs` 
    },
    { 
      label: 'Compliance Score', 
      value: `${safeStats.complianceScore}%`, 
      icon: <CheckCircle className="w-5 h-5" />, 
      color: 'success' as const, 
      href: `/hr/${tenantId}/Statutory-Compliance` 
    },
  ]

  // Prepare chart data
  const attritionData = safeStats.attritionTrend && safeStats.attritionTrend.length > 0
    ? safeStats.attritionTrend
    : [
        { month: 'Oct', rate: 10.2 },
        { month: 'Nov', rate: 9.5 },
        { month: 'Dec', rate: 8.8 },
        { month: 'Jan', rate: 8.2 },
      ]

  const hiringVelocityData = safeStats.hiringVelocityTrend && safeStats.hiringVelocityTrend.length > 0
    ? safeStats.hiringVelocityTrend
    : [
        { month: 'Oct', days: 18 },
        { month: 'Nov', days: 16 },
        { month: 'Dec', days: 15 },
        { month: 'Jan', days: 14 },
      ]

  const payrollCostData = safeStats.payrollCostTrend && safeStats.payrollCostTrend.length > 0
    ? safeStats.payrollCostTrend
    : [
        { month: 'Oct', cost: 3800000 },
        { month: 'Nov', cost: 3900000 },
        { month: 'Dec', cost: 4000000 },
        { month: 'Jan', cost: 4200000 },
      ]

  // Headcount distribution by department (mock data for pie chart)
  const headcountByDept = [
    { name: 'Engineering', value: 18, fill: PURPLE_PRIMARY },
    { name: 'Sales', value: 12, fill: GOLD_ACCENT },
    { name: 'Marketing', value: 8, fill: SUCCESS },
    { name: 'Operations', value: 9, fill: INFO },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="HR & Payroll"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      {fetchError && (
        <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300 font-medium">Error:</p>
          <p className="text-red-600 dark:text-red-400 text-sm truncate">{(fetchError as Error)?.message}</p>
        </div>
      )}

      <div className="p-6 overflow-y-auto" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* PIXEL-PERFECT 12-COLUMN CSS GRID LAYOUT - MATCHING CRM */}
        <div className="dashboard-container">
          <div className="dashboard-grid">
          
          {/* Band 1: AI HR Command Center - Full Width (Row 1) */}
          {stats && safeStats && (
            <motion.div 
              className="ai-command-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <HRAICommandCenter stats={safeStats} />
            </motion.div>
          )}

          {/* Quick Actions Band - Full Width (Row 2) */}
          <motion.div 
            className="col-span-full mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <Zap className="h-4 w-4" />
                  Quick Actions:
                </div>
                <Link href={`/hr/${tenantId}/Employees/new`}>
                  <Button variant="outline" size="sm" className="gap-2 hover:bg-purple-100 dark:hover:bg-purple-900/30">
                    <UserPlus className="h-4 w-4" />
                    Add New Employee
                  </Button>
                </Link>
                <Link href={`/hr/${tenantId}/Onboarding/new`}>
                  <Button variant="outline" size="sm" className="gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                    <FileText className="h-4 w-4" />
                    Start Onboarding
                  </Button>
                </Link>
                <Link href={`/hr/${tenantId}/Leave/Apply`}>
                  <Button variant="outline" size="sm" className="gap-2 hover:bg-green-100 dark:hover:bg-green-900/30">
                    <Calendar className="h-4 w-4" />
                    Apply for Leave
                  </Button>
                </Link>
                <Link href={`/hr/${tenantId}/Reimbursements/new`}>
                  <Button variant="outline" size="sm" className="gap-2 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                    <Receipt className="h-4 w-4" />
                    Submit Reimbursement
                  </Button>
                </Link>
                <Link href={`/hr/${tenantId}/Attendance/Mark`}>
                  <Button variant="outline" size="sm" className="gap-2 hover:bg-green-100 dark:hover:bg-green-900/30">
                    <Clock className="h-4 w-4" />
                    Mark Attendance
                  </Button>
                </Link>
                <Link href={`/hr/${tenantId}/Settings`}>
                  <Button variant="outline" size="sm" className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Settings className="h-4 w-4" />
                    Payroll Settings
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>

          {/* Band 2: Row 1 - Stat Cards (6 identical cards, each spans 2 columns) */}
          {/* Stat Card 1: Active Employees */}
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Link href={`/hr/${tenantId}/Employees`}>
              <Card className="stat-card-uniform" style={{ height: '100%', padding: 0, borderRadius: 0, border: 0, boxShadow: 'none', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
                <div className="flex flex-row items-center justify-between mb-1" style={{ minHeight: '32px' }}>
                  <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider" style={{ lineHeight: '1.2', margin: 0 }}>Active Employees</CardTitle>
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold stat-card-gradient-text dark:text-purple-300 mb-0.5" style={{ lineHeight: '1.2' }}>
                  {safeStats.headcount || 0} <span className="text-lg text-emerald-600 dark:text-emerald-400">(+2)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-0.5" style={{ lineHeight: '1.2' }}>
                  Active
                </p>
                {safeStats.headcount > 0 && (
                  <div className="flex items-center gap-1" style={{ marginTop: 'auto' }}>
                    <span className="status-badge on-track">On track</span>
                  </div>
                )}
              </Card>
            </Link>
          </motion.div>

          {/* Stat Card 2: Payroll Due */}
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Link href={`/hr/${tenantId}/Payroll-Runs`}>
              <Card className="stat-card-uniform" style={{ height: '100%', padding: 0, borderRadius: 0, border: 0, boxShadow: 'none', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
                <div className="flex flex-row items-center justify-between mb-1" style={{ minHeight: '32px' }}>
                  <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider" style={{ lineHeight: '1.2', margin: 0 }}>Payroll Due</CardTitle>
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IndianRupee className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <div className="text-xl font-bold stat-card-gradient-text dark:text-purple-300 mb-0.5" style={{ lineHeight: '1.2' }}>
                  {formatINRForDisplay(safeStats.nextPayrollAmount || 0)} <span className="text-sm text-slate-600 dark:text-slate-400">({new Date(safeStats.nextPayroll).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-0.5" style={{ lineHeight: '1.2' }}>
                  Scheduled
                </p>
                {safeStats.nextPayrollAmount > 0 && (
                  <div className="flex items-center gap-1" style={{ marginTop: 'auto' }}>
                    <span className="status-badge ahead">Scheduled</span>
                  </div>
                )}
              </Card>
            </Link>
          </motion.div>

          {/* Stat Card 3: Compliance Score */}
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Link href={`/hr/${tenantId}/Statutory-Compliance`}>
              <Card className="stat-card-uniform" style={{ height: '100%', padding: 0, borderRadius: 0, border: 0, boxShadow: 'none', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
                <div className="flex flex-row items-center justify-between mb-1" style={{ minHeight: '32px' }}>
                  <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider" style={{ lineHeight: '1.2', margin: 0 }}>Compliance</CardTitle>
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold stat-card-gradient-text dark:text-purple-300 mb-0.5" style={{ lineHeight: '1.2' }}>
                  {safeStats.complianceScore || 0}% <span className="text-sm text-slate-600 dark:text-slate-400">(Auto-filed TDS {formatINRForDisplay(180000)})</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-0.5" style={{ lineHeight: '1.2' }}>
                  On track
                </p>
                {safeStats.complianceScore >= 95 && (
                  <div className="flex items-center gap-1" style={{ marginTop: 'auto' }}>
                    <span className="status-badge on-track">On track</span>
                  </div>
                )}
              </Card>
            </Link>
          </motion.div>

          {/* Stat Card 4: Turnover Rate */}
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Link href={`/hr/${tenantId}/Reports`}>
              <Card className="stat-card-uniform" style={{ height: '100%', padding: 0, borderRadius: 0, border: 0, boxShadow: 'none', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
                <div className="flex flex-row items-center justify-between mb-1" style={{ minHeight: '32px' }}>
                  <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider" style={{ lineHeight: '1.2', margin: 0 }}>Turnover Rate</CardTitle>
                  <div className="w-8 h-8 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-0.5" style={{ lineHeight: '1.2' }}>
                  {safeStats.turnover || 0}%
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-0.5" style={{ lineHeight: '1.2' }}>
                  vs 12% industry avg
                </p>
                {safeStats.turnover < 12 && (
                  <div className="flex items-center gap-1" style={{ marginTop: 'auto' }}>
                    <span className="status-badge on-track">Below avg</span>
                  </div>
                )}
              </Card>
            </Link>
          </motion.div>

          {/* Stat Card 5: Engagement Score */}
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Link href={`/hr/${tenantId}/Performance`}>
              <Card className="stat-card-uniform" style={{ height: '100%', padding: 0, borderRadius: 0, border: 0, boxShadow: 'none', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
                <div className="flex flex-row items-center justify-between mb-1" style={{ minHeight: '32px' }}>
                  <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider" style={{ lineHeight: '1.2', margin: 0 }}>Engagement</CardTitle>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold stat-card-gradient-text dark:text-purple-300 mb-0.5" style={{ lineHeight: '1.2' }}>
                  {safeStats.avgEngagement || 0}/100
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-0.5" style={{ lineHeight: '1.2' }}>
                  Team average
                </p>
                {safeStats.avgEngagement >= 80 && (
                  <div className="flex items-center gap-1" style={{ marginTop: 'auto' }}>
                    <span className="status-badge ahead">Good</span>
                  </div>
                )}
              </Card>
            </Link>
          </motion.div>

          {/* Stat Card 6: Training Due */}
          <motion.div 
            className="stat-card"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Link href={`/hr/${tenantId}/Performance`}>
              <Card className="stat-card-uniform" style={{ height: '100%', padding: 0, borderRadius: 0, border: 0, boxShadow: 'none', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
                <div className="flex flex-row items-center justify-between mb-1" style={{ minHeight: '32px' }}>
                  <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider" style={{ lineHeight: '1.2', margin: 0 }}>Training Due</CardTitle>
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold stat-card-gradient-text dark:text-purple-300 mb-0.5" style={{ lineHeight: '1.2' }}>
                  {safeStats.trainingDue || 0}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-0.5" style={{ lineHeight: '1.2' }}>
                  Employees Due
                </p>
                {safeStats.trainingDue > 0 && (
                  <div className="flex items-center gap-1" style={{ marginTop: 'auto' }}>
                    <span className="status-badge on-track">Action</span>
                  </div>
                )}
              </Card>
            </Link>
          </motion.div>

          {/* Band 3: Row 2 - Charts (3 charts, each spans 4 columns) */}
          {safeStats && (
            <>
            {/* Chart 1: Headcount by Department */}
            <motion.div 
              className="chart-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              whileHover={{ y: -2 }}
            >
              <Card className="border-0 rounded-xl" style={{ height: '100%', padding: 0, borderRadius: 0, background: 'transparent' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-purple-900">Headcount by Department</CardTitle>
                  <CardDescription className="text-sm">Distribution of employees across departments</CardDescription>
                </CardHeader>
                <CardContent style={{ height: 'calc(100% - 80px)', overflow: 'hidden', position: 'relative', padding: '16px 16px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {headcountByDept.length > 0 ? (
                  <div style={{ width: '100%', height: '260px', minWidth: 0, minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={260}>
                    <PieChart>
                      <Pie
                        data={headcountByDept}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {headcountByDept.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [value, 'Employees']}
                        contentStyle={{
                          backgroundColor: isDark ? 'rgb(31, 41, 55)' : '#fff',
                          color: isDark ? 'rgb(229, 231, 235)' : 'rgb(17, 24, 39)',
                          border: `1px solid ${PURPLE_PRIMARY}`,
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                ) : (
                  <div className="flex items-center justify-center text-gray-500 dark:text-gray-400" style={{ height: '100%' }}>
                    <p>No department data available</p>
                  </div>
                )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Chart 2: Attrition Trend */}
            <motion.div 
              className="chart-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.45 }}
              whileHover={{ y: -2 }}
            >
              <Card className="border-0 rounded-xl" style={{ height: '100%', padding: 0, borderRadius: 0, background: 'transparent' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Attrition Trend</CardTitle>
                  <CardDescription className="text-sm">Monthly turnover rate over time</CardDescription>
                </CardHeader>
                <CardContent style={{ height: 'calc(100% - 80px)', overflow: 'hidden', position: 'relative', padding: '16px 16px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {attritionData.length > 0 ? (
                  <div style={{ width: '100%', height: '260px', minWidth: 0, minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={260}>
                    <AreaChart data={attritionData}>
                      <defs>
                        <linearGradient id="colorAttrition" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={PURPLE_PRIMARY} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={PURPLE_PRIMARY} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
                      <XAxis 
                        dataKey="month" 
                        stroke={isDark ? '#D1D5DB' : '#666'}
                        tick={{ fontSize: 12, fill: isDark ? '#D1D5DB' : '#666' }}
                      />
                      <YAxis 
                        stroke={isDark ? '#D1D5DB' : '#666'}
                        tick={{ fontSize: 12, fill: isDark ? '#D1D5DB' : '#666' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isDark ? 'rgb(31, 41, 55)' : '#fff',
                          color: isDark ? 'rgb(229, 231, 235)' : 'rgb(17, 24, 39)',
                          border: `1px solid ${PURPLE_PRIMARY}`,
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${value}%`, 'Turnover Rate']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="rate" 
                        stroke={PURPLE_PRIMARY} 
                        fillOpacity={1} 
                        fill="url(#colorAttrition)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                ) : (
                  <div className="flex items-center justify-center text-gray-500 dark:text-gray-400" style={{ height: '100%' }}>
                    <p>No attrition data available</p>
                  </div>
                )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Chart 3: Hiring Velocity */}
            <motion.div 
              className="chart-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              whileHover={{ y: -2 }}
            >
              <Card className="border-0 rounded-xl" style={{ height: '100%', padding: 0, borderRadius: 0, background: 'transparent' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-purple-900">Hiring Velocity</CardTitle>
                  <CardDescription className="text-sm">Average days to hire</CardDescription>
                </CardHeader>
                <CardContent style={{ height: 'calc(100% - 80px)', overflow: 'hidden', position: 'relative', padding: '16px' }}>
                {hiringVelocityData.length > 0 ? (
                  <div style={{ width: '100%', height: '260px', minWidth: 0, minHeight: 260 }}>
                    <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={260}>
                    <BarChart 
                      data={hiringVelocityData}
                      margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
                      <XAxis 
                        dataKey="month"
                        stroke={isDark ? '#D1D5DB' : '#666'}
                        tick={{ fontSize: 12, fill: isDark ? '#D1D5DB' : '#666' }}
                      />
                      <YAxis 
                        stroke={isDark ? '#D1D5DB' : '#666'}
                        tick={{ fontSize: 12, fill: isDark ? '#D1D5DB' : '#666' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isDark ? 'rgb(31, 41, 55)' : '#fff',
                          color: isDark ? 'rgb(229, 231, 235)' : 'rgb(17, 24, 39)',
                          border: `1px solid ${PURPLE_PRIMARY}`,
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [`${value} days`, 'Hiring Time']}
                      />
                      <Bar dataKey="days" fill={GOLD_ACCENT} radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                ) : (
                  <div className="flex items-center justify-center text-gray-500 dark:text-gray-400" style={{ height: '100%' }}>
                    <p>No hiring velocity data available</p>
                  </div>
                )}
                </CardContent>
              </Card>
            </motion.div>
            </>
          )}

          {/* Band 4: Row 3 - AI Panels (3 panels, each spans 4 columns) */}
          {stats && safeStats && (
            <>
            {/* AI Panel 1: AI Insights & Alerts */}
            <motion.div 
              className="ai-panel"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.55 }}
              whileHover={{ scale: 1.01, y: -2 }}
            >
              <HRAIInsightsAndAlerts tenantId={tenantId} stats={safeStats} />
            </motion.div>
            
            {/* AI Panel 2: Predictive Analytics */}
            <motion.div 
              className="ai-panel"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              whileHover={{ scale: 1.01, y: -2 }}
            >
              <HRPredictiveAnalytics tenantId={tenantId} stats={safeStats} />
            </motion.div>
            
            {/* AI Panel 3: Health Monitoring */}
            <motion.div 
              className="ai-panel"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.65 }}
              whileHover={{ scale: 1.01, y: -2 }}
            >
              <HRHealthMonitoring tenantId={tenantId} stats={safeStats} />
            </motion.div>
            </>
          )}

          {/* Band 5: Row 4 - Widgets (3 cards, each spans 4 columns) */}
          {stats && safeStats && (
            <>
            {/* Widget 1: Ask AI About Your HR */}
            <motion.div 
              className="widget-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.7 }}
              whileHover={{ y: -2 }}
            >
              <HRAIQuestionInput tenantId={tenantId} />
            </motion.div>
            
            {/* Widget 2: Employee Issues */}
            <motion.div 
              className="widget-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.75 }}
              whileHover={{ y: -2 }}
            >
              <Card className="border-0 rounded-xl" style={{ height: '100%', padding: 0, borderRadius: 0, background: 'transparent' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    Employee Issues
                  </CardTitle>
                  <CardDescription className="text-sm">Open requests and compliance status</CardDescription>
                </CardHeader>
                <CardContent style={{ height: 'calc(100% - 100px)', overflow: 'visible', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">Pending Reimbursements</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{safeStats.pendingReimbursements || 0} requests</p>
                      </div>
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                        {safeStats.pendingReimbursements || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">Compliance Status</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">All on track</p>
                      </div>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <Link href={`/hr/${tenantId}/Reimbursements`} className="mt-auto">
                    <Button variant="outline" className="w-full mt-2 text-xs py-1">
                      View All Requests
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Widget 3: Training Programs */}
            <motion.div 
              className="widget-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.8 }}
              whileHover={{ y: -2 }}
            >
              <Card className="border-0 rounded-xl" style={{ height: '100%', padding: 0, borderRadius: 0, background: 'transparent' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Award className="h-5 w-5 text-purple-600" />
                    Training Programs
                  </CardTitle>
                  <CardDescription className="text-sm">Active training initiatives</CardDescription>
                </CardHeader>
                <CardContent style={{ height: 'calc(100% - 100px)', overflow: 'visible', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div className="space-y-2 flex-1">
                    <div className="p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">Leadership Development</p>
                        <Badge variant="outline" className="text-xs">Active</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mt-1">
                        <span>Enrolled: 12</span>
                        <span>Completion: 75%</span>
                      </div>
                    </div>
                    <div className="p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">Technical Skills</p>
                        <Badge variant="outline" className="text-xs bg-gray-100">Completed</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mt-1">
                        <span>Enrolled: 25</span>
                        <span>Completion: 100%</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/hr/${tenantId}/Performance`} className="mt-auto">
                    <Button variant="outline" className="w-full mt-2 text-xs py-1">
                      View All Programs
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
            </>
          )}

          </div>
        </div>
      </div>
    </div>
  )
}
