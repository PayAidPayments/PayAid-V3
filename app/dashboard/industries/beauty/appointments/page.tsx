'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface BeautyAppointment {
  id: string
  customerName: string
  customerPhone?: string
  serviceName: string
  staffId?: string
  appointmentDate: string
  appointmentTime?: string
  duration?: number
  status: string
  amount?: number
  paymentStatus: string
}

export default function BeautyAppointmentsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [date, setDate] = useState<string>('')

  const { data, isLoading } = useQuery<{ appointments: BeautyAppointment[] }>({
    queryKey: ['beauty-appointments', selectedStatus, date],
    queryFn: async () => {
      let url = '/api/industries/beauty/appointments'
      const params = new URLSearchParams()
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      if (date) params.append('date', date)
      if (params.toString()) url += '?' + params.toString()
      
      const response = await apiRequest(url)
      if (!response.ok) throw new Error('Failed to fetch appointments')
      return response.json()
    },
  })

  const appointments = data?.appointments || []

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: 'bg-blue-100 text-blue-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      NO_SHOW: 'bg-orange-100 text-orange-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Beauty Appointments</h1>
        <p className="mt-2 text-gray-600">Manage beauty and wellness appointments</p>
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
            <option value="SCHEDULED">Scheduled</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No Show</option>
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-2 border rounded-md"
          />
        </CardContent>
      </Card>

      {/* Appointments List */}
      {isLoading ? (
        <div className="text-center py-8">Loading appointments...</div>
      ) : appointments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No appointments found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{appointment.customerName}</CardTitle>
                    <CardDescription>
                      Service: {appointment.serviceName} | 
                      Date: {new Date(appointment.appointmentDate).toLocaleDateString()}
                      {appointment.appointmentTime && ` | Time: ${appointment.appointmentTime}`}
                    </CardDescription>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(appointment.status)}`}>
                    {appointment.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {appointment.customerPhone && <p><strong>Phone:</strong> {appointment.customerPhone}</p>}
                  {appointment.duration && <p><strong>Duration:</strong> {appointment.duration} minutes</p>}
                  {appointment.amount && <p><strong>Amount:</strong> ₹{appointment.amount}</p>}
                  <p><strong>Payment:</strong> {appointment.paymentStatus}</p>
                  {appointment.staffId && <p><strong>Staff ID:</strong> {appointment.staffId}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

