'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Plus, Search, MapPin, Clock, User, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_COLORS = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const PRIORITY_COLORS = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
}

function WorkOrdersPageContent() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['work-orders', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      const response = await fetch(`/api/field-service/work-orders?${params}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch work orders')
      return response.json()
    },
  })

  const workOrders = data?.workOrders || []
  const filtered = workOrders.filter((wo: any) =>
    search === '' ||
    wo.workOrderNumber?.toLowerCase().includes(search.toLowerCase()) ||
    wo.serviceType.toLowerCase().includes(search.toLowerCase()) ||
    wo.contact?.name?.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Work Orders</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage field service work orders and technician assignments
          </p>
        </div>
        <Link href="/dashboard/field-service/work-orders/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Work Order
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search work orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          value={statusFilter || ''}
          onChange={(e) => setStatusFilter(e.target.value || null)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">All Status</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((wo: any) => (
          <Link key={wo.id} href={`/dashboard/field-service/work-orders/${wo.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{wo.serviceType}</CardTitle>
                    <CardDescription className="mt-1">
                      {wo.workOrderNumber || 'No number'}
                    </CardDescription>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[wo.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'}`}
                  >
                    {wo.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {wo.contact && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{wo.contact.name}</span>
                    </div>
                  )}
                  {wo.scheduledDate && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>
                        {format(new Date(wo.scheduledDate), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                  )}
                  {wo.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{wo.location}</span>
                    </div>
                  )}
                  {wo.technician && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>Tech: {wo.technician.name}</span>
                    </div>
                  )}
                  <div className="pt-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${PRIORITY_COLORS[wo.priority as keyof typeof PRIORITY_COLORS] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {wo.priority} Priority
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No work orders found</p>
            <Link href="/dashboard/field-service/work-orders/new">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Work Order
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function WorkOrdersPage() {
  return <WorkOrdersPageContent />
}

