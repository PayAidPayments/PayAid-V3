'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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

export default function LeaveRequestsPage() {
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
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
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
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const requests = data?.requests || []
  const pagination = data?.pagination
  
  const dynamicTitle = getDynamicTitle('Leave Requests', statusFilter)
  const dynamicDescription = getDynamicDescription('Leave Requests', statusFilter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{dynamicTitle}</h1>
          <p className="mt-2 text-gray-600">{dynamicDescription}</p>
        </div>
        <Link href="/dashboard/hr/leave/apply">
          <Button>Apply for Leave</Button>
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
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <Button onClick={() => refetch()}>Refresh</Button>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>{dynamicTitle}</CardTitle>
          <CardDescription>
            {dynamicDescription} ({pagination?.total || 0} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No leave requests found</p>
              <Link href="/dashboard/hr/leave/apply">
                <Button>Apply for Leave</Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {request.employee.firstName} {request.employee.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{request.employee.employeeCode}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.leaveType.name}
                        {request.isHalfDay && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({request.halfDayType === 'FIRST_HALF' ? 'First Half' : 'Second Half'})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.startDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.endDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{request.days} days</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {request.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {request.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprove(request.id)}
                              disabled={approveRequest.isPending}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(request.id)}
                              disabled={rejectRequest.isPending}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        {request.status === 'APPROVED' && request.approvedAt && (
                          <div className="text-xs text-gray-500">
                            Approved on {format(new Date(request.approvedAt), 'MMM dd, yyyy')}
                          </div>
                        )}
                        {request.status === 'REJECTED' && request.rejectionReason && (
                          <div className="text-xs text-red-600">
                            {request.rejectionReason}
                          </div>
                        )}
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
