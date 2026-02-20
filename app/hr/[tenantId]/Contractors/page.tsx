'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { Briefcase, Plus, RefreshCw, IndianRupee, FileText, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'

interface Contractor {
  id: string
  contractorCode: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: string
  startDate: string
  endDate?: string
  monthlyRate?: number
  tdsApplicable: boolean
  tdsRate?: number
  panNumber?: string
  department?: { id: string; name: string }
  project?: string
}

export default function HRContractorsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data, isLoading, refetch } = useQuery<{
    contractors: Contractor[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>({
    queryKey: ['contractors', tenantId, page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)

      const token = useAuthStore.getState().token
      const response = await fetch(`/api/hr/contractors?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        // Return mock data if API doesn't exist yet
        return {
          contractors: [],
          pagination: { page: 1, limit: 50, total: 0, totalPages: 1 },
        }
      }
      return response.json()
    },
  })

  const contractors = data?.contractors || []
  const pagination = data?.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 }

  return (
    <div className="w-full bg-gray-50 dark:bg-gray-900 relative" style={{ zIndex: 1 }}>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Contractors</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Manage contractors with automated TDS</p>
          </div>
          <Link href={`/hr/${tenantId}/Contractors/new`}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Contractor
            </Button>
          </Link>
        </div>

        {/* Info Banner */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Automated TDS Management</p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  TDS is automatically calculated and deducted based on contractor rates and PAN. Monthly TDS certificates (Form 16A) are auto-generated.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search contractors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 flex-1"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Contractors Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Contractors</CardTitle>
            <CardDescription>View and manage all contractors ({pagination.total} total)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : contractors.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="mb-4">No contractors found</p>
                <Link href={`/hr/${tenantId}/Contractors/new`}>
                  <Button variant="outline">Add your first contractor</Button>
                </Link>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Monthly Rate</TableHead>
                      <TableHead>TDS</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contractors.map((contractor) => (
                      <TableRow key={contractor.id}>
                        <TableCell className="font-medium">{contractor.contractorCode}</TableCell>
                        <TableCell>{contractor.firstName} {contractor.lastName}</TableCell>
                        <TableCell>{contractor.email}</TableCell>
                        <TableCell>{contractor.department?.name || '-'}</TableCell>
                        <TableCell>
                          {contractor.monthlyRate ? formatINRForDisplay(contractor.monthlyRate) : '-'}
                        </TableCell>
                        <TableCell>
                          {contractor.tdsApplicable ? (
                            <Badge variant="outline" className="text-xs">
                              {contractor.tdsRate || 10}%
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              contractor.status === 'ACTIVE' ? 'default' :
                              contractor.status === 'COMPLETED' ? 'secondary' :
                              'outline'
                            }
                          >
                            {contractor.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {contractor.startDate ? format(new Date(contractor.startDate), 'MMM dd, yyyy') : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/hr/${tenantId}/Contractors/${contractor.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
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
