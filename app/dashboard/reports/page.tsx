'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { getAuthHeaders } from '@/lib/api/client'

interface Report {
  id: string
  name: string
  description?: string
  type: string
  isActive: boolean
  isPublic: boolean
  createdAt: string
  lastRunAt?: string
  nextRunAt?: string
  template?: {
    id: string
    name: string
    category: string
  }
  createdBy: {
    id: string
    name: string
    email: string
  }
  _count: {
    scheduledRuns: number
  }
}

export default function ReportsPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery<{
    reports: Report[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>({
    queryKey: ['reports', page, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (typeFilter !== 'all') {
        params.append('type', typeFilter)
      }

      const response = await fetch(`/api/reports?${params}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch reports')
      return response.json()
    },
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'custom':
        return 'bg-blue-100 text-blue-800'
      case 'template':
        return 'bg-purple-100 text-purple-800'
      case 'scheduled':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const reports = data?.reports || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Create and manage custom reports</p>
        </div>
        <Link href="/dashboard/reports/new">
          <Button>New Report</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={typeFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setTypeFilter('all')}
        >
          All
        </Button>
        <Button
          variant={typeFilter === 'custom' ? 'default' : 'outline'}
          onClick={() => setTypeFilter('custom')}
        >
          Custom
        </Button>
        <Button
          variant={typeFilter === 'template' ? 'default' : 'outline'}
          onClick={() => setTypeFilter('template')}
        >
          Templates
        </Button>
        <Button
          variant={typeFilter === 'scheduled' ? 'default' : 'outline'}
          onClick={() => setTypeFilter('scheduled')}
        >
          Scheduled
        </Button>
      </div>

      {/* Reports Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No reports found. Create your first report to get started.</p>
            <Link href="/dashboard/reports/new">
              <Button className="mt-4">Create Report</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{report.name}</div>
                      {report.description && (
                        <div className="text-sm text-gray-500">{report.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(report.type)}>
                      {report.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {report.template ? (
                      <Badge variant="outline">{report.template.category}</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{report.createdBy.name}</div>
                      <div className="text-gray-500">{report.createdBy.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {report.isActive ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {report.lastRunAt ? (
                      format(new Date(report.lastRunAt), 'MMM dd, yyyy')
                    ) : (
                      <span className="text-gray-400">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {report.nextRunAt ? (
                      format(new Date(report.nextRunAt), 'MMM dd, yyyy')
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/reports/${report.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                      <Link href={`/dashboard/reports/${report.id}/execute`}>
                        <Button size="sm">
                          Run
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {((page - 1) * pagination.limit) + 1} to {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} reports
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
        </Card>
      )}
    </div>
  )
}

