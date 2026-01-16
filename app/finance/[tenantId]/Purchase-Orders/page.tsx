'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PageLoading } from '@/components/ui/loading'
import { format } from 'date-fns'
import { getAuthHeaders } from '@/lib/api/client'
import { getDynamicTitle, getDynamicDescription } from '@/lib/utils/status-labels'

interface PurchaseOrder {
  id: string
  poNumber: string
  status: string
  orderDate: string
  expectedDeliveryDate?: string
  total: number
  vendor: {
    id: string
    name: string
    companyName?: string
  }
  requestedBy?: {
    id: string
    name: string
  }
  _count: {
    items: number
    goodsReceipts: number
  }
}

export default function FinancePurchaseOrdersPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery<{
    orders: PurchaseOrder[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>({
    queryKey: ['purchase-orders', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/purchases/orders?${params}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch purchase orders')
      return response.json()
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      case 'PENDING_APPROVAL':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'SENT':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'PARTIALLY_RECEIVED':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'RECEIVED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const orders = data?.orders || []
  const pagination = data?.pagination
  
  const dynamicTitle = getDynamicTitle('Purchase Orders', statusFilter)
  const dynamicDescription = getDynamicDescription('Purchase Orders', statusFilter)

  if (isLoading) {
    return <PageLoading message="Loading purchase orders..." fullScreen={false} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{dynamicTitle}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{dynamicDescription}</p>
        </div>
        <Link href={`/finance/${tenantId}/Purchase-Orders/New`}>
          <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">New Purchase Order</Button>
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('all')}
          className="dark:border-gray-600 dark:text-gray-300"
        >
          All
        </Button>
        <Button
          variant={statusFilter === 'DRAFT' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('DRAFT')}
          className="dark:border-gray-600 dark:text-gray-300"
        >
          Draft
        </Button>
        <Button
          variant={statusFilter === 'PENDING_APPROVAL' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('PENDING_APPROVAL')}
          className="dark:border-gray-600 dark:text-gray-300"
        >
          Pending Approval
        </Button>
        <Button
          variant={statusFilter === 'APPROVED' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('APPROVED')}
          className="dark:border-gray-600 dark:text-gray-300"
        >
          Approved
        </Button>
        <Button
          variant={statusFilter === 'RECEIVED' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('RECEIVED')}
          className="dark:border-gray-600 dark:text-gray-300"
        >
          Received
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">No purchase orders found. Create your first purchase order to get started.</p>
            <Link href={`/finance/${tenantId}/Purchase-Orders/New`}>
              <Button className="mt-4 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Create Purchase Order</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="dark:text-gray-300">PO Number</TableHead>
                <TableHead className="dark:text-gray-300">Vendor</TableHead>
                <TableHead className="dark:text-gray-300">Status</TableHead>
                <TableHead className="dark:text-gray-300">Order Date</TableHead>
                <TableHead className="dark:text-gray-300">Expected Delivery</TableHead>
                <TableHead className="dark:text-gray-300">Total</TableHead>
                <TableHead className="dark:text-gray-300">Items</TableHead>
                <TableHead className="dark:text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="dark:border-gray-700">
                  <TableCell className="font-medium dark:text-gray-100">{order.poNumber}</TableCell>
                  <TableCell className="dark:text-gray-300">
                    <div>
                      <div className="font-medium">{order.vendor.name}</div>
                      {order.vendor.companyName && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">{order.vendor.companyName}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="dark:text-gray-300">
                    {format(new Date(order.orderDate), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="dark:text-gray-300">
                    {order.expectedDeliveryDate ? (
                      format(new Date(order.expectedDeliveryDate), 'MMM dd, yyyy')
                    ) : (
                      <span className="text-gray-400">Not set</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium dark:text-gray-100">
                    ₹{Number(order.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="dark:text-gray-300">{order._count.items}</TableCell>
                  <TableCell>
                    <Link href={`/finance/${tenantId}/Purchase-Orders/${order.id}`}>
                      <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {((page - 1) * pagination.limit) + 1} to {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} orders
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
