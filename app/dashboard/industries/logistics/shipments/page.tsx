'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface LogisticsShipment {
  id: string
  shipmentNumber: string
  customerName: string
  customerPhone?: string
  pickupAddress: string
  deliveryAddress: string
  shipmentType: string
  status: string
  trackingNumber?: string
  charges?: number
  pickupDate?: string
  deliveryDate?: string
  deliveries: any[]
}

export default function LogisticsShipmentsPage() {
  const queryClient = useQueryClient()
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const { data, isLoading } = useQuery<{ shipments: LogisticsShipment[] }>({
    queryKey: ['logistics-shipments', selectedStatus],
    queryFn: async () => {
      const url = selectedStatus === 'all'
        ? '/api/industries/logistics/shipments'
        : `/api/industries/logistics/shipments?status=${selectedStatus}`
      const response = await apiRequest(url)
      if (!response.ok) throw new Error('Failed to fetch shipments')
      return response.json()
    },
  })

  const updateShipmentMutation = useMutation({
    mutationFn: async ({ id, status, deliveryDate }: { id: string; status?: string; deliveryDate?: string }) => {
      const response = await apiRequest(`/api/industries/logistics/shipments`, {
        method: 'PATCH',
        body: JSON.stringify({ id, status, deliveryDate }),
      })
      if (!response.ok) throw new Error('Failed to update shipment')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistics-shipments'] })
    },
  })

  const shipments = data?.shipments || []

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PICKED_UP: 'bg-blue-100 text-blue-800',
      IN_TRANSIT: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      RETURNED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Shipments</h1>
        <p className="mt-2 text-gray-600">Track and manage logistics shipments</p>
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
            <option value="PENDING">Pending</option>
            <option value="PICKED_UP">Picked Up</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="RETURNED">Returned</option>
          </select>
        </CardContent>
      </Card>

      {/* Shipments List */}
      {isLoading ? (
        <div className="text-center py-8">Loading shipments...</div>
      ) : shipments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No shipments found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {shipments.map((shipment) => (
            <Card key={shipment.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Shipment #{shipment.shipmentNumber}</CardTitle>
                    <CardDescription>
                      Customer: {shipment.customerName} | 
                      Type: {shipment.shipmentType}
                      {shipment.trackingNumber && ` | Tracking: ${shipment.trackingNumber}`}
                    </CardDescription>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(shipment.status)}`}>
                    {shipment.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <strong>Pickup:</strong>
                      <p className="text-gray-600">{shipment.pickupAddress}</p>
                      {shipment.pickupDate && (
                        <p className="text-sm text-gray-500">
                          {new Date(shipment.pickupDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div>
                      <strong>Delivery:</strong>
                      <p className="text-gray-600">{shipment.deliveryAddress}</p>
                      {shipment.deliveryDate && (
                        <p className="text-sm text-gray-500">
                          {new Date(shipment.deliveryDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {shipment.charges && <p><strong>Charges:</strong> ₹{shipment.charges}</p>}
                  {shipment.deliveries.length > 0 && (
                    <p><strong>Delivery Proofs:</strong> {shipment.deliveries.length}</p>
                  )}
                  {shipment.status === 'IN_TRANSIT' && (
                    <Button
                      onClick={() => updateShipmentMutation.mutate({ 
                        id: shipment.id, 
                        status: 'DELIVERED',
                        deliveryDate: new Date().toISOString()
                      })}
                      className="mt-2"
                    >
                      Mark as Delivered
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

