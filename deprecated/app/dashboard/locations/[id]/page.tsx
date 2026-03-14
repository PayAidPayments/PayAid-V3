'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Building2, 
  Users, 
  Package,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  ArrowLeft,
  Settings,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { DashboardLoading } from '@/components/ui/loading'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface Location {
  id: string
  name: string
  code: string | null
  city: string | null
  state: string | null
  country: string
  isActive: boolean
}

interface LocationStats {
  employees: number
  products: number
  revenue: number
  orders: number
  profit: number
  expenses: number
}

export default function LocationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { token, tenant } = useAuthStore()
  const locationId = params?.id as string
  const [location, setLocation] = useState<Location | null>(null)
  const [stats, setStats] = useState<LocationStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (locationId && token) {
      fetchLocation()
      fetchLocationStats()
    }
  }, [locationId, token])

  const fetchLocation = async () => {
    try {
      const response = await fetch(`/api/locations/${locationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLocation(data.location)
      }
    } catch (error) {
      console.error('Failed to fetch location:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLocationStats = async () => {
    try {
      const response = await fetch(`/api/locations/${locationId}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch location stats:', error)
    }
  }

  if (loading) {
    return <DashboardLoading message="Loading location details..." />
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Location not found</h3>
            <Link href="/dashboard/locations">
              <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Locations
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/locations">
            <Button variant="ghost" size="sm" className="mb-4 dark:text-gray-300 dark:hover:bg-gray-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Locations
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{location.name}</h1>
                <Badge 
                  variant={location.isActive ? "default" : "secondary"}
                  className={location.isActive ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}
                >
                  {location.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {(location.city || location.state) && (
                <p className="mt-2 text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {[location.city, location.state, location.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href={`/dashboard/locations/${locationId}/reports`}>
                <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
              </Link>
              <Link href={`/dashboard/locations/${locationId}/edit`}>
                <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  <Settings className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Employees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.employees}</div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.products}</div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹{stats.revenue.toLocaleString()}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This month</p>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.orders}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This month</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* P&L Summary */}
        {stats && (
          <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Profit & Loss Summary</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">This month&apos;s financial overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Revenue</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">₹{stats.revenue.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expenses</div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">₹{stats.expenses.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Profit</div>
                  <div className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    ₹{stats.profit.toLocaleString()}
                  </div>
                  <div className={`text-xs mt-1 ${stats.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {stats.revenue > 0 ? `${((stats.profit / stats.revenue) * 100).toFixed(1)}% margin` : 'N/A'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href={`/inventory/${tenant?.id || 'tenant'}/Products?location=${locationId}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Inventory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage products and stock levels</p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/dashboard/locations/${locationId}/transfers`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Stock Transfers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">Transfer stock to/from other locations</p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/dashboard/locations/${locationId}/employees`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Employees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage employees at this location</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

