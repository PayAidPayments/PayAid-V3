'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageLoading } from '@/components/ui/loading'

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
  const params = useParams()
  const tenantId = params.tenantId as string
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
      DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      ON_HOLD: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      CLOSED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  if (isLoading) {
    return <PageLoading message="Loading job requisitions..." fullScreen={false} />
  }

  const requisitions = data?.requisitions || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Job Requisitions</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage job openings and hiring requirements</p>
        </div>
        <Link href={`/hr/${tenantId}/Hiring/Job-Requisitions/New`}>
          <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Create Requisition</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="CLOSED">Closed</option>
            </select>
            <Button onClick={() => refetch()} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Refresh</Button>
          </div>
        </CardContent>
      </Card>

      {/* Requisitions Table */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">All Job Requisitions</CardTitle>
          <CardDescription className="dark:text-gray-400">
            {pagination?.total || 0} total requisitions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requisitions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="mb-4">No job requisitions found</p>
              <Link href={`/hr/${tenantId}/Hiring/Job-Requisitions/New`}>
                <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Create Your First Requisition</Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-700">
                    <TableHead className="dark:text-gray-300">Title</TableHead>
                    <TableHead className="dark:text-gray-300">Department</TableHead>
                    <TableHead className="dark:text-gray-300">Location</TableHead>
                    <TableHead className="dark:text-gray-300">Type</TableHead>
                    <TableHead className="dark:text-gray-300">Budget</TableHead>
                    <TableHead className="dark:text-gray-300">Candidates</TableHead>
                    <TableHead className="dark:text-gray-300">Offers</TableHead>
                    <TableHead className="dark:text-gray-300">Status</TableHead>
                    <TableHead className="dark:text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requisitions.map((req) => (
                    <TableRow key={req.id} className="dark:border-gray-700 dark:hover:bg-gray-700/50">
                      <TableCell className="font-medium dark:text-gray-200">{req.title}</TableCell>
                      <TableCell className="dark:text-gray-200">{req.department?.name || '-'}</TableCell>
                      <TableCell className="dark:text-gray-200">{req.location?.name || '-'}</TableCell>
                      <TableCell className="capitalize dark:text-gray-200">
                        {req.employmentType.replace('_', ' ').toLowerCase()}
                      </TableCell>
                      <TableCell className="dark:text-gray-200">
                        {req.budgetedCtcMinInr && req.budgetedCtcMaxInr
                          ? `₹${Number(req.budgetedCtcMinInr).toLocaleString('en-IN')} - ₹${Number(req.budgetedCtcMaxInr).toLocaleString('en-IN')}`
                          : req.budgetedCtcMinInr
                          ? `₹${Number(req.budgetedCtcMinInr).toLocaleString('en-IN')}+`
                          : '-'}
                      </TableCell>
                      <TableCell className="dark:text-gray-200">{req._count.candidateJobs}</TableCell>
                      <TableCell className="dark:text-gray-200">{req._count.offers}</TableCell>
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
                        <Link href={`/hr/${tenantId}/Hiring/Job-Requisitions/${req.id}`}>
                          <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
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
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.page === 1}
                      className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={pagination.page === pagination.totalPages}
                      className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
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
