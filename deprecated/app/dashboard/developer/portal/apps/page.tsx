'use client'

import { useQuery } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Star, TrendingUp, Edit, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function MyAppsPage() {
  const { data: stats } = useQuery({
    queryKey: ['developer-stats'],
    queryFn: async () => {
      const res = await fetch('/api/developer/portal/stats', {
        headers: getAuthHeaders(),
      })
      if (!res.ok) return null
      return res.json()
    },
  })

  // For now, show placeholder - in production, fetch from MarketplaceApp where developerId = userId
  const { data: apps } = useQuery({
    queryKey: ['my-apps'],
    queryFn: async () => {
      // TODO: Implement API endpoint to fetch user's apps
      return []
    },
  })

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-7 w-7 text-purple-600" />
            My Apps
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your published marketplace applications
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/developer/portal/submit">
            Submit New App
          </Link>
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Total Apps</div>
                  <div className="text-2xl font-bold">{stats.appsCount || 0}</div>
                </div>
                <Package className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Total Installs</div>
                  <div className="text-2xl font-bold">{stats.totalInstalls || 0}</div>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Avg Rating</div>
                  <div className="text-2xl font-bold">
                    {stats.avgRating ? stats.avgRating.toFixed(1) : 'N/A'}
                  </div>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Published Apps</CardTitle>
          <CardDescription>Apps you've submitted to the marketplace</CardDescription>
        </CardHeader>
        <CardContent>
          {!apps || apps.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">You haven't published any apps yet</p>
              <Button asChild>
                <Link href="/dashboard/developer/portal/submit">
                  Submit Your First App
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {apps.map((app: any) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{app.icon || '📦'}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{app.name}</h3>
                        <Badge variant={app.isApproved ? 'default' : 'secondary'}>
                          {app.isApproved ? 'Approved' : 'Pending Review'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{app.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>{app.installs || 0} installs</span>
                        {app.rating && (
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {app.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/marketplace/${app.id}/reviews`}>
                        View Reviews
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
