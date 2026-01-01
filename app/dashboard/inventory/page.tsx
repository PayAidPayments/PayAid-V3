'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Plus, Package, ArrowRightLeft, MapPin, Search } from 'lucide-react'

function InventoryPageContent() {
  const [search, setSearch] = useState('')

  const { data: locationsData } = useQuery({
    queryKey: ['inventory-locations'],
    queryFn: async () => {
      const response = await fetch('/api/inventory/locations', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch locations')
      return response.json()
    },
  })

  const { data: transfersData } = useQuery({
    queryKey: ['stock-transfers'],
    queryFn: async () => {
      const response = await fetch('/api/inventory/transfers?limit=10', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch transfers')
      return response.json()
    },
  })

  const locations = locationsData?.locations || []
  const transfers = transfersData?.transfers || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage multi-location inventory, stock transfers, and batch tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/inventory/locations/new">
            <Button variant="outline">
              <MapPin className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </Link>
          <Link href="/dashboard/inventory/transfers/new">
            <Button>
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Transfer Stock
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Locations</CardTitle>
            <CardDescription>Warehouse and storage locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{locations.length}</div>
            <p className="text-sm text-gray-500 mt-2">Total locations</p>
            <Link href="/dashboard/inventory/locations">
              <Button variant="outline" size="sm" className="mt-4 w-full">
                View All Locations
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Transfers</CardTitle>
            <CardDescription>Recent transfers between locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{transfers.length}</div>
            <p className="text-sm text-gray-500 mt-2">Recent transfers</p>
            <Link href="/dashboard/inventory/transfers">
              <Button variant="outline" size="sm" className="mt-4 w-full">
                View All Transfers
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Batch/Serial Tracking</CardTitle>
            <CardDescription>Track products by batch or serial number</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">-</div>
            <p className="text-sm text-gray-500 mt-2">Tracked items</p>
            <Link href="/dashboard/inventory/batch-serial">
              <Button variant="outline" size="sm" className="mt-4 w-full">
                View Tracking
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Stock Transfers</CardTitle>
          <CardDescription>Latest transfers between locations</CardDescription>
        </CardHeader>
        <CardContent>
          {transfers.length > 0 ? (
            <div className="space-y-3">
              {transfers.slice(0, 5).map((transfer: any) => (
                <div
                  key={transfer.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{transfer.transferNumber}</div>
                    <div className="text-sm text-gray-500">
                      From: {transfer.fromLocation?.name || 'N/A'} → To:{' '}
                      {transfer.toLocation?.name || 'N/A'}
                    </div>
                  </div>
                  <div className="text-sm">
                    <span
                      className={`px-2 py-1 rounded-full ${
                        transfer.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : transfer.status === 'IN_TRANSIT'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {transfer.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No stock transfers yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Locations</CardTitle>
          <CardDescription>Manage your warehouse and storage locations</CardDescription>
        </CardHeader>
        <CardContent>
          {locations.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {locations.map((location: any) => (
                <Link
                  key={location.id}
                  href={`/dashboard/inventory/locations/${location.id}`}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <div className="flex-1">
                          <div className="font-medium">{location.name}</div>
                          <div className="text-sm text-gray-500">{location.address}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No locations configured</p>
              <Link href="/dashboard/inventory/locations/new">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Location
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function InventoryPage() {
  return <InventoryPageContent />
}

