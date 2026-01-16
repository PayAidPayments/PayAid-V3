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
import { getAuthHeaders } from '@/lib/api/client'

interface Vendor {
  id: string
  name: string
  companyName?: string
  email?: string
  phone?: string
  gstin?: string
  status: string
  rating?: number
  _count: {
    purchaseOrders: number
    ratings: number
  }
}

export default function FinanceVendorsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery<{
    vendors: Vendor[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>({
    queryKey: ['vendors', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/purchases/vendors?${params}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch vendors')
      return response.json()
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      case 'BLACKLISTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const vendors = data?.vendors || []
  const pagination = data?.pagination

  if (isLoading) {
    return <PageLoading message="Loading vendors..." fullScreen={false} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Vendors</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your vendor database</p>
        </div>
        <Link href={`/finance/${tenantId}/Vendors/New`}>
          <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">New Vendor</Button>
        </Link>
      </div>

      <div className="flex gap-2">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('all')}
          className="dark:border-gray-600 dark:text-gray-300"
        >
          All
        </Button>
        <Button
          variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('ACTIVE')}
          className="dark:border-gray-600 dark:text-gray-300"
        >
          Active
        </Button>
        <Button
          variant={statusFilter === 'INACTIVE' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('INACTIVE')}
          className="dark:border-gray-600 dark:text-gray-300"
        >
          Inactive
        </Button>
      </div>

      {vendors.length === 0 ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">No vendors found. Create your first vendor to get started.</p>
            <Link href={`/finance/${tenantId}/Vendors/New`}>
              <Button className="mt-4 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Create Vendor</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="dark:text-gray-300">Vendor</TableHead>
                <TableHead className="dark:text-gray-300">Contact</TableHead>
                <TableHead className="dark:text-gray-300">GSTIN</TableHead>
                <TableHead className="dark:text-gray-300">Status</TableHead>
                <TableHead className="dark:text-gray-300">Rating</TableHead>
                <TableHead className="dark:text-gray-300">Orders</TableHead>
                <TableHead className="dark:text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id} className="dark:border-gray-700">
                  <TableCell className="dark:text-gray-300">
                    <div>
                      <div className="font-medium">{vendor.name}</div>
                      {vendor.companyName && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">{vendor.companyName}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="dark:text-gray-300">
                    <div className="text-sm">
                      {vendor.email && <div>{vendor.email}</div>}
                      {vendor.phone && <div className="text-gray-500 dark:text-gray-400">{vendor.phone}</div>}
                    </div>
                  </TableCell>
                  <TableCell className="dark:text-gray-300">{vendor.gstin || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(vendor.status)}>
                      {vendor.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="dark:text-gray-300">
                    {vendor.rating ? (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{Number(vendor.rating).toFixed(1)}</span>
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">({vendor._count.ratings})</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">No ratings</span>
                    )}
                  </TableCell>
                  <TableCell className="dark:text-gray-300">{vendor._count.purchaseOrders}</TableCell>
                  <TableCell>
                    <Link href={`/finance/${tenantId}/Vendors/${vendor.id}`}>
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
                Showing {((page - 1) * pagination.limit) + 1} to {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} vendors
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
