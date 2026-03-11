'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
}

interface HealthcarePrescription {
  id: string
  patientId: string
  patient: {
    id: string
    patientId: string
    fullName: string
    phone?: string
  }
  doctorName: string
  prescriptionDate: string
  medications: Medication[]
  instructions?: string
  followUpDate?: string
  status: string
  createdAt: string
}

export default function HealthcarePrescriptionsPage() {
  const queryClient = useQueryClient()
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [patientId, setPatientId] = useState<string>('')

  const { data, isLoading } = useQuery<{ prescriptions: HealthcarePrescription[] }>({
    queryKey: ['healthcare-prescriptions', selectedStatus, patientId],
    queryFn: async () => {
      let url = '/api/industries/healthcare/prescriptions'
      const params = new URLSearchParams()
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      if (patientId) params.append('patientId', patientId)
      if (params.toString()) url += '?' + params.toString()
      
      const response = await apiRequest(url)
      if (!response.ok) throw new Error('Failed to fetch prescriptions')
      return response.json()
    },
  })

  const prescriptions = data?.prescriptions || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Healthcare Prescriptions</h1>
        <p className="mt-2 text-gray-600">Manage patient prescriptions and medications</p>
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
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <input
            type="text"
            placeholder="Filter by Patient ID"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="px-4 py-2 border rounded-md flex-1"
          />
        </CardContent>
      </Card>

      {/* Prescriptions List */}
      {isLoading ? (
        <div className="text-center py-8">Loading prescriptions...</div>
      ) : prescriptions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No prescriptions found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {prescriptions.map((prescription) => (
            <Card key={prescription.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{prescription.patient.fullName}</CardTitle>
                    <CardDescription>
                      Patient ID: {prescription.patient.patientId} | 
                      Doctor: {prescription.doctorName} | 
                      Date: {new Date(prescription.prescriptionDate).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    prescription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    prescription.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {prescription.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <h4 className="font-semibold mb-2">Medications:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {prescription.medications.map((med, idx) => (
                        <li key={idx}>
                          {med.name} - {med.dosage}, {med.frequency}, {med.duration}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {prescription.instructions && (
                    <div>
                      <h4 className="font-semibold">Instructions:</h4>
                      <p className="text-gray-600">{prescription.instructions}</p>
                    </div>
                  )}
                  {prescription.followUpDate && (
                    <div>
                      <h4 className="font-semibold">Follow-up Date:</h4>
                      <p>{new Date(prescription.followUpDate).toLocaleDateString()}</p>
                    </div>
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

