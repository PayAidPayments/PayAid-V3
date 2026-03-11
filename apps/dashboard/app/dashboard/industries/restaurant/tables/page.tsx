'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface RestaurantTable {
  id: string
  tableNumber: number
  name?: string
  capacity: number
  location?: string
  status: string
  notes?: string
  currentOrder?: {
    id: string
    orderNumber: string
    status: string
    totalAmount: string
  }
  _count: {
    orders: number
    reservations: number
  }
}

export default function RestaurantTablesPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data, isLoading } = useQuery<{ tables: RestaurantTable[] }>({
    queryKey: ['restaurant-tables', statusFilter],
    queryFn: async () => {
      const url = statusFilter === 'all'
        ? '/api/industries/restaurant/tables'
        : `/api/industries/restaurant/tables?status=${statusFilter}`
      const response = await apiRequest(url)
      if (!response.ok) throw new Error('Failed to fetch tables')
      return response.json()
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800'
      case 'OCCUPIED':
        return 'bg-red-100 text-red-800'
      case 'RESERVED':
        return 'bg-yellow-100 text-yellow-800'
      case 'OUT_OF_SERVICE':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const tables = data?.tables || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restaurant Tables</h1>
          <p className="text-gray-600 mt-1">Manage your restaurant tables and seating</p>
        </div>
        <Link href="/dashboard/industries/restaurant/tables/new">
          <Button>Add New Table</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('all')}
        >
          All
        </Button>
        <Button
          variant={statusFilter === 'AVAILABLE' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('AVAILABLE')}
        >
          Available
        </Button>
        <Button
          variant={statusFilter === 'OCCUPIED' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('OCCUPIED')}
        >
          Occupied
        </Button>
        <Button
          variant={statusFilter === 'RESERVED' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('RESERVED')}
        >
          Reserved
        </Button>
        <Button
          variant={statusFilter === 'OUT_OF_SERVICE' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('OUT_OF_SERVICE')}
        >
          Out of Service
        </Button>
      </div>

      {/* Tables Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tables...</p>
        </div>
      ) : tables.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No tables found. Create your first table to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map((table) => (
            <Card key={table.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">
                    {table.name || `Table ${table.tableNumber}`}
                  </CardTitle>
                  <Badge className={getStatusColor(table.status)}>
                    {table.status}
                  </Badge>
                </div>
                <CardDescription>
                  Table #{table.tableNumber}
                  {table.location && ` • ${table.location}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-medium">{table.capacity} seats</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Orders:</span>
                    <span className="font-medium">{table._count.orders}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Reservations:</span>
                    <span className="font-medium">{table._count.reservations}</span>
                  </div>
                  {table.currentOrder && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-600 mb-1">Active Order:</p>
                      <Link
                        href={`/dashboard/industries/restaurant/orders/${table.currentOrder.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {table.currentOrder.orderNumber}
                      </Link>
                    </div>
                  )}
                  <div className="pt-2">
                    <Link href={`/dashboard/industries/restaurant/tables/${table.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
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

