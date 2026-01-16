'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageLoading } from '@/components/ui/loading'

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
  const params = useParams()
  const tenantId = params.tenantId as string
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
      NEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      SCREENING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      SHORTLISTED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      INTERVIEW: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      OFFERED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      HIRED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  if (isLoading) {
    return <PageLoading message="Loading candidates..." fullScreen={false} />
  }

  const candidates = data?.candidates || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Candidates</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage candidate pool and applications</p>
        </div>
        <Link href={`/hr/${tenantId}/Hiring/Candidates/New`}>
          <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Add Candidate</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email..."
                className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
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
              <Button onClick={() => refetch()} className="w-full dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidates Table */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">All Candidates</CardTitle>
          <CardDescription className="dark:text-gray-400">
            {pagination?.total || 0} total candidates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {candidates.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="mb-4">No candidates found</p>
              <Link href={`/hr/${tenantId}/Hiring/Candidates/New`}>
                <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Add Your First Candidate</Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-700">
                    <TableHead className="dark:text-gray-300">Name</TableHead>
                    <TableHead className="dark:text-gray-300">Email</TableHead>
                    <TableHead className="dark:text-gray-300">Phone</TableHead>
                    <TableHead className="dark:text-gray-300">Current Company</TableHead>
                    <TableHead className="dark:text-gray-300">Expected CTC</TableHead>
                    <TableHead className="dark:text-gray-300">Applications</TableHead>
                    <TableHead className="dark:text-gray-300">Interviews</TableHead>
                    <TableHead className="dark:text-gray-300">Status</TableHead>
                    <TableHead className="dark:text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((candidate) => (
                    <TableRow key={candidate.id} className="dark:border-gray-700 dark:hover:bg-gray-700/50">
                      <TableCell className="font-medium dark:text-gray-200">{candidate.fullName}</TableCell>
                      <TableCell className="dark:text-gray-200">{candidate.email}</TableCell>
                      <TableCell className="dark:text-gray-200">{candidate.phone}</TableCell>
                      <TableCell className="dark:text-gray-200">{candidate.currentCompany || '-'}</TableCell>
                      <TableCell className="dark:text-gray-200">
                        {candidate.expectedCtcInr
                          ? `₹${Number(candidate.expectedCtcInr).toLocaleString('en-IN')}`
                          : '-'}
                      </TableCell>
                      <TableCell className="dark:text-gray-200">{candidate._count.candidateJobs}</TableCell>
                      <TableCell className="dark:text-gray-200">{candidate._count.interviewRounds}</TableCell>
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
                        <Link href={`/hr/${tenantId}/Hiring/Candidates/${candidate.id}`}>
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
