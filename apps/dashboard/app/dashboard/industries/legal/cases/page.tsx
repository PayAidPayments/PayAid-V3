'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LegalCase {
  id: string
  caseNumber: string
  clientName: string
  caseTitle: string
  caseType?: string
  courtName?: string
  filingDate?: string
  status: string
  assignedTo?: string
  courtDates: any[]
  matters: any[]
  documents: any[]
}

export default function LegalCasesPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const { data, isLoading } = useQuery<{ cases: LegalCase[] }>({
    queryKey: ['legal-cases', selectedStatus],
    queryFn: async () => {
      const url = selectedStatus === 'all'
        ? '/api/industries/legal/cases'
        : `/api/industries/legal/cases?status=${selectedStatus}`
      const response = await apiRequest(url)
      if (!response.ok) throw new Error('Failed to fetch cases')
      return response.json()
    },
  })

  const cases = data?.cases || []

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      CLOSED: 'bg-gray-100 text-gray-800',
      WON: 'bg-green-100 text-green-800',
      LOST: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Legal Cases</h1>
        <p className="mt-2 text-gray-600">Manage legal cases and client matters</p>
      </div>

      {/* Status Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="all">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="CLOSED">Closed</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
          </select>
        </CardContent>
      </Card>

      {/* Cases List */}
      {isLoading ? (
        <div className="text-center py-8">Loading cases...</div>
      ) : cases.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No cases found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {cases.map((legalCase) => (
            <Card key={legalCase.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{legalCase.caseTitle}</CardTitle>
                    <CardDescription>
                      Case #: {legalCase.caseNumber} | 
                      Client: {legalCase.clientName}
                      {legalCase.caseType && ` | Type: ${legalCase.caseType}`}
                      {legalCase.courtName && ` | Court: ${legalCase.courtName}`}
                    </CardDescription>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(legalCase.status)}`}>
                    {legalCase.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {legalCase.filingDate && (
                    <p><strong>Filing Date:</strong> {new Date(legalCase.filingDate).toLocaleDateString()}</p>
                  )}
                  {legalCase.assignedTo && <p><strong>Assigned To:</strong> {legalCase.assignedTo}</p>}
                  <p><strong>Court Dates:</strong> {legalCase.courtDates.length}</p>
                  <p><strong>Matters:</strong> {legalCase.matters.length}</p>
                  <p><strong>Documents:</strong> {legalCase.documents.length}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

