'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

interface JobRequisition {
  id: string
  title: string
  department?: { id: string; name: string }
  location?: { id: string; name: string }
  employmentType: string
  budgetedCtcMinInr?: number
  budgetedCtcMaxInr?: number
  status: string
  _count: {
    candidateJobs: number
    offers: number
  }
  createdAt: string
}

export default function JobRequisitionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch } = useQuery<{
    requisitions: JobRequisition[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>({
    queryKey: ['job-requisitions', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/hr/job-requisitions?${params}`)
      if (!response.ok) throw new Error('Failed to fetch job requisitions')
      return response.json()
    },
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      ON_HOLD: 'bg-orange-100 text-orange-800',
      CLOSED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const requisitions = data?.requisitions || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Requisitions</h1>
          <p className="mt-2 text-gray-600">Manage job openings and hiring requirements</p>
        </div>
        <Link href="/dashboard/hr/hiring/job-requisitions/new">
          <Button>Create Requisition</Button>
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
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="CLOSED">Closed</option>
            </select>
            <Button onClick={() => refetch()}>Refresh</Button>
          </div>
        </CardContent>
      </Card>

      {/* Requisitions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Job Requisitions</CardTitle>
          <CardDescription>
            {pagination?.total || 0} total requisitions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requisitions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No job requisitions found</p>
              <Link href="/dashboard/hr/hiring/job-requisitions/new">
                <Button>Create Your First Requisition</Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Candidates</TableHead>
                    <TableHead>Offers</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requisitions.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.title}</TableCell>
                      <TableCell>{req.department?.name || '-'}</TableCell>
                      <TableCell>{req.location?.name || '-'}</TableCell>
                      <TableCell className="capitalize">
                        {req.employmentType.replace('_', ' ').toLowerCase()}
                      </TableCell>
                      <TableCell>
                        {req.budgetedCtcMinInr && req.budgetedCtcMaxInr
                          ? `₹${Number(req.budgetedCtcMinInr).toLocaleString('en-IN')} - ₹${Number(req.budgetedCtcMaxInr).toLocaleString('en-IN')}`
                          : req.budgetedCtcMinInr
                          ? `₹${Number(req.budgetedCtcMinInr).toLocaleString('en-IN')}+`
                          : '-'}
                      </TableCell>
                      <TableCell>{req._count.candidateJobs}</TableCell>
                      <TableCell>{req._count.offers}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            req.status
                          )}`}
                        >
                          {req.status.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/hr/hiring/job-requisitions/${req.id}`}>
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
