'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface HealthcareLabTest {
  id: string
  patientId: string
  patient: {
    id: string
    patientId: string
    fullName: string
  }
  testName: string
  testType?: string
  orderedDate: string
  sampleDate?: string
  resultDate?: string
  results?: any
  status: string
  labName?: string
  notes?: string
}

export default function HealthcareLabTestsPage() {
  const queryClient = useQueryClient()
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const { data, isLoading } = useQuery<{ labTests: HealthcareLabTest[] }>({
    queryKey: ['healthcare-lab-tests', selectedStatus],
    queryFn: async () => {
      const url = selectedStatus === 'all'
        ? '/api/industries/healthcare/lab-tests'
        : `/api/industries/healthcare/lab-tests?status=${selectedStatus}`
      const response = await apiRequest(url)
      if (!response.ok) throw new Error('Failed to fetch lab tests')
      return response.json()
    },
  })

  const updateTestMutation = useMutation({
    mutationFn: async ({ id, results, status, resultDate }: { id: string; results?: any; status?: string; resultDate?: string }) => {
      const response = await apiRequest(`/api/industries/healthcare/lab-tests`, {
        method: 'PATCH',
        body: JSON.stringify({ id, results, status, resultDate }),
      })
      if (!response.ok) throw new Error('Failed to update lab test')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthcare-lab-tests'] })
    },
  })

  const labTests = data?.labTests || []

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ORDERED: 'bg-yellow-100 text-yellow-800',
      SAMPLE_COLLECTED: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lab Tests</h1>
        <p className="mt-2 text-gray-600">Manage patient lab tests and results</p>
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
            <option value="ORDERED">Ordered</option>
            <option value="SAMPLE_COLLECTED">Sample Collected</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </CardContent>
      </Card>

      {/* Lab Tests List */}
      {isLoading ? (
        <div className="text-center py-8">Loading lab tests...</div>
      ) : labTests.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No lab tests found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {labTests.map((test) => (
            <Card key={test.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{test.testName}</CardTitle>
                    <CardDescription>
                      Patient: {test.patient.fullName} | 
                      Ordered: {new Date(test.orderedDate).toLocaleDateString()}
                      {test.labName && ` | Lab: ${test.labName}`}
                    </CardDescription>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(test.status)}`}>
                    {test.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {test.testType && <p><strong>Type:</strong> {test.testType}</p>}
                  {test.sampleDate && <p><strong>Sample Date:</strong> {new Date(test.sampleDate).toLocaleDateString()}</p>}
                  {test.resultDate && <p><strong>Result Date:</strong> {new Date(test.resultDate).toLocaleDateString()}</p>}
                  {test.results && (
                    <div>
                      <strong>Results:</strong>
                      <pre className="mt-1 p-2 bg-gray-50 rounded text-sm">{JSON.stringify(test.results, null, 2)}</pre>
                    </div>
                  )}
                  {test.notes && <p><strong>Notes:</strong> {test.notes}</p>}
                  {test.status === 'ORDERED' && (
                    <Button
                      onClick={() => updateTestMutation.mutate({ 
                        id: test.id, 
                        status: 'COMPLETED',
                        resultDate: new Date().toISOString()
                      })}
                      className="mt-2"
                    >
                      Mark as Completed
                    </Button>
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

