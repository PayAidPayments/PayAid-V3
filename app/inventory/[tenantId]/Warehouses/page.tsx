'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// ModuleTopBar is now in layout.tsx
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'
import { RefreshCw, Plus, Warehouse, MapPin } from 'lucide-react'

export default function InventoryWarehousesPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory-warehouses', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/inventory/warehouses`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch warehouses')
      }
      return response.json()
    },
  })

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 relative" style={{ zIndex: 1 }}>
      {/* ModuleTopBar is now in layout.tsx */}

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Warehouses</h1>
            <p className="mt-2 text-gray-600">Manage your warehouse locations and inventory</p>
          </div>
          <Link href={`/inventory/${tenantId}/Warehouses/new`}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Warehouse
            </Button>
          </Link>
        </div>

        {/* Warehouses List */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <PageLoading message="Loading warehouses..." fullScreen={false} />
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">Failed to load warehouses. Please try again.</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
            ) : data?.warehouses?.length === 0 ? (
              <div className="text-center py-12">
                <Warehouse className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2 font-medium">No warehouses found</p>
                <p className="text-sm text-gray-400 mb-4">Create your first warehouse to start managing inventory locations</p>
                <Link href={`/inventory/${tenantId}/Warehouses/new`}>
                  <Button>Create Your First Warehouse</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data?.warehouses?.map((warehouse: any) => (
                  <Card key={warehouse.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                        <Warehouse className="w-6 h-6 text-green-600" />
                      </div>
                      {warehouse.code && (
                        <p className="text-xs text-gray-500 mt-1">Code: {warehouse.code}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(warehouse.city || warehouse.state) && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                            <p className="text-sm text-gray-600">
                              {[warehouse.city, warehouse.state].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Products:</span>
                          <span className="font-medium">{warehouse.productCount || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Stock Value:</span>
                          <span className="font-medium">₹{warehouse.stockValue?.toLocaleString('en-IN') || '0'}</span>
                        </div>
                        {!warehouse.isActive && (
                          <div className="mt-2">
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">Inactive</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

