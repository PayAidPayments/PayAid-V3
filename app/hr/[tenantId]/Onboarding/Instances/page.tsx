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
  const params = useParams()
  const tenantId = params.tenantId as string
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
      IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  if (isLoading) {
    return <PageLoading message="Loading onboarding instances..." fullScreen={false} />
  }

  const instances = data?.instances || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Onboarding Instances</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Track employee onboarding progress</p>
        </div>
        <Link href={`/hr/${tenantId}/Onboarding/Instances/New`}>
          <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Start Onboarding</Button>
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
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <Button onClick={() => refetch()} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Refresh</Button>
          </div>
        </CardContent>
      </Card>

      {/* Instances Table */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">All Onboarding Instances</CardTitle>
          <CardDescription className="dark:text-gray-400">
            {pagination?.total || 0} total instances
          </CardDescription>
        </CardHeader>
        <CardContent>
          {instances.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="mb-4">No onboarding instances found</p>
              <Link href={`/hr/${tenantId}/Onboarding/Instances/New`}>
                <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Start Onboarding</Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-700">
                    <TableHead className="dark:text-gray-300">Employee</TableHead>
                    <TableHead className="dark:text-gray-300">Template</TableHead>
                    <TableHead className="dark:text-gray-300">Start Date</TableHead>
                    <TableHead className="dark:text-gray-300">Tasks Progress</TableHead>
                    <TableHead className="dark:text-gray-300">Status</TableHead>
                    <TableHead className="dark:text-gray-300">Completed At</TableHead>
                    <TableHead className="dark:text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instances.map((instance) => {
                    const completedTasks = instance.tasks.filter((t) => t.status === 'COMPLETED').length
                    const totalTasks = instance.tasks.length
                    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

                    return (
                      <TableRow key={instance.id} className="dark:border-gray-700 dark:hover:bg-gray-700/50">
                        <TableCell>
                          <div>
                            <div className="font-medium dark:text-gray-200">
                              {instance.employee.firstName} {instance.employee.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{instance.employee.employeeCode}</div>
                          </div>
                        </TableCell>
                        <TableCell className="dark:text-gray-200">{instance.template.name}</TableCell>
                        <TableCell className="dark:text-gray-200">
                          {format(new Date(instance.startDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
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
                        <TableCell className="dark:text-gray-200">
                          {instance.completedAt
                            ? format(new Date(instance.completedAt), 'MMM dd, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Link href={`/hr/${tenantId}/Onboarding/Instances/${instance.id}`}>
                            <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
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
