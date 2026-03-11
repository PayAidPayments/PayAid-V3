'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface EventManagementEvent {
  id: string
  eventName: string
  eventType?: string
  clientName: string
  eventDate: string
  eventTime?: string
  venue?: string
  numberOfGuests?: number
  budget?: number
  status: string
  eventManager?: string
  vendors: any[]
  guests: any[]
  budgets: any[]
  checklists: any[]
}

export default function EventManagementEventsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [eventDate, setEventDate] = useState<string>('')

  const { data, isLoading } = useQuery<{ events: EventManagementEvent[] }>({
    queryKey: ['event-management-events', selectedStatus, eventDate],
    queryFn: async () => {
      let url = '/api/industries/events/events'
      const params = new URLSearchParams()
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      if (eventDate) params.append('eventDate', eventDate)
      if (params.toString()) url += '?' + params.toString()
      
      const response = await apiRequest(url)
      if (!response.ok) throw new Error('Failed to fetch events')
      return response.json()
    },
  })

  const events = data?.events || []

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLANNING: 'bg-blue-100 text-blue-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Event Management</h1>
        <p className="mt-2 text-gray-600">Manage events and client bookings</p>
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
            <option value="PLANNING">Planning</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="px-4 py-2 border rounded-md"
          />
        </CardContent>
      </Card>

      {/* Events List */}
      {isLoading ? (
        <div className="text-center py-8">Loading events...</div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No events found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{event.eventName}</CardTitle>
                    <CardDescription>
                      Client: {event.clientName} | 
                      Date: {new Date(event.eventDate).toLocaleDateString()}
                      {event.eventTime && ` | Time: ${event.eventTime}`}
                      {event.venue && ` | Venue: ${event.venue}`}
                    </CardDescription>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {event.eventType && <p><strong>Type:</strong> {event.eventType}</p>}
                  {event.numberOfGuests && <p><strong>Guests:</strong> {event.numberOfGuests}</p>}
                  {event.budget && <p><strong>Budget:</strong> ₹{event.budget.toLocaleString()}</p>}
                  {event.eventManager && <p><strong>Event Manager:</strong> {event.eventManager}</p>}
                  <p><strong>Vendors:</strong> {event.vendors.length}</p>
                  <p><strong>Guests:</strong> {event.guests.length}</p>
                  <p><strong>Budget Items:</strong> {event.budgets.length}</p>
                  <p><strong>Checklist Items:</strong> {event.checklists.length}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

