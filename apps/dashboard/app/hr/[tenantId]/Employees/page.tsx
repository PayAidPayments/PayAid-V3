'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
// ModuleTopBar is now in layout.tsx
import { Users, Plus, RefreshCw, Download, Printer, AlertCircle } from 'lucide-react'

interface Employee {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  officialEmail: string
  status: string
  department?: { id: string; name: string }
  designation?: { id: string; name: string }
  location?: { id: string; name: string }
  joiningDate: string
  ctcAnnualInr?: number
}

export default function HREmployeesPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const token = useAuthStore((s) => s.token)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('')

  const { data, isLoading, isError, error, refetch } = useQuery<{
    employees: Employee[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>({
    queryKey: ['employees', tenantId, page, search, statusFilter, departmentFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)
      if (departmentFilter) params.append('departmentId', departmentFilter)

      const response = await fetch(`/api/hr/employees?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        throw new Error(errBody.error || errBody.message || 'Failed to fetch employees')
      }
      return response.json()
    },
    enabled: !!token,
  })

  const employees = data?.employees || []
  const pagination = data?.pagination

  return (
    <div className="w-full bg-gray-50 relative" style={{ zIndex: 1 }}>
      {/* ModuleTopBar is now in layout.tsx */}
      {/* Refresh button - moved to page content */}
      <div className="absolute top-20 right-6 z-10">
        <button 
          onClick={() => refetch()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
            <p className="mt-2 text-gray-600">Manage your workforce</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href="/api/hr/employees/export?format=csv" download target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </a>
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Link href={`/hr/${tenantId}/Employees/new`}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search employees..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="h-10 rounded-md border border-gray-300 bg-white text-gray-900 px-3 flex-1"
              />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                className="h-10 rounded-md border border-gray-300 bg-white text-gray-900 px-3"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="PROBATION">On Probation</option>
                <option value="NOTICE">Notice Period</option>
                <option value="EXITED">Exited</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Employees Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Employees</CardTitle>
            <CardDescription>View and manage all employees ({pagination?.total || 0} total)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : isError ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto h-10 w-10 text-amber-500 mb-4" />
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">Unable to load employees</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error?.message ?? 'Please sign in again or try later.'}</p>
                <Button variant="outline" onClick={() => refetch()}>Retry</Button>
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-4">No employees found</p>
                <Link href={`/hr/${tenantId}/Employees/new`}>
                  <Button variant="outline">Add your first employee</Button>
                </Link>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joining Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.employeeCode}</TableCell>
                        <TableCell>{employee.firstName} {employee.lastName}</TableCell>
                        <TableCell>{employee.officialEmail}</TableCell>
                        <TableCell>{employee.department?.name || '-'}</TableCell>
                        <TableCell>{employee.designation?.name || '-'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            employee.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            employee.status === 'ON_LEAVE' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {employee.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {employee.joiningDate ? format(new Date(employee.joiningDate), 'MMM dd, yyyy') : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/hr/${tenantId}/Employees/${employee.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
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
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                        disabled={page === pagination.totalPages}
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
    </div>
  )
}

