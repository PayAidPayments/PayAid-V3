'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface CustomReport {
  id: string
  name: string
  description?: string
  reportType: string
  scheduleEnabled: boolean
  scheduleFrequency?: string
  createdAt: string
}

export default function CustomReportsPage() {
  const [reportTypeFilter, setReportTypeFilter] = useState<string>('')

  const { data, isLoading } = useQuery<{ reports: CustomReport[] }>({
    queryKey: ['custom-reports', reportTypeFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (reportTypeFilter) params.append('reportType', reportTypeFilter)

      const response = await fetch(`/api/reports/custom?${params}`)
      if (!response.ok) throw new Error('Failed to fetch custom reports')
      return response.json()
    },
  })

  const reports = data?.reports || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Custom Reports</h1>
          <p className="mt-2 text-gray-600">Create and manage custom reports with scheduling</p>
        </div>
        <Button>Create Report</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Report Type:</label>
            <select
              value={reportTypeFilter}
              onChange={(e) => setReportTypeFilter(e.target.value)}
              className="h-10 rounded-md border border-gray-300 px-3"
            >
              <option value="">All Types</option>
              <option value="sales">Sales</option>
              <option value="marketing">Marketing</option>
              <option value="finance">Finance</option>
              <option value="hr">HR</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
          <CardDescription>{reports.length} total reports</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">Loading...</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No custom reports found</p>
              <Button>Create Your First Report</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.name}</TableCell>
                    <TableCell className="capitalize">{report.reportType}</TableCell>
                    <TableCell>
                      {report.scheduleEnabled ? (
                        <span className="text-green-600">✓ Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{report.scheduleFrequency || '-'}</TableCell>
                    <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
