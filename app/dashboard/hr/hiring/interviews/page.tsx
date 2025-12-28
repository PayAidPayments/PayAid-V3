'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

interface Interview {
  id: string
  roundName: string
  scheduledAt: string
  mode: string
  status: string
  feedback?: string
  rating?: number
  interviewerId?: string // interviewer relation doesn't exist in schema, use interviewerId instead
  candidate: {
    id: string
    fullName: string
    email: string
  }
}

export default function InterviewsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch } = useQuery<{
    interviews: Interview[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>({
    queryKey: ['interviews', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/hr/interviews?${params}`)
      if (!response.ok) throw new Error('Failed to fetch interviews')
      return response.json()
    },
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      NO_SHOW: 'bg-orange-100 text-orange-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const interviews = data?.interviews || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interviews</h1>
          <p className="mt-2 text-gray-600">Manage interview schedules and feedback</p>
        </div>
        <Link href="/dashboard/hr/hiring/interviews/schedule">
          <Button>Schedule Interview</Button>
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
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
            <Button onClick={() => refetch()}>Refresh</Button>
          </div>
        </CardContent>
      </Card>

      {/* Interviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Interviews</CardTitle>
          <CardDescription>
            {pagination?.total || 0} total interviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          {interviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No interviews found</p>
              <Link href="/dashboard/hr/hiring/interviews/schedule">
                <Button>Schedule Interview</Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Round</TableHead>
                    <TableHead>Scheduled At</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Interviewer</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interviews.map((interview) => (
                    <TableRow key={interview.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{interview.candidate.fullName}</div>
                          <div className="text-sm text-gray-500">{interview.candidate.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{interview.roundName}</TableCell>
                      <TableCell>
                        {format(new Date(interview.scheduledAt), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="capitalize">
                        {interview.mode.replace('_', ' ').toLowerCase()}
                      </TableCell>
                      <TableCell>
                        {interview.interviewerId ? (
                          <span className="text-sm text-gray-600">ID: {interview.interviewerId}</span>
                        ) : (
                          <span className="text-sm text-gray-400">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {interview.rating ? (
                          <div className="flex items-center">
                            {'⭐'.repeat(interview.rating)}
                            <span className="ml-1">({interview.rating}/5)</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            interview.status
                          )}`}
                        >
                          {interview.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/hr/hiring/interviews/${interview.id}`}>
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
