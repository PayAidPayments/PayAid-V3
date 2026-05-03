'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PageLoading } from '@/components/ui/loading'
import { format } from 'date-fns'
import { getDynamicTitle, getDynamicDescription } from '@/lib/utils/status-labels'

interface LeaveRequest {
  id: string
  employee: {
    id: string
    employeeCode: string
    firstName: string
    lastName: string
  }
  leaveType: {
    id: string
    name: string
    code: string
  }
  startDate: string
  endDate: string
  days: number
  isHalfDay: boolean
  halfDayType?: string
  reason: string
  status: string
  approver?: {
    id: string
    firstName: string
    lastName: string
  }
  approvedAt?: string
  rejectedAt?: string
  rejectionReason?: string
  createdAt: string
}

export default function HRLeaveRequestsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch } = useQuery<{
    requests: LeaveRequest[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>({
    queryKey: ['leave-requests', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/hr/leave/requests?${params}`)
      if (!response.ok) throw new Error('Failed to fetch leave requests')
      return response.json()
    },
  })

  const approveRequest = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/hr/leave/requests/${id}/approve`, {
        method: 'PUT',
      })
      if (!response.ok) throw new Error('Failed to approve leave request')
      return response.json()
    },
    onSuccess: () => {
      refetch()
    },
  })

  const rejectRequest = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await fetch(`/api/hr/leave/requests/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: reason }),
      })
      if (!response.ok) throw new Error('Failed to reject leave request')
      return response.json()
    },
    onSuccess: () => {
      refetch()
    },
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  const handleApprove = (id: string) => {
    if (confirm('Are you sure you want to approve this leave request?')) {
      approveRequest.mutate(id)
    }
  }

  const handleReject = (id: string) => {
    const reason = prompt('Enter rejection reason:')
    if (reason) {
      rejectRequest.mutate({ id, reason })
    }
  }

  if (isLoading) {
    return <PageLoading message="Loading leave requests..." fullScreen={false} />
  }

  const requests = (data?.requests && Array.isArray(data.requests)) ? data.requests : []
  const pagination = data?.pagination
  
  const dynamicTitle = getDynamicTitle('Leave Requests', statusFilter)
  const dynamicDescription = getDynamicDescription('Leave Requests', statusFilter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{dynamicTitle}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{dynamicDescription}</p>
        </div>
        <Link href={`/hr/${tenantId}/Leave/Apply`}>
          <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Apply for Leave</Button>
        </Link>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <Button onClick={() => refetch()} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Refresh</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">{dynamicTitle}</CardTitle>
          <CardDescription className="dark:text-gray-400">
            {dynamicDescription} ({pagination?.total || 0} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="mb-4">No leave requests found</p>
              <Link href={`/hr/${tenantId}/Leave/Apply`}>
                <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Apply for Leave</Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="dark:text-gray-300">Employee</TableHead>
                    <TableHead className="dark:text-gray-300">Leave Type</TableHead>
                    <TableHead className="dark:text-gray-300">Start Date</TableHead>
                    <TableHead className="dark:text-gray-300">End Date</TableHead>
                    <TableHead className="dark:text-gray-300">Days</TableHead>
                    <TableHead className="dark:text-gray-300">Status</TableHead>
                    <TableHead className="dark:text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(requests || []).map((request) => (
                    <TableRow key={request.id} className="dark:border-gray-700">
                      <TableCell>
                        <div>
                          <div className="font-medium dark:text-gray-100">
                            {request.employee.firstName} {request.employee.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{request.employee.employeeCode}</div>
                        </div>
                      </TableCell>
                      <TableCell className="dark:text-gray-300">
                        {request.leaveType.name}
                        {request.isHalfDay && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            ({request.halfDayType === 'FIRST_HALF' ? 'First Half' : 'Second Half'})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="dark:text-gray-300">
                        {format(new Date(request.startDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="dark:text-gray-300">
                        {format(new Date(request.endDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="dark:text-gray-300">{request.days} days</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprove(request.id)}
                              disabled={approveRequest.isPending}
                              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(request.id)}
                              disabled={rejectRequest.isPending}
                              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        {request.status === 'APPROVED' && request.approvedAt && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Approved on {format(new Date(request.approvedAt), 'MMM dd, yyyy')}
                          </div>
                        )}
                        {request.status === 'REJECTED' && request.rejectionReason && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            {request.rejectionReason}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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
