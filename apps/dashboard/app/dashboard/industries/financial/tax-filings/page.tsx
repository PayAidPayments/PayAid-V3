'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface FinancialTaxFiling {
  id: string
  clientId: string
  client: {
    id: string
    clientName: string
  }
  financialYear: string
  assessmentYear: string
  filingType: string
  dueDate: string
  filingDate?: string
  status: string
  taxAmount?: number
  refundAmount?: number
}

export default function FinancialTaxFilingsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [financialYear, setFinancialYear] = useState<string>('')

  const { data, isLoading } = useQuery<{ taxFilings: FinancialTaxFiling[] }>({
    queryKey: ['financial-tax-filings', selectedStatus, financialYear],
    queryFn: async () => {
      let url = '/api/industries/financial/tax-filings'
      const params = new URLSearchParams()
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      if (financialYear) params.append('financialYear', financialYear)
      if (params.toString()) url += '?' + params.toString()
      
      const response = await apiRequest(url)
      if (!response.ok) throw new Error('Failed to fetch tax filings')
      return response.json()
    },
  })

  const taxFilings = data?.taxFilings || []

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      FILED: 'bg-blue-100 text-blue-800',
      ASSESSED: 'bg-green-100 text-green-800',
      REFUND_RECEIVED: 'bg-purple-100 text-purple-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tax Filings</h1>
        <p className="mt-2 text-gray-600">Manage client tax filings and compliance</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="FILED">Filed</option>
            <option value="ASSESSED">Assessed</option>
            <option value="REFUND_RECEIVED">Refund Received</option>
          </select>
          <input
            type="text"
            placeholder="Financial Year (e.g., 2023-24)"
            value={financialYear}
            onChange={(e) => setFinancialYear(e.target.value)}
            className="px-4 py-2 border rounded-md"
          />
        </CardContent>
      </Card>

      {/* Tax Filings List */}
      {isLoading ? (
        <div className="text-center py-8">Loading tax filings...</div>
      ) : taxFilings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No tax filings found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {taxFilings.map((filing) => (
            <Card key={filing.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{filing.client.clientName}</CardTitle>
                    <CardDescription>
                      FY: {filing.financialYear} | 
                      AY: {filing.assessmentYear} | 
                      Type: {filing.filingType} | 
                      Due: {new Date(filing.dueDate).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(filing.status)}`}>
                    {filing.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filing.filingDate && (
                    <p><strong>Filing Date:</strong> {new Date(filing.filingDate).toLocaleDateString()}</p>
                  )}
                  {filing.taxAmount && <p><strong>Tax Amount:</strong> ₹{filing.taxAmount}</p>}
                  {filing.refundAmount && <p><strong>Refund Amount:</strong> ₹{filing.refundAmount}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

