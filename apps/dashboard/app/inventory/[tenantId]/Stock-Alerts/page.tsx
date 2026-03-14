'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  RefreshCw, 
  Package,
  MapPin,
  Bell,
  CheckCircle2
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'

interface StockAlert {
  productId: string
  productName: string
  sku: string
  currentQuantity: number
  reorderLevel: number
  locationId?: string
  locationName?: string
  severity: 'low' | 'critical' | 'out_of_stock'
}

export default function StockAlertsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { token } = useAuthStore()
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'low' | 'critical' | 'out_of_stock'>('all')

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/inventory/stock-alerts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error('Failed to fetch stock alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAlerts()
    setRefreshing(false)
  }

  const handleSendNotifications = async () => {
    try {
      const response = await fetch('/api/inventory/stock-alerts?notify=true', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Notifications sent for ${data.count} alerts`)
        await fetchAlerts()
      }
    } catch (error) {
      console.error('Failed to send notifications:', error)
      alert('Failed to send notifications')
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true
    return alert.severity === filter
  })

  const severityCounts = {
    all: alerts.length,
    low: alerts.filter(a => a.severity === 'low').length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    out_of_stock: alerts.filter(a => a.severity === 'out_of_stock').length,
  }

  if (loading) {
    return <PageLoading message="Loading stock alerts..." fullScreen={false} />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Stock Alerts</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor low stock, critical stock, and out-of-stock items
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {alerts.length > 0 && (
            <Button
              onClick={handleSendNotifications}
              className="bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#3F1F62] hover:to-[#E0B200] text-white"
            >
              <Bell className="w-4 h-4 mr-2" />
              Send Notifications
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{severityCounts.all}</div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{severityCounts.low}</div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{severityCounts.critical}</div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{severityCounts.out_of_stock}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'low', 'critical', 'out_of_stock'] as const).map((filterType) => (
          <Button
            key={filterType}
            variant={filter === filterType ? 'default' : 'outline'}
            onClick={() => setFilter(filterType)}
            className={
              filter === filterType
                ? 'bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#3F1F62] hover:to-[#E0B200] text-white'
                : 'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
            }
          >
            {filterType === 'all'
              ? 'All'
              : filterType === 'low'
              ? 'Low Stock'
              : filterType === 'critical'
              ? 'Critical'
              : 'Out of Stock'}{' '}
            ({severityCounts[filterType]})
          </Button>
        ))}
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <Card className="text-center py-12 dark:bg-gray-800 dark:border-gray-700">
          <CardContent>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Stock Alerts</h3>
            <p className="text-gray-600 dark:text-gray-400">
              All products are above their reorder levels
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <Card
              key={`${alert.productId}-${alert.locationId || 'default'}`}
              className={`dark:bg-gray-800 dark:border-gray-700 ${
                alert.severity === 'out_of_stock'
                  ? 'border-red-500'
                  : alert.severity === 'critical'
                  ? 'border-orange-500'
                  : 'border-yellow-500'
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`p-3 rounded-lg ${
                        alert.severity === 'out_of_stock'
                          ? 'bg-red-100 dark:bg-red-900'
                          : alert.severity === 'critical'
                          ? 'bg-orange-100 dark:bg-orange-900'
                          : 'bg-yellow-100 dark:bg-yellow-900'
                      }`}
                    >
                      <AlertTriangle
                        className={`w-6 h-6 ${
                          alert.severity === 'out_of_stock'
                            ? 'text-red-600 dark:text-red-400'
                            : alert.severity === 'critical'
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-yellow-600 dark:text-yellow-400'
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {alert.productName}
                        </h3>
                        <Badge
                          variant={
                            alert.severity === 'out_of_stock'
                              ? 'destructive'
                              : alert.severity === 'critical'
                              ? 'default'
                              : 'secondary'
                          }
                          className={
                            alert.severity === 'out_of_stock'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : alert.severity === 'critical'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }
                        >
                          {alert.severity === 'out_of_stock'
                            ? 'Out of Stock'
                            : alert.severity === 'critical'
                            ? 'Critical'
                            : 'Low Stock'}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          <span>SKU: {alert.sku}</span>
                        </div>
                        {alert.locationName && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>Location: {alert.locationName}</span>
                          </div>
                        )}
                        <div>
                          Current Stock: <strong className="text-gray-900 dark:text-gray-100">{alert.currentQuantity}</strong> | Reorder Level: <strong className="text-gray-900 dark:text-gray-100">{alert.reorderLevel}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
