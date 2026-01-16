'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  RefreshCw,
  Settings,
  TrendingUp,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { DashboardLoading } from '@/components/ui/loading'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface ONDCOrder {
  id: string
  ondcOrderId: string
  status: string
  createdAt: string
  orderData: any
}

export default function ONDCPage() {
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<ONDCOrder[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/ondc/orders/sync', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
        setIsConnected(data.orders && data.orders.length > 0)
      }
    } catch (error) {
      console.error('Failed to fetch ONDC data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setLoading(true)
    try {
      // TODO: Trigger manual sync with ONDC API
      alert('Sync functionality will be implemented with ONDC API integration')
      await fetchData()
    } catch (error) {
      console.error('Sync error:', error)
      alert('Failed to sync orders')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <DashboardLoading message="Loading ONDC integration..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">ONDC Integration</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage orders from Open Network for Digital Commerce
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={handleSync}
              disabled={loading}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Sync Orders
            </Button>
            <Button
              variant="outline"
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Connection Status */}
        <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isConnected ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <Clock className="w-6 h-6 text-yellow-500" />
                )}
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {isConnected ? 'Connected to ONDC' : 'Not Connected'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {isConnected ? 'Orders are being synced automatically' : 'Configure ONDC credentials to start syncing'}
                  </div>
                </div>
              </div>
              <Badge
                variant={isConnected ? 'default' : 'secondary'}
                className={isConnected ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
              >
                {isConnected ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{orders.length}</div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {orders.filter(o => o.status === 'PENDING').length}
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Fulfilled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {orders.filter(o => o.status === 'SHIPPED' || o.status === 'DELIVERED').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <Card className="text-center py-12 dark:bg-gray-800 dark:border-gray-700">
            <CardContent>
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No ONDC Orders</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Orders from ONDC will appear here once integration is configured
              </p>
              <Button
                variant="outline"
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure Integration
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Order #{order.ondcOrderId}
                        </h3>
                        <Badge
                          variant={
                            order.status === 'DELIVERED'
                              ? 'default'
                              : order.status === 'SHIPPED'
                              ? 'default'
                              : 'secondary'
                          }
                          className={
                            order.status === 'DELIVERED'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : order.status === 'SHIPPED'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : ''
                          }
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Created: {new Date(order.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
