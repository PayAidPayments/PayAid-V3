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

interface PayrollCycle {
  id: string
  month: number
  year: number
  status: string
  runType: string
  _count: {
    payrollRuns: number
  }
  createdAt: string
}

export default function HRPayrollCyclesPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [yearFilter, setYearFilter] = useState<string>('')
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch } = useQuery<{
    cycles: PayrollCycle[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>({
    queryKey: ['payroll-cycles', page, statusFilter, yearFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (statusFilter) params.append('status', statusFilter)
      if (yearFilter) params.append('year', yearFilter)

      const response = await fetch(`/api/hr/payroll/cycles?${params}`)
      if (!response.ok) throw new Error('Failed to fetch payroll cycles')
      return response.json()
    },
  })

  const lockMutation = useMutation({
    mutationFn: async (cycleId: string) => {
      const response = await fetch(`/api/hr/payroll/cycles/${cycleId}/lock`, {
        method: 'PUT',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to lock cycle')
      }
      return response.json()
    },
    onSuccess: () => {
      refetch()
    },
  })

  const generateMutation = useMutation({
    mutationFn: async (cycleId: string) => {
      const response = await fetch(`/api/hr/payroll/cycles/${cycleId}/generate`, {
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate payroll')
      }
      return response.json()
    },
    onSuccess: (data) => {
      alert(`Generated ${data.payrollRuns.length} payroll runs`)
      refetch()
    },
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      LOCKED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      PAID: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleString('en-IN', { month: 'long' })
  }

  if (isLoading) {
    return <PageLoading message="Loading payroll cycles..." fullScreen={false} />
  }

  const cycles = data?.cycles || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Payroll Cycles</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage payroll cycles and generate payroll</p>
        </div>
        <Link href={`/hr/${tenantId}/Payroll/Cycles/New`}>
          <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Create Cycle</Button>
        </Link>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
              >
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="LOCKED">Locked</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
              >
                <option value="">All Years</option>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => refetch()} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Refresh</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">All Payroll Cycles</CardTitle>
          <CardDescription className="dark:text-gray-400">
            {pagination?.total || 0} total cycles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cycles.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="mb-4">No payroll cycles found</p>
              <Link href={`/hr/${tenantId}/Payroll/Cycles/New`}>
                <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Create Your First Cycle</Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="dark:text-gray-300">Period</TableHead>
                    <TableHead className="dark:text-gray-300">Type</TableHead>
                    <TableHead className="dark:text-gray-300">Payroll Runs</TableHead>
                    <TableHead className="dark:text-gray-300">Status</TableHead>
                    <TableHead className="dark:text-gray-300">Created</TableHead>
                    <TableHead className="dark:text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cycles.map((cycle) => (
                    <TableRow key={cycle.id} className="dark:border-gray-700">
                      <TableCell className="font-medium dark:text-gray-100">
                        {getMonthName(cycle.month)} {cycle.year}
                      </TableCell>
                      <TableCell className="capitalize dark:text-gray-300">{cycle.runType.toLowerCase()}</TableCell>
                      <TableCell className="dark:text-gray-300">{cycle._count.payrollRuns}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(cycle.status)}>
                          {cycle.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="dark:text-gray-300">{format(new Date(cycle.createdAt), 'PPp')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/hr/${tenantId}/Payroll/Cycles/${cycle.id}`}>
                            <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                              View
                            </Button>
                          </Link>
                          {cycle.status === 'DRAFT' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generateMutation.mutate(cycle.id)}
                              disabled={generateMutation.isPending}
                              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              Generate
                            </Button>
                          )}
                          {cycle.status === 'IN_PROGRESS' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => lockMutation.mutate(cycle.id)}
                              disabled={lockMutation.isPending}
                              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              Lock
                            </Button>
                          )}
                        </div>
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
