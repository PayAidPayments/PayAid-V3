'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AutomotiveJobCard {
  id: string
  jobCardNumber: string
  customerName: string
  vehicleNumber: string
  serviceType: string
  issues?: string
  workDescription?: string
  estimatedCost?: number
  actualCost?: number
  status: string
  assignedTo?: string
  startDate?: string
  completionDate?: string
}

export default function AutomotiveJobCardsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const { data, isLoading } = useQuery<{ jobCards: AutomotiveJobCard[] }>({
    queryKey: ['automotive-job-cards', selectedStatus],
    queryFn: async () => {
      const url = selectedStatus === 'all'
        ? '/api/industries/automotive/job-cards'
        : `/api/industries/automotive/job-cards?status=${selectedStatus}`
      const response = await apiRequest(url)
      if (!response.ok) throw new Error('Failed to fetch job cards')
      return response.json()
    },
  })

  const jobCards = data?.jobCards || []

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      DELIVERED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Job Cards</h1>
        <p className="mt-2 text-gray-600">Manage automotive service job cards</p>
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
            <option value="COMPLETED">Completed</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </CardContent>
      </Card>

      {/* Job Cards List */}
      {isLoading ? (
        <div className="text-center py-8">Loading job cards...</div>
      ) : jobCards.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No job cards found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {jobCards.map((jobCard) => (
            <Card key={jobCard.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Job Card #{jobCard.jobCardNumber}</CardTitle>
                    <CardDescription>
                      Customer: {jobCard.customerName} | 
                      Vehicle: {jobCard.vehicleNumber} | 
                      Service: {jobCard.serviceType}
                    </CardDescription>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(jobCard.status)}`}>
                    {jobCard.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {jobCard.issues && (
                    <div>
                      <strong>Issues:</strong>
                      <p className="text-gray-600">{jobCard.issues}</p>
                    </div>
                  )}
                  {jobCard.workDescription && (
                    <div>
                      <strong>Work Description:</strong>
                      <p className="text-gray-600">{jobCard.workDescription}</p>
                    </div>
                  )}
                  {jobCard.estimatedCost && <p><strong>Estimated Cost:</strong> ₹{jobCard.estimatedCost}</p>}
                  {jobCard.actualCost && <p><strong>Actual Cost:</strong> ₹{jobCard.actualCost}</p>}
                  {jobCard.assignedTo && <p><strong>Assigned To:</strong> {jobCard.assignedTo}</p>}
                  {jobCard.startDate && (
                    <p><strong>Start Date:</strong> {new Date(jobCard.startDate).toLocaleDateString()}</p>
                  )}
                  {jobCard.completionDate && (
                    <p><strong>Completion Date:</strong> {new Date(jobCard.completionDate).toLocaleDateString()}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

