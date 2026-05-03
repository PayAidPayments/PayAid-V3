'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

interface Candidate {
  id: string
  fullName: string
  email: string
  phone: string
  source?: string
  currentCompany?: string
  expectedCtcInr?: number
  status: string
  _count: {
    candidateJobs: number
    interviewRounds: number
  }
  createdAt: string
}

export default function CandidatesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch } = useQuery<{
    candidates: Candidate[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>({
    queryKey: ['candidates', page, statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (statusFilter) params.append('status', statusFilter)
      if (search) params.append('search', search)

      const response = await fetch(`/api/hr/candidates?${params}`)
      if (!response.ok) throw new Error('Failed to fetch candidates')
      return response.json()
    },
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-blue-100 text-blue-800',
      SCREENING: 'bg-yellow-100 text-yellow-800',
      SHORTLISTED: 'bg-green-100 text-green-800',
      INTERVIEW: 'bg-purple-100 text-purple-800',
      OFFERED: 'bg-orange-100 text-orange-800',
      HIRED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const candidates = data?.candidates || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Candidates</h1>
          <p className="mt-2 text-gray-600">Manage candidate pool and applications</p>
        </div>
        <Link href="/dashboard/hr/hiring/candidates/new">
          <Button>Add Candidate</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email..."
                className="w-full h-10 rounded-md border border-gray-300 px-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 px-3"
              >
                <option value="">All Status</option>
                <option value="NEW">New</option>
                <option value="SCREENING">Screening</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="INTERVIEW">Interview</option>
                <option value="OFFERED">Offered</option>
                <option value="HIRED">Hired</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => refetch()} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidates Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Candidates</CardTitle>
          <CardDescription>
            {pagination?.total || 0} total candidates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {candidates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No candidates found</p>
              <Link href="/dashboard/hr/hiring/candidates/new">
                <Button>Add Your First Candidate</Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Current Company</TableHead>
                    <TableHead>Expected CTC</TableHead>
                    <TableHead>Applications</TableHead>
                    <TableHead>Interviews</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell className="font-medium">{candidate.fullName}</TableCell>
                      <TableCell>{candidate.email}</TableCell>
                      <TableCell>{candidate.phone}</TableCell>
                      <TableCell>{candidate.currentCompany || '-'}</TableCell>
                      <TableCell>
                        {candidate.expectedCtcInr
                          ? `₹${Number(candidate.expectedCtcInr).toLocaleString('en-IN')}`
                          : '-'}
                      </TableCell>
                      <TableCell>{candidate._count.candidateJobs}</TableCell>
                      <TableCell>{candidate._count.interviewRounds}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            candidate.status
                          )}`}
                        >
                          {candidate.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/hr/hiring/candidates/${candidate.id}`}>
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
