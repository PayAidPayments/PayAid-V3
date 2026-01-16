'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface HospitalityBooking {
  id: string
  roomId: string
  room: {
    id: string
    roomNumber: string
    roomType: string
  }
  guestName: string
  guestPhone?: string
  checkInDate: string
  checkOutDate: string
  numberOfGuests: number
  totalNights?: number
  roomRate: number
  totalAmount?: number
  status: string
  paymentStatus: string
}

export default function HospitalityBookingsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [checkInDate, setCheckInDate] = useState<string>('')

  const { data, isLoading } = useQuery<{ bookings: HospitalityBooking[] }>({
    queryKey: ['hospitality-bookings', selectedStatus, checkInDate],
    queryFn: async () => {
      let url = '/api/industries/hospitality/bookings'
      const params = new URLSearchParams()
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      if (checkInDate) params.append('checkInDate', checkInDate)
      if (params.toString()) url += '?' + params.toString()
      
      const response = await apiRequest(url)
      if (!response.ok) throw new Error('Failed to fetch bookings')
      return response.json()
    },
  })

  const bookings = data?.bookings || []

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      CONFIRMED: 'bg-blue-100 text-blue-800',
      CHECKED_IN: 'bg-green-100 text-green-800',
      CHECKED_OUT: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Hotel Bookings</h1>
        <p className="mt-2 text-gray-600">Manage hotel room bookings and reservations</p>
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
            <option value="CONFIRMED">Confirmed</option>
            <option value="CHECKED_IN">Checked In</option>
            <option value="CHECKED_OUT">Checked Out</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <input
            type="date"
            value={checkInDate}
            onChange={(e) => setCheckInDate(e.target.value)}
            className="px-4 py-2 border rounded-md"
          />
        </CardContent>
      </Card>

      {/* Bookings List */}
      {isLoading ? (
        <div className="text-center py-8">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No bookings found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{booking.guestName}</CardTitle>
                    <CardDescription>
                      Room: {booking.room.roomNumber} ({booking.room.roomType}) | 
                      Check-in: {new Date(booking.checkInDate).toLocaleDateString()} | 
                      Check-out: {new Date(booking.checkOutDate).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Guests:</strong> {booking.numberOfGuests}</p>
                  {booking.totalNights && <p><strong>Nights:</strong> {booking.totalNights}</p>}
                  <p><strong>Room Rate:</strong> ₹{booking.roomRate}/night</p>
                  {booking.totalAmount && <p><strong>Total Amount:</strong> ₹{booking.totalAmount}</p>}
                  <p><strong>Payment Status:</strong> {booking.paymentStatus}</p>
                  {booking.guestPhone && <p><strong>Phone:</strong> {booking.guestPhone}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

