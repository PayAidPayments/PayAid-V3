'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Plus, Search, Wrench, TrendingDown, Calendar } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  RETIRED: 'bg-red-100 text-red-800',
}

function AssetsPageContent() {
  const [search, setSearch] = useState('')

  const { data: assetsData, isLoading: assetsLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const response = await fetch('/api/assets', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch assets')
      return response.json()
    },
  })

  const { data: maintenanceData } = useQuery({
    queryKey: ['asset-maintenance'],
    queryFn: async () => {
      const response = await fetch('/api/assets/maintenance?limit=10', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch maintenance')
      return response.json()
    },
  })

  const assets = assetsData?.assets || []
  const maintenance = maintenanceData?.maintenance || []
  const filtered = assets.filter((a: any) =>
    search === '' ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.assetNumber?.toLowerCase().includes(search.toLowerCase())
  )

  if (assetsLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Asset Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track assets, depreciation, and maintenance schedules
          </p>
        </div>
        <Link href="/dashboard/assets/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Assets</CardTitle>
            <CardDescription>All tracked assets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{assets.length}</div>
            <p className="text-sm text-gray-500 mt-2">Assets in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Assets</CardTitle>
            <CardDescription>Currently in use</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {assets.filter((a: any) => a.status === 'ACTIVE').length}
            </div>
            <p className="text-sm text-gray-500 mt-2">Active assets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Due</CardTitle>
            <CardDescription>Upcoming maintenance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {maintenance.filter((m: any) => m.status === 'SCHEDULED').length}
            </div>
            <p className="text-sm text-gray-500 mt-2">Scheduled maintenance</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((asset: any) => (
          <Link key={asset.id} href={`/dashboard/assets/${asset.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{asset.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {asset.assetNumber || 'No number'}
                    </CardDescription>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[asset.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'}`}
                  >
                    {asset.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {asset.category && (
                    <div>
                      <span className="text-gray-500">Category: </span>
                      <span className="font-medium">{asset.category}</span>
                    </div>
                  )}
                  {asset.purchaseValue && (
                    <div>
                      <span className="text-gray-500">Purchase Value: </span>
                      <span className="font-medium">
                        {asset.currency} {Number(asset.purchaseValue).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {asset.purchaseDate && (
                    <div>
                      <span className="text-gray-500">Purchase Date: </span>
                      <span className="font-medium">
                        {format(new Date(asset.purchaseDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                  {asset.location && (
                    <div>
                      <span className="text-gray-500">Location: </span>
                      <span className="font-medium">{asset.location}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No assets found</p>
            <Link href="/dashboard/assets/new">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Asset
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {maintenance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Maintenance</CardTitle>
            <CardDescription>Scheduled maintenance tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {maintenance
                .filter((m: any) => m.status === 'SCHEDULED')
                .slice(0, 5)
                .map((m: any) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Wrench className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium">{m.maintenanceType}</div>
                        <div className="text-sm text-gray-500">
                          {m.asset?.name || 'Unknown asset'}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {m.scheduledDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(m.scheduledDate), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function AssetsPage() {
  return <AssetsPageContent />
}

