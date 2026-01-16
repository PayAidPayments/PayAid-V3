'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface RealEstateLead {
  id: string
  leadType: string
  propertyType?: string
  budget?: number
  location?: string
  requirements?: string
  status: string
  source?: string
  assignedTo?: string
  siteVisits: any[]
  createdAt: string
}

export default function RealEstateLeadsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [leadType, setLeadType] = useState<string>('all')

  const { data, isLoading } = useQuery<{ leads: RealEstateLead[] }>({
    queryKey: ['real-estate-leads', selectedStatus, leadType],
    queryFn: async () => {
      let url = '/api/industries/real-estate/leads'
      const params = new URLSearchParams()
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      if (leadType !== 'all') params.append('leadType', leadType)
      if (params.toString()) url += '?' + params.toString()
      
      const response = await apiRequest(url)
      if (!response.ok) throw new Error('Failed to fetch leads')
      return response.json()
    },
  })

  const leads = data?.leads || []

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-blue-100 text-blue-800',
      CONTACTED: 'bg-yellow-100 text-yellow-800',
      QUALIFIED: 'bg-green-100 text-green-800',
      CONVERTED: 'bg-purple-100 text-purple-800',
      LOST: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Real Estate Leads</h1>
        <p className="mt-2 text-gray-600">Manage property leads and inquiries</p>
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
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="CONVERTED">Converted</option>
            <option value="LOST">Lost</option>
          </select>
          <select
            value={leadType}
            onChange={(e) => setLeadType(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="all">All Types</option>
            <option value="BUYER">Buyer</option>
            <option value="TENANT">Tenant</option>
            <option value="SELLER">Seller</option>
            <option value="LESSOR">Lessor</option>
          </select>
        </CardContent>
      </Card>

      {/* Leads List */}
      {isLoading ? (
        <div className="text-center py-8">Loading leads...</div>
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No leads found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {leads.map((lead) => (
            <Card key={lead.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{lead.leadType} Lead</CardTitle>
                    <CardDescription>
                      {lead.propertyType && `Property: ${lead.propertyType} | `}
                      {lead.location && `Location: ${lead.location} | `}
                      {lead.budget && `Budget: ₹${lead.budget.toLocaleString()} | `}
                      Site Visits: {lead.siteVisits.length}
                    </CardDescription>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lead.requirements && (
                    <div>
                      <strong>Requirements:</strong>
                      <p className="text-gray-600">{lead.requirements}</p>
                    </div>
                  )}
                  {lead.source && <p><strong>Source:</strong> {lead.source}</p>}
                  {lead.assignedTo && <p><strong>Assigned To:</strong> {lead.assignedTo}</p>}
                  <p className="text-sm text-gray-500">
                    Created: {new Date(lead.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

