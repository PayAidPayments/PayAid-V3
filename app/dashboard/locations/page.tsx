'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Plus, 
  Building2, 
  TrendingUp, 
  Users, 
  Package,
  DollarSign,
  RefreshCw,
  Settings,
  ArrowRight,
  BarChart3
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
  stats?: {
    employees: number
    products: number
    revenue: number
    orders: number
  }
}

interface LocationStats {
  totalLocations: number
  activeLocations: number
  totalEmployees: number
  totalRevenue: number
  totalOrders: number
}

export default function LocationsPage() {
  const { tenant, token } = useAuthStore()
  const [locations, setLocations] = useState<Location[]>([])
  const [stats, setStats] = useState<LocationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)

  useEffect(() => {
    if (tenant?.id && token) {
      fetchLocations()
      fetchStats()
    }
  }, [tenant?.id, token])

  const fetchLocations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/locations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLocations(data.locations || [])
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/inventory/locations/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.code?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <DashboardLoading message="Loading locations..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Multi-Location Management</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage branches, franchises, and locations across your business
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/dashboard/locations/new">
              <Button className="bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#3F1F62] hover:to-[#E0B200] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalLocations}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {stats.activeLocations} active
                </p>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Employees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalEmployees}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Across all locations</p>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹{stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This month</p>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalOrders}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This month</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex-1 relative">
            <Input
              placeholder="Search locations by name, city, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Locations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((location) => (
            <Card 
              key={location.id} 
              className="hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700 cursor-pointer"
              onClick={() => setSelectedLocation(location.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-[#53328A] to-[#F5C700] rounded-lg">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900 dark:text-gray-100">{location.name}</CardTitle>
                      {location.code && (
                        <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                          Code: {location.code}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant={location.isActive ? "default" : "secondary"}
                    className={location.isActive ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}
                  >
                    {location.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(location.city || location.state) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{[location.city, location.state].filter(Boolean).join(', ')}</span>
                    </div>
                  )}

                  {location.stats && (
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Employees</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{location.stats.employees}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Products</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{location.stats.products}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Revenue</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">₹{location.stats.revenue.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Orders</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{location.stats.orders}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Link 
                      href={`/dashboard/locations/${location.id}`}
                      className="flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="outline" size="sm" className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        <Settings className="w-4 h-4 mr-2" />
                        Manage
                      </Button>
                    </Link>
                    <Link 
                      href={`/dashboard/locations/${location.id}/reports`}
                      className="flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="outline" size="sm" className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Reports
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredLocations.length === 0 && (
          <Card className="text-center py-12 dark:bg-gray-800 dark:border-gray-700">
            <CardContent>
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No locations found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery ? 'Try a different search term' : 'Get started by adding your first location'}
              </p>
              {!searchQuery && (
                <Link href="/dashboard/locations/new">
                  <Button className="bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#3F1F62] hover:to-[#F5C700] text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Location
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

