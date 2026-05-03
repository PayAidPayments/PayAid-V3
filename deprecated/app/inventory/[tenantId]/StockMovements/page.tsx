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
import { ModuleSwitcher } from '@/components/ModuleSwitcher'
import { RefreshCw, Plus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { format } from 'date-fns'

export default function InventoryStockMovementsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory-stock-movements', tenantId, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (typeFilter !== 'all') {
        params.append('type', typeFilter)
      }
      const response = await fetch(`/api/inventory/stock-movements?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch stock movements')
      }
      return response.json()
    },
  })

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 relative" style={{ zIndex: 1 }}>
      {/* Top Navigation Bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold text-gray-900">Inventory</h2>
            <nav className="flex items-center gap-4 text-sm">
              <Link href={`/inventory/${tenantId}/Home/`} className="text-gray-600 hover:text-gray-900 transition-colors">Home</Link>
              <Link href={`/inventory/${tenantId}/Products`} className="text-gray-600 hover:text-gray-900 transition-colors">Products</Link>
              <Link href={`/inventory/${tenantId}/Warehouses`} className="text-gray-600 hover:text-gray-900 transition-colors">Warehouses</Link>
              <Link href={`/inventory/${tenantId}/StockMovements`} className="text-green-600 font-medium border-b-2 border-green-600 pb-2">Stock Movements</Link>
              <Link href={`/inventory/${tenantId}/Reports`} className="text-gray-600 hover:text-gray-900 transition-colors">Reports</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ModuleSwitcher currentModule="inventory" />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Movements</h1>
            <p className="mt-2 text-gray-600">Track all inventory movements and transactions</p>
          </div>
          <Link href={`/inventory/${tenantId}/StockMovements/new`}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Movement
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Button
            variant={typeFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('all')}
          >
            All
          </Button>
          <Button
            variant={typeFilter === 'IN' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('IN')}
          >
            <ArrowDown className="w-4 h-4 mr-2" />
            Stock In
          </Button>
          <Button
            variant={typeFilter === 'OUT' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('OUT')}
          >
            <ArrowUp className="w-4 h-4 mr-2" />
            Stock Out
          </Button>
          <Button
            variant={typeFilter === 'TRANSFER' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('TRANSFER')}
          >
            <ArrowUpDown className="w-4 h-4 mr-2" />
            Transfer
          </Button>
        </div>

        {/* Movements List */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <PageLoading message="Loading stock movements..." fullScreen={false} />
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">Failed to load stock movements. Please try again.</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
            ) : data?.movements?.length === 0 ? (
              <div className="text-center py-12">
                <ArrowUpDown className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2 font-medium">No stock movements found</p>
                <p className="text-sm text-gray-400 mb-4">
                  {typeFilter !== 'all' ? `No ${typeFilter.toLowerCase()} movements` : 'Start tracking inventory movements'}
                </p>
                <Link href={`/inventory/${tenantId}/StockMovements/new`}>
                  <Button>Create Stock Movement</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {data?.movements?.map((movement: any) => (
                  <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      {movement.type === 'IN' ? (
                        <ArrowDown className="w-5 h-5 text-green-600" />
                      ) : movement.type === 'OUT' ? (
                        <ArrowUp className="w-5 h-5 text-red-600" />
                      ) : (
                        <ArrowUpDown className="w-5 h-5 text-blue-600" />
                      )}
                      <div>
                        <p className="font-medium">{movement.productName}</p>
                        <p className="text-sm text-gray-500">
                          {movement.type === 'IN' ? 'Stock In' : movement.type === 'OUT' ? 'Stock Out' : 'Transfer'}
                          {movement.warehouseName && ` • ${movement.warehouseName}`}
                          {movement.fromLocationName && movement.toLocationName && ` • ${movement.fromLocationName} → ${movement.toLocationName}`}
                        </p>
                        <p className="text-xs text-gray-400">{format(new Date(movement.date), 'PPp')}</p>
                        {movement.reason && (
                          <p className="text-xs text-gray-500 mt-1">Reason: {movement.reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${movement.type === 'IN' ? 'text-green-600' : movement.type === 'OUT' ? 'text-red-600' : 'text-blue-600'}`}>
                        {movement.type === 'IN' ? '+' : movement.type === 'OUT' ? '-' : '±'}{movement.quantity}
                      </p>
                      {movement.createdBy && (
                        <p className="text-xs text-gray-500 mt-1">{movement.createdBy.name}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

