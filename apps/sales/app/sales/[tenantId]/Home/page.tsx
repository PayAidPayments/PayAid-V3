'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  FileText,
  ShoppingCart,
  TrendingUp,
  IndianRupee,
  Plus,
  CreditCard,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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

interface SalesDashboardStats {
  landingPages: number
  checkoutPages: number
  totalOrders: number
  ordersThisMonth: number
  orderGrowth: number
  revenueThisMonth: number
  revenueGrowth: number
  recentOrders: Array<{
    id: string
    orderNumber: string
    total: number
    status: string
    createdAt: string
  }>
  monthlyRevenue: Array<{ month: string; revenue: number }>
}

export default function SalesDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const [stats, setStats] = useState<SalesDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const moduleConfig = getModuleConfig('sales')!

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
        const response = await fetch('/api/sales/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) {
          const data = await response.json()
          if (!cancelled) setStats(data)
        } else {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || 'Failed to fetch dashboard stats')
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load sales summary')
          setStats({
            landingPages: 0,
            checkoutPages: 0,
            totalOrders: 0,
            ordersThisMonth: 0,
            orderGrowth: 0,
            revenueThisMonth: 0,
            revenueGrowth: 0,
            recentOrders: [],
            monthlyRevenue: [],
          })
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

  const kpis: DashboardKpi[] = [
    {
      label: 'Total orders',
      value: stats?.totalOrders || 0,
      change: stats?.orderGrowth,
      trend: (stats?.orderGrowth || 0) >= 0 ? 'up' : 'down',
      icon: <ShoppingCart className="w-5 h-5" />,
      tone: 'success',
      href: `/sales/${tenantId}/Orders`,
    },
    {
      label: 'Revenue',
      value: formatINRForDisplay(stats?.revenueThisMonth || 0),
      change: stats?.revenueGrowth,
      trend: (stats?.revenueGrowth || 0) >= 0 ? 'up' : 'down',
      icon: <IndianRupee className="w-5 h-5" />,
      tone: 'gold',
    },
    {
      label: 'Sales pages',
      value: stats?.landingPages || 0,
      icon: <FileText className="w-5 h-5" />,
      tone: 'info',
      href: `/sales/${tenantId}/Sales-Pages`,
    },
    {
      label: 'Checkout pages',
      value: stats?.checkoutPages || 0,
      icon: <CreditCard className="w-5 h-5" />,
      tone: 'purple',
      href: `/sales/${tenantId}/Checkout-Pages`,
    },
  ]

  const actions: DashboardAction[] = [
    {
      label: 'New sales page',
      href: `/sales/${tenantId}/Sales-Pages/new`,
      icon: <Plus className="w-4 h-4" />,
    },
    {
      label: 'Orders',
      href: `/sales/${tenantId}/Orders`,
      variant: 'secondary',
    },
    {
      label: 'Checkout pages',
      href: `/sales/${tenantId}/Checkout-Pages`,
      variant: 'secondary',
    },
  ]

  const chartData = stats?.monthlyRevenue || []
  const hasOrders = (stats?.totalOrders || 0) > 0

  return (
    <ModuleDashboardShell
      moduleId="sales"
      title="Sales"
      moduleIcon={<moduleConfig.icon className="w-7 h-7" />}
      error={error}
      kpis={kpis}
      insight={{
        text: hasOrders
          ? `${stats?.ordersThisMonth || 0} orders this month · revenue ${formatINRForDisplay(stats?.revenueThisMonth || 0)}.`
          : 'No sales activity yet. Publish a sales page or checkout to start collecting orders.',
        status: hasOrders ? 'ready' : 'unavailable',
        href: `/sales/${tenantId}/Orders`,
        hrefLabel: 'View orders',
      }}
      actions={actions}
      secondaryTitle="Monthly revenue"
      secondaryDescription="Primary sales trend — order tables live under Orders"
      secondary={
        chartData.length > 0 ? (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatINRForDisplay(value)} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#059669"
                  fill="#059669"
                  fillOpacity={0.15}
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <DashboardEmptyState
            icon={<TrendingUp />}
            title="No revenue history yet"
            description="Orders will populate this chart once checkout is live."
            actionLabel="Create sales page"
            actionHref={`/sales/${tenantId}/Sales-Pages/new`}
          />
        )
      }
    />
  )
}
