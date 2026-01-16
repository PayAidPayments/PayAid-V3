'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Plus, Clock, User, Phone, Mail, MapPin, Video } from 'lucide-react'
import Link from 'next/link'
import { CalendarView } from '@/components/appointments/CalendarView'
import { PageLoading } from '@/components/ui/loading'

interface Appointment {
  id: string
  contactName: string
  contactEmail?: string
  contactPhone?: string
  serviceName?: string
  assignedToName?: string
  appointmentDate: string
  startTime: string
  endTime?: string
  status: string
  location?: string
  isOnline: boolean
  meetingLink?: string
  notes?: string
}

export default function AppointmentsPage() {
  const { token } = useAuthStore()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchAppointments()
  }, [selectedDate])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/appointments?date=${selectedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments || [])
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      COMPLETED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      NO_SHOW: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Appointments</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your appointments and schedule meetings
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={view === 'list' ? 'default' : 'outline'}
              onClick={() => setView('list')}
            >
              List
            </Button>
            <Button
              variant={view === 'calendar' ? 'default' : 'outline'}
              onClick={() => setView('calendar')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </Button>
            <Link href="/dashboard/appointments/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Appointment
              </Button>
            </Link>
          </div>
        </div>

        {/* Date Filter */}
        <div className="mb-6">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* Calendar or List View */}
        {view === 'calendar' ? (
          <CalendarView appointments={appointments} loading={loading} token={token || ''} />
        ) : (
          <>
            {/* Appointments List */}
            {loading ? (
              <PageLoading message="Loading appointments..." fullScreen={false} />
            ) : appointments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No appointments scheduled
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get started by creating your first appointment
              </p>
              <Link href="/dashboard/appointments/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Appointment
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {appointment.contactName}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status.replace('_', ' ')}
                        </span>
                      </div>

                      {appointment.serviceName && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Service: {appointment.serviceName}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {formatTime(appointment.startTime)}
                          {appointment.endTime && ` - ${formatTime(appointment.endTime)}`}
                        </div>
                        {appointment.assignedToName && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {appointment.assignedToName}
                          </div>
                        )}
                        {appointment.contactEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {appointment.contactEmail}
                          </div>
                        )}
                        {appointment.contactPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {appointment.contactPhone}
                          </div>
                        )}
                        {appointment.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {appointment.location}
                          </div>
                        )}
                        {appointment.isOnline && appointment.meetingLink && (
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4" />
                            <a
                              href={appointment.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 dark:text-purple-400 hover:underline"
                            >
                              Join Meeting
                            </a>
                          </div>
                        )}
                      </div>

                      {appointment.notes && (
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                          {appointment.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/appointments/${appointment.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

