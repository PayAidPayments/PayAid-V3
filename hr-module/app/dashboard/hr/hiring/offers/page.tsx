'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

interface Offer {
  id: string
  offeredCtcInr: number
  acceptedCtcInr?: number
  joiningDate?: string
  offerStatus: string
  candidate: {
    id: string
    fullName: string
    email: string
  }
  requisition: {
    id: string
    title: string
  }
  employee?: {
    id: string
    employeeCode: string
    firstName: string
    lastName: string
  }
  createdAt: string
}

export default function OffersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch } = useQuery<{
    offers: Offer[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>({
    queryKey: ['offers', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (statusFilter) params.append('offerStatus', statusFilter)

      const response = await fetch(`/api/hr/offers?${params}`)
      if (!response.ok) throw new Error('Failed to fetch offers')
      return response.json()
    },
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-orange-100 text-orange-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const offers = data?.offers || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Offers</h1>
          <p className="mt-2 text-gray-600">Manage job offers and acceptances</p>
        </div>
        <Link href="/dashboard/hr/hiring/offers/new">
          <Button>Create Offer</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-gray-300 px-3"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>
            <Button onClick={() => refetch()}>Refresh</Button>
          </div>
        </CardContent>
      </Card>

      {/* Offers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Offers</CardTitle>
          <CardDescription>
            {pagination?.total || 0} total offers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {offers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No offers found</p>
              <Link href="/dashboard/hr/hiring/offers/new">
                <Button>Create Your First Offer</Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Offered CTC</TableHead>
                    <TableHead>Accepted CTC</TableHead>
                    <TableHead>Joining Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offers.map((offer) => (
                    <TableRow key={offer.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{offer.candidate.fullName}</div>
                          <div className="text-sm text-gray-500">{offer.candidate.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{offer.requisition.title}</TableCell>
                      <TableCell>
                        ₹{Number(offer.offeredCtcInr).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        {offer.acceptedCtcInr
                          ? `₹${Number(offer.acceptedCtcInr).toLocaleString('en-IN')}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {offer.joiningDate
                          ? format(new Date(offer.joiningDate), 'MMM dd, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {offer.employee ? (
                          <div>
                            <div className="font-medium">
                              {offer.employee.firstName} {offer.employee.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{offer.employee.employeeCode}</div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            offer.offerStatus
                          )}`}
                        >
                          {offer.offerStatus}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/hr/hiring/offers/${offer.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
