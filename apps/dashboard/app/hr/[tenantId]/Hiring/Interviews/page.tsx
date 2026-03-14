'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageLoading } from '@/components/ui/loading'
import { format } from 'date-fns'

interface Interview {
  id: string
  roundName: string
  scheduledAt: string
  mode: string
  status: string
  feedback?: string
  rating?: number
  interviewerId?: string
  candidate: {
    id: string
    fullName: string
    email: string
  }
}

export default function InterviewsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
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
      SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      NO_SHOW: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  if (isLoading) {
    return <PageLoading message="Loading interviews..." fullScreen={false} />
  }

  const interviews = data?.interviews || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Interviews</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage interview schedules and feedback</p>
        </div>
        <Link href={`/hr/${tenantId}/Hiring/Interviews/New`}>
          <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Schedule Interview</Button>
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
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
            <Button onClick={() => refetch()} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Refresh</Button>
          </div>
        </CardContent>
      </Card>

      {/* Interviews Table */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">All Interviews</CardTitle>
          <CardDescription className="dark:text-gray-400">
            {pagination?.total || 0} total interviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          {interviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="mb-4">No interviews found</p>
              <Link href={`/hr/${tenantId}/Hiring/Interviews/New`}>
                <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Schedule Interview</Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-700">
                    <TableHead className="dark:text-gray-300">Candidate</TableHead>
                    <TableHead className="dark:text-gray-300">Round</TableHead>
                    <TableHead className="dark:text-gray-300">Scheduled At</TableHead>
                    <TableHead className="dark:text-gray-300">Mode</TableHead>
                    <TableHead className="dark:text-gray-300">Interviewer</TableHead>
                    <TableHead className="dark:text-gray-300">Rating</TableHead>
                    <TableHead className="dark:text-gray-300">Status</TableHead>
                    <TableHead className="dark:text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interviews.map((interview) => (
                    <TableRow key={interview.id} className="dark:border-gray-700 dark:hover:bg-gray-700/50">
                      <TableCell>
                        <div>
                          <div className="font-medium dark:text-gray-200">{interview.candidate.fullName}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{interview.candidate.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="dark:text-gray-200">{interview.roundName}</TableCell>
                      <TableCell className="dark:text-gray-200">
                        {format(new Date(interview.scheduledAt), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="capitalize dark:text-gray-200">
                        {interview.mode.replace('_', ' ').toLowerCase()}
                      </TableCell>
                      <TableCell className="dark:text-gray-200">
                        {interview.interviewerId ? (
                          <span className="text-sm">ID: {interview.interviewerId}</span>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell className="dark:text-gray-200">
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
                        <Link href={`/hr/${tenantId}/Hiring/Interviews/${interview.id}`}>
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
