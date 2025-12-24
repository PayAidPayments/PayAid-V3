'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { ModuleGate } from '@/components/modules/ModuleGate'

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

export default function PayrollCyclesPage() {
  const router = useRouter()
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
      DRAFT: 'bg-gray-100 text-gray-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      LOCKED: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleString('en-IN', { month: 'long' })
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const cycles = data?.cycles || []
  const pagination = data?.pagination

  return (
    <ModuleGate module="hr">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Cycles</h1>
          <p className="mt-2 text-gray-600">Manage payroll cycles and generate payroll</p>
        </div>
        <Link href="/dashboard/hr/payroll/cycles/new">
          <Button>Create Cycle</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 px-3"
              >
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="LOCKED">Locked</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 px-3"
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
              <Button onClick={() => refetch()}>Refresh</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cycles Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Payroll Cycles</CardTitle>
          <CardDescription>
            {pagination?.total || 0} total cycles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cycles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No payroll cycles found</p>
              <Link href="/dashboard/hr/payroll/cycles/new">
                <Button>Create Your First Cycle</Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Payroll Runs</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cycles.map((cycle) => (
                    <TableRow key={cycle.id}>
                      <TableCell className="font-medium">
                        {getMonthName(cycle.month)} {cycle.year}
                      </TableCell>
                      <TableCell className="capitalize">{cycle.runType.toLowerCase()}</TableCell>
                      <TableCell>{cycle._count.payrollRuns}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cycle.status)}`}>
                          {cycle.status.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell>{format(new Date(cycle.createdAt), 'PPp')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/dashboard/hr/payroll/cycles/${cycle.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                          {cycle.status === 'DRAFT' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generateMutation.mutate(cycle.id)}
                              disabled={generateMutation.isPending}
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
    </ModuleGate>
  )
}
