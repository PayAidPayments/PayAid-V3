'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

interface OnboardingInstanceTask {
  id: string
  status: string
  completedAt?: string
  task: {
    id: string
    title: string
    assignedToRole: string
    dueDaysRelative: number
  }
  assignee?: {
    id: string
    firstName: string
    lastName: string
  }
}

interface OnboardingInstance {
  id: string
  status: string
  startDate: string
  completedAt?: string
  employee: {
    id: string
    employeeCode: string
    firstName: string
    lastName: string
  }
  template: {
    id: string
    name: string
  }
  tasks: OnboardingInstanceTask[]
}

export default function OnboardingInstancesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch } = useQuery<{
    instances: OnboardingInstance[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>({
    queryKey: ['onboarding-instances', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/hr/onboarding/instances?${params}`)
      if (!response.ok) throw new Error('Failed to fetch onboarding instances')
      return response.json()
    },
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const instances = data?.instances || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Onboarding Instances</h1>
          <p className="mt-2 text-gray-600">Track employee onboarding progress</p>
        </div>
        <Link href="/dashboard/hr/onboarding/instances/new">
          <Button>Start Onboarding</Button>
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
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <Button onClick={() => refetch()}>Refresh</Button>
          </div>
        </CardContent>
      </Card>

      {/* Instances Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Onboarding Instances</CardTitle>
          <CardDescription>
            {pagination?.total || 0} total instances
          </CardDescription>
        </CardHeader>
        <CardContent>
          {instances.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No onboarding instances found</p>
              <Link href="/dashboard/hr/onboarding/instances/new">
                <Button>Start Onboarding</Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Tasks Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completed At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instances.map((instance) => {
                    const completedTasks = instance.tasks.filter((t) => t.status === 'COMPLETED').length
                    const totalTasks = instance.tasks.length
                    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

                    return (
                      <TableRow key={instance.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {instance.employee.firstName} {instance.employee.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{instance.employee.employeeCode}</div>
                          </div>
                        </TableCell>
                        <TableCell>{instance.template.name}</TableCell>
                        <TableCell>
                          {format(new Date(instance.startDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">
                              {completedTasks}/{totalTasks}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              instance.status
                            )}`}
                          >
                            {instance.status.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          {instance.completedAt
                            ? format(new Date(instance.completedAt), 'MMM dd, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Link href={`/dashboard/hr/onboarding/instances/${instance.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })}
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
