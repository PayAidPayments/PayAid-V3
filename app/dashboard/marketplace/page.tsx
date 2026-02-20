'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { useDashboardUrl, getDashboardUrl } from '@/lib/utils/dashboard-url'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Star, 
  Package, 
  ExternalLink,
  CheckCircle2,
  TrendingUp,
  Filter
} from 'lucide-react'
import Link from 'next/link'

interface MarketplaceApp {
  id: string
  name: string
  description: string
  category: string
  icon: string
  rating: number
  reviews: number
  installed?: boolean
}

export default function MarketplacePage() {
  const router = useRouter()
  const pathname = usePathname()
  const { tenant, isAuthenticated, token } = useAuthStore()
  const marketplaceUrl = useDashboardUrl('/marketplace')
  const developerSubmitUrl = useDashboardUrl('/developer/portal/submit')
  const [apps, setApps] = useState<MarketplaceApp[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Decoupled structure: redirect old monolithic URL to tenant-scoped URL
  useEffect(() => {
    if (typeof window === 'undefined' || !tenant?.id) return
    if (pathname === '/dashboard/marketplace') {
      router.replace(`/dashboard/${tenant.id}/marketplace`)
      return
    }
  }, [pathname, tenant?.id, router])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(marketplaceUrl)}`)
      return
    }

    if (token) {
      fetchApps()
    }
  }, [isAuthenticated, token, router, marketplaceUrl])

  const fetchApps = async () => {
    try {
      const response = await fetch('/api/marketplace/apps', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setApps(data.apps || [])
      }
    } catch (error) {
      console.error('Failed to fetch marketplace apps:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = Array.from(new Set(apps.map(app => app.category)))

  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || app.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading marketplace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Marketplace
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Discover and install apps to extend PayAid&apos;s functionality
              </p>
            </div>
            <Link href={developerSubmitUrl}>
              <Button variant="outline">
                Submit Your App
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(null)}
                size="sm"
              >
                All Categories
              </Button>
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                  size="sm"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Apps Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredApps.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || selectedCategory 
                ? 'No apps found matching your criteria'
                : 'No apps available at the moment'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app) => (
              <Card 
                key={app.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(getDashboardUrl(`/marketplace/${app.id}/install`))}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{app.icon}</div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{app.name}</CardTitle>
                        <Badge variant="secondary" className="mt-1">
                          {app.category}
                        </Badge>
                      </div>
                    </div>
                    {app.installed && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 min-h-[60px]">
                    {app.description}
                  </CardDescription>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="ml-1 text-sm font-medium">{app.rating}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        ({app.reviews} reviews)
                      </span>
                    </div>
                    <Button size="sm" variant={app.installed ? 'outline' : 'default'}>
                      {app.installed ? 'Installed' : 'Install'}
                      <ExternalLink className="ml-2 h-4 w-4" />
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
