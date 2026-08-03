'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Package,
  AlertTriangle,
  IndianRupee,
  Warehouse,
  Plus,
  RefreshCw,
} from 'lucide-react'
import {
  Bar,
  BarChart,
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

interface InventoryDashboardStats {
  totalProducts: number
  lowStockItems: number
  outOfStockItems: number
  totalStockValue: number
  totalWarehouses: number
  stockMovements: Array<{ month: string; in: number; out: number }>
}

export default function InventoryDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const [stats, setStats] = useState<InventoryDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const moduleConfig = getModuleConfig('inventory')!

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = useAuthStore.getState().token
      if (!token) {
        setLoading(false)
        return
      }
      const response = await fetch('/api/inventory/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        setStats(await response.json())
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to fetch dashboard stats')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory')
      setStats({
        totalProducts: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        totalStockValue: 0,
        totalWarehouses: 0,
        stockMovements: [],
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardStats()
  }, [tenantId])

  if (loading) return <DashboardSkeleton />

  const lowStock = stats?.lowStockItems || 0
  const kpis: DashboardKpi[] = [
    {
      label: 'Products',
      value: stats?.totalProducts || 0,
      icon: <Package className="w-5 h-5" />,
      tone: 'purple',
      href: `/inventory/${tenantId}/Products`,
    },
    {
      label: 'Low stock',
      value: lowStock,
      icon: <AlertTriangle className="w-5 h-5" />,
      tone: lowStock > 0 ? 'warning' : 'success',
      href: `/inventory/${tenantId}/Products`,
    },
    {
      label: 'Stock value',
      value: formatINRForDisplay(stats?.totalStockValue || 0),
      icon: <IndianRupee className="w-5 h-5" />,
      tone: 'gold',
    },
    {
      label: 'Warehouses',
      value: stats?.totalWarehouses || 0,
      icon: <Warehouse className="w-5 h-5" />,
      tone: 'info',
      href: `/inventory/${tenantId}/Warehouses`,
    },
  ]

  const actions: DashboardAction[] = [
    {
      label: 'Add product',
      href: `/inventory/${tenantId}/Products/new`,
      icon: <Plus className="w-4 h-4" />,
    },
    {
      label: 'Stock movements',
      href: `/inventory/${tenantId}/StockMovements`,
      variant: 'secondary',
    },
    {
      label: 'Refresh',
      onClick: () => fetchDashboardStats(),
      icon: <RefreshCw className="w-4 h-4" />,
      variant: 'secondary',
    },
  ]

  const movements =
    stats?.stockMovements?.map((item) => ({
      month: item.month,
      'Stock In': item.in,
      'Stock Out': item.out,
    })) || []

  const hasProducts = (stats?.totalProducts || 0) > 0

  return (
    <ModuleDashboardShell
      moduleId="inventory"
      title="Inventory"
      moduleIcon={<moduleConfig.icon className="w-7 h-7" />}
      error={error}
      kpis={kpis}
      insight={{
        text: hasProducts
          ? lowStock > 0
            ? `${lowStock} SKU${lowStock === 1 ? '' : 's'} below reorder level. Stock value ${formatINRForDisplay(stats?.totalStockValue || 0)}.`
            : `Inventory healthy across ${stats?.totalProducts || 0} products · value ${formatINRForDisplay(stats?.totalStockValue || 0)}.`
          : 'No products yet. Add SKUs to unlock stock value and movement trends.',
        status: hasProducts ? 'ready' : 'unavailable',
      }}
      actions={actions}
      secondaryTitle="Stock movements"
      secondaryDescription="Primary inbound/outbound trend — product lists live under Products"
      secondary={
        movements.length > 0 ? (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={movements}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="Stock In" fill="#53328A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Stock Out" fill="#F5C700" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <DashboardEmptyState
            icon={<Package />}
            title="No stock movement yet"
            description="Movements appear after receipts and issues are recorded."
            actionLabel="Add product"
            actionHref={`/inventory/${tenantId}/Products/new`}
          />
        )
      }
    />
  )
}
