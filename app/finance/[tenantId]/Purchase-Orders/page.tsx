'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PageLoading } from '@/components/ui/loading'
import { format } from 'date-fns'
import { getAuthHeaders } from '@/lib/api/client'
import { getDynamicTitle, getDynamicDescription } from '@/lib/utils/status-labels'
import { formatINRStandard, formatINRForDisplay } from '@/lib/utils/formatINR'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'
import { ShoppingCart, IndianRupee, Plus, CheckCircle2, Package } from 'lucide-react'

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
    summary?: { totalOrders: number; approvedCount: number; pendingCount: number; totalAmount: number }
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
  const summary = data?.summary
  const moduleConfig = getModuleConfig('finance')
  
  const dynamicTitle = getDynamicTitle('Purchase Orders', statusFilter)
  const dynamicDescription = getDynamicDescription('Purchase Orders', statusFilter)

  const totalOrders = summary?.totalOrders ?? pagination?.total ?? 0
  const approvedCount = summary?.approvedCount ?? 0
  const pendingCount = summary?.pendingCount ?? 0
  const totalAmount = summary?.totalAmount ?? 0

  const heroMetrics = [
    {
      label: 'Total Orders',
      value: String(totalOrders),
      icon: <ShoppingCart className="w-5 h-5" />,
      href: '#',
    },
    {
      label: 'Total Amount',
      value: formatINRForDisplay(totalAmount),
      icon: <IndianRupee className="w-5 h-5" />,
      href: '#',
    },
    {
      label: 'Approved',
      value: String(approvedCount),
      icon: <CheckCircle2 className="w-5 h-5" />,
      href: '#',
    },
    {
      label: 'Pending',
      value: String(pendingCount),
      icon: <Package className="w-5 h-5" />,
      href: '#',
    },
  ]

  if (isLoading) {
    return <PageLoading message="Loading purchase orders..." fullScreen={false} />
  }

  if (!moduleConfig) {
    return <div>Module configuration not found</div>
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      {/* Universal Module Hero */}
      <UniversalModuleHero
        moduleName="Purchase Orders"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      {/* Content Sections - 32px gap */}
      <div className="p-6 space-y-8 overflow-y-auto" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Action Button */}
        <div className="flex items-center justify-end">
          <Link href={`/finance/${tenantId}/Purchase-Orders/New`}>
            <Button className="bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#3F1F62] hover:to-[#E0B200] text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Purchase Order
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <GlassCard>
          <div className="p-6">
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
          </div>
        </GlassCard>

        {/* Orders Table */}
        {orders.length === 0 ? (
          <GlassCard>
            <div className="p-6 py-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">No purchase orders found. Create your first purchase order to get started.</p>
              <Link href={`/finance/${tenantId}/Purchase-Orders/New`}>
                <Button className="mt-4 bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#3F1F62] hover:to-[#E0B200] text-white">
                  Create Purchase Order
                </Button>
              </Link>
            </div>
          </GlassCard>
        ) : (
          <GlassCard>
            <div className="p-6">
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
                    {formatINRStandard(Number(order.total))}
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
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  )
}
