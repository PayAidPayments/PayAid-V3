'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Heart,
  IndianRupee,
  Users,
  Activity,
  BarChart3,
  ArrowRight,
} from 'lucide-react'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  ModuleDashboardShell,
  DashboardEmptyState,
  DashboardSkeleton,
  type DashboardKpi,
  type DashboardAction,
} from '@/components/modules/dashboard'
import { getModuleConfig } from '@/lib/modules/module-config'
import { useAuthStore } from '@/lib/stores/auth'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

interface HealthScore {
  healthScore: number
  components: {
    sales: number
    revenue: number
    customers: number
    collections: number
    operations: number
  }
  metrics: {
    totalContacts: number
    totalDeals: number
    totalRevenue: number
    pendingTasks: number
  }
}

interface FinancialAnalytics {
  pnl: { revenue: { net: number } }
  growth: { revenue: number }
}

interface SalesAnalytics {
  summary: { totalRevenue: number; revenueGrowth: number }
}

interface CustomerAnalytics {
  summary: { totalCustomers: number; activeCustomers: number }
}

const COLORS = ['#53328A', '#F5C700', '#059669', '#0284C7', '#8B5CF6']

export default function AnalyticsDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null)
  const [financialAnalytics, setFinancialAnalytics] = useState<FinancialAnalytics | null>(null)
  const [salesAnalytics, setSalesAnalytics] = useState<SalesAnalytics | null>(null)
  const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics | null>(null)
  const moduleConfig = getModuleConfig('analytics')!

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const token = useAuthStore.getState().token
        if (!token) {
          setLoading(false)
          return
        }
        const headers = { Authorization: `Bearer ${token}` }
        const [healthRes, financialRes, salesRes, customerRes] = await Promise.allSettled([
          fetch('/api/analytics/health-score', { headers }),
          fetch('/api/analytics/advanced/financial?period=month', { headers }),
          fetch('/api/analytics/advanced/sales?period=month', { headers }),
          fetch('/api/analytics/advanced/customers', { headers }),
        ])

        if (!cancelled && healthRes.status === 'fulfilled' && healthRes.value.ok) {
          setHealthScore(await healthRes.value.json())
        }
        if (!cancelled && financialRes.status === 'fulfilled' && financialRes.value.ok) {
          setFinancialAnalytics(await financialRes.value.json())
        }
        if (!cancelled && salesRes.status === 'fulfilled' && salesRes.value.ok) {
          setSalesAnalytics(await salesRes.value.json())
        }
        if (!cancelled && customerRes.status === 'fulfilled' && customerRes.value.ok) {
          setCustomerAnalytics(await customerRes.value.json())
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load analytics')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [tenantId])

  if (loading) return <DashboardSkeleton />

  const healthScoreValue = healthScore?.healthScore || 0
  const totalRevenue =
    financialAnalytics?.pnl.revenue.net || salesAnalytics?.summary.totalRevenue || 0
  const revenueGrowth =
    financialAnalytics?.growth.revenue || salesAnalytics?.summary.revenueGrowth || 0
  const totalCustomers =
    customerAnalytics?.summary.totalCustomers || healthScore?.metrics.totalContacts || 0
  const activeCustomers = customerAnalytics?.summary.activeCustomers || 0

  const kpis: DashboardKpi[] = [
    {
      label: 'Health score',
      value: healthScoreValue,
      icon: <Heart className="w-5 h-5" />,
      tone: healthScoreValue >= 70 ? 'success' : healthScoreValue >= 50 ? 'warning' : 'error',
    },
    {
      label: 'Revenue',
      value: formatINRForDisplay(totalRevenue),
      change: revenueGrowth || undefined,
      trend: revenueGrowth >= 0 ? 'up' : 'down',
      icon: <IndianRupee className="w-5 h-5" />,
      tone: 'gold',
    },
    {
      label: 'Customers',
      value: totalCustomers,
      icon: <Users className="w-5 h-5" />,
      tone: 'info',
    },
    {
      label: 'Active customers',
      value: activeCustomers,
      icon: <Activity className="w-5 h-5" />,
      tone: 'success',
    },
  ]

  const actions: DashboardAction[] = [
    {
      label: 'Reports',
      href: `/analytics/${tenantId}/Reports`,
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      label: 'Dashboards',
      href: `/analytics/${tenantId}/Dashboards`,
      variant: 'secondary',
    },
  ]

  const healthComponents = healthScore
    ? [
        { name: 'Sales', value: healthScore.components.sales, fill: COLORS[0] },
        { name: 'Revenue', value: healthScore.components.revenue, fill: COLORS[1] },
        { name: 'Customers', value: healthScore.components.customers, fill: COLORS[2] },
        { name: 'Collections', value: healthScore.components.collections, fill: COLORS[3] },
        { name: 'Operations', value: healthScore.components.operations, fill: COLORS[4] },
      ]
    : []

  return (
    <ModuleDashboardShell
      moduleId="analytics"
      title="Analytics"
      moduleIcon={<moduleConfig.icon className="w-7 h-7" />}
      error={error}
      kpis={kpis}
      insight={{
        text: healthScore
          ? `Business health is ${healthScoreValue}/100. Revenue ${formatINRForDisplay(totalRevenue)} with ${activeCustomers} active customers.`
          : 'Analytics will populate as CRM, Finance, and Sales data accumulate.',
        status: healthScore ? 'ready' : 'unavailable',
        href: `/analytics/${tenantId}/Reports`,
        hrefLabel: 'More reports',
      }}
      actions={actions}
      secondaryTitle="Health breakdown"
      secondaryDescription="Primary health composition — deeper trends live under Reports"
      secondaryActions={
        <Link
          href={`/analytics/${tenantId}/Reports`}
          className="text-sm text-[#53328A] hover:underline inline-flex items-center gap-1"
        >
          Open reports <ArrowRight className="w-4 h-4" />
        </Link>
      }
      secondary={
        healthComponents.length > 0 ? (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={healthComponents}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {healthComponents.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.fill || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <DashboardEmptyState
            icon={<BarChart3 />}
            title="No analytics yet"
            description="Health score appears once module data is available."
          />
        )
      }
    />
  )
}
