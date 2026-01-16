'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save, Trash2, Clock, User, Phone, Mail, MapPin, Video } from 'lucide-react'
import Link from 'next/link'

interface Appointment {
  id: string
  contactId?: string
  contactName: string
  contactEmail?: string
  contactPhone?: string
  serviceId?: string
  serviceName?: string
  assignedToId?: string
  assignedToName?: string
  appointmentDate: string
  startTime: string
  endTime?: string
  duration?: number
  status: string
  type?: string
  location?: string
  isOnline: boolean
  meetingLink?: string
  notes?: string
  amount?: number
  paymentStatus?: string
}

export default function AppointmentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { token } = useAuthStore()
  const appointmentId = params?.id as string
  
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)

  const [formData, setFormData] = useState({
    status: 'SCHEDULED',
    startTime: '',
    endTime: '',
    location: '',
    isOnline: false,
    meetingLink: '',
    notes: '',
  })

  useEffect(() => {
    if (appointmentId) {
      fetchAppointment()
    }
  }, [appointmentId])

  const fetchAppointment = async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAppointment(data.appointment)
        setFormData({
          status: data.appointment.status,
          startTime: data.appointment.startTime,
          endTime: data.appointment.endTime || '',
          location: data.appointment.location || '',
          isOnline: data.appointment.isOnline || false,
          meetingLink: data.appointment.meetingLink || '',
          notes: data.appointment.notes || '',
        })
      }
    } catch (error) {
      console.error('Failed to fetch appointment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setEditing(false)
        fetchAppointment()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update appointment')
      }
    } catch (error) {
      console.error('Failed to update appointment:', error)
      alert('Failed to update appointment')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this appointment?')) return

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        router.push('/dashboard/appointments')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete appointment')
      }
    } catch (error) {
      console.error('Failed to delete appointment:', error)
      alert('Failed to delete appointment')
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <PageLoading message="Loading appointment..." fullScreen={false} />
        </div>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">Appointment not found</p>
              <Link href="/dashboard/appointments">
                <Button variant="outline" className="mt-4">
                  Back to Appointments
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/appointments">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {appointment.contactName}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {new Date(appointment.appointmentDate).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <>
                <Button variant="outline" onClick={() => setEditing(true)}>
                  Edit
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          {/* Appointment Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Appointment Details</CardTitle>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                  {appointment.status.replace('_', ' ')}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="NO_SHOW">No Show</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isOnline"
                        checked={formData.isOnline}
                        onChange={(e) => setFormData({ ...formData, isOnline: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="isOnline">Online Meeting</Label>
                    </div>
                    {formData.isOnline && (
                      <Input
                        id="meetingLink"
                        value={formData.meetingLink}
                        onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                        placeholder="Meeting link"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdate} disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Time</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {formatTime(appointment.startTime)}
                          {appointment.endTime && ` - ${formatTime(appointment.endTime)}`}
                        </p>
                      </div>
                    </div>
                    {appointment.serviceName && (
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Service</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {appointment.serviceName}
                          </p>
                        </div>
                      </div>
                    )}
                    {appointment.assignedToName && (
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Assigned To</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {appointment.assignedToName}
                          </p>
                        </div>
                      </div>
                    )}
                    {appointment.location && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {appointment.location}
                          </p>
                        </div>
                      </div>
                    )}
                    {appointment.isOnline && appointment.meetingLink && (
                      <div className="flex items-center gap-3">
                        <Video className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Meeting Link</p>
                          <a
                            href={appointment.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            Join Meeting
                          </a>
                        </div>
                      </div>
                    )}
                    {appointment.amount && (
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            ₹{appointment.amount.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {appointment.notes && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Notes</p>
                      <p className="text-gray-900 dark:text-gray-100">{appointment.notes}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {appointment.contactName}
                  </p>
                </div>
                {appointment.contactEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <a
                      href={`mailto:${appointment.contactEmail}`}
                      className="text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      {appointment.contactEmail}
                    </a>
                  </div>
                )}
                {appointment.contactPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <a
                      href={`tel:${appointment.contactPhone}`}
                      className="text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      {appointment.contactPhone}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

