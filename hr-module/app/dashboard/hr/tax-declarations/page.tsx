'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

interface TaxDeclaration {
  id: string
  financialYear: string
  declaredAmountInr: number
  approvedAmountInr?: number
  status: string
  employee: {
    id: string
    employeeCode: string
    firstName: string
    lastName: string
  }
  category: {
    id: string
    name: string
    code: string
  }
  _count: {
    proofDocuments: number
  }
  createdAt: string
}

export default function TaxDeclarationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [financialYearFilter, setFinancialYearFilter] = useState<string>('')
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch } = useQuery<{
    declarations: TaxDeclaration[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>({
    queryKey: ['tax-declarations', page, statusFilter, financialYearFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (statusFilter) params.append('status', statusFilter)
      if (financialYearFilter) params.append('financialYear', financialYearFilter)

      const response = await fetch(`/api/hr/tax-declarations?${params}`)
      if (!response.ok) throw new Error('Failed to fetch tax declarations')
      return response.json()
    },
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const declarations = data?.declarations || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tax Declarations</h1>
          <p className="mt-2 text-gray-600">Manage employee tax declarations</p>
        </div>
        <Link href="/dashboard/hr/tax-declarations/new">
          <Button>New Declaration</Button>
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
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Financial Year</label>
              <select
                value={financialYearFilter}
                onChange={(e) => setFinancialYearFilter(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 px-3"
              >
                <option value="">All Years</option>
                <option value="2024-25">2024-25</option>
                <option value="2025-26">2025-26</option>
                <option value="2026-27">2026-27</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => refetch()}>Refresh</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Declarations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tax Declarations</CardTitle>
          <CardDescription>{pagination?.total || 0} total declarations</CardDescription>
        </CardHeader>
        <CardContent>
          {declarations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No tax declarations found</p>
              <Link href="/dashboard/hr/tax-declarations/new">
                <Button>Create First Declaration</Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Financial Year</TableHead>
                    <TableHead>Declared Amount</TableHead>
                    <TableHead>Approved Amount</TableHead>
                    <TableHead>Proofs</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {declarations.map((decl) => (
                    <TableRow key={decl.id}>
                      <TableCell className="font-medium">
                        {decl.employee.employeeCode} - {decl.employee.firstName} {decl.employee.lastName}
                      </TableCell>
                      <TableCell>
                        {decl.category.name} ({decl.category.code})
                      </TableCell>
                      <TableCell>{decl.financialYear}</TableCell>
                      <TableCell>₹{Number(decl.declaredAmountInr).toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        {decl.approvedAmountInr
                          ? `₹${Number(decl.approvedAmountInr).toLocaleString('en-IN')}`
                          : '-'}
                      </TableCell>
                      <TableCell>{decl._count.proofDocuments}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(decl.status)}`}>
                          {decl.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/hr/tax-declarations/${decl.id}`}>
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
