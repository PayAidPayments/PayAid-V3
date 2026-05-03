'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Link from 'next/link'

interface RestaurantReservation {
  id: string
  reservationNumber: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  reservationDate: string
  partySize: number
  status: string
  specialRequests?: string
  table?: {
    id: string
    tableNumber: number
    name?: string
    capacity: number
  }
}

export default function RestaurantReservationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  )

  const { data, isLoading } = useQuery<{ reservations: RestaurantReservation[] }>({
    queryKey: ['restaurant-reservations', statusFilter, dateFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (dateFilter) params.append('date', dateFilter)

      const response = await apiRequest(
        `/api/industries/restaurant/reservations?${params.toString()}`
      )
      if (!response.ok) throw new Error('Failed to fetch reservations')
      return response.json()
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800'
      case 'SEATED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'NO_SHOW':
        return 'bg-orange-100 text-orange-800'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const reservations = data?.reservations || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reservations</h1>
          <p className="text-gray-600 mt-1">Manage restaurant reservations</p>
        </div>
        <Link href="/dashboard/industries/restaurant/reservations/new">
          <Button>New Reservation</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'CONFIRMED' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('CONFIRMED')}
          >
            Confirmed
          </Button>
          <Button
            variant={statusFilter === 'SEATED' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('SEATED')}
          >
            Seated
          </Button>
          <Button
            variant={statusFilter === 'CANCELLED' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('CANCELLED')}
          >
            Cancelled
          </Button>
        </div>
        <div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* Reservations Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reservations...</p>
        </div>
      ) : reservations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No reservations found for the selected date.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reservation #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Party Size</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((reservation) => (
                <TableRow key={reservation.id}>
                  <TableCell className="font-medium">
                    {reservation.reservationNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{reservation.customerName}</div>
                      <div className="text-sm text-gray-500">{reservation.customerPhone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(reservation.reservationDate), 'MMM dd, yyyy h:mm a')}
                  </TableCell>
                  <TableCell>{reservation.partySize} guests</TableCell>
                  <TableCell>
                    {reservation.table ? (
                      <span>Table {reservation.table.tableNumber}</span>
                    ) : (
                      <span className="text-gray-400">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(reservation.status)}>
                      {reservation.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/industries/restaurant/reservations/${reservation.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}

