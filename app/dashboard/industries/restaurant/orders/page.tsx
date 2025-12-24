'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface OrderItem {
  id: string
  quantity: number
  price: string
  subtotal: string
  specialInstructions?: string
  menuItem: {
    id: string
    name: string
    price: string
    imageUrl?: string
  }
}

interface RestaurantOrder {
  id: string
  orderNumber: string
  tableNumber?: number
  customerName?: string
  customerPhone?: string
  status: string
  totalAmount: string
  paymentStatus: string
  items: OrderItem[]
  notes?: string
  estimatedTime?: number
  createdAt: string
}

export default function RestaurantOrdersPage() {
  const queryClient = useQueryClient()
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const { data, isLoading } = useQuery<{ orders: RestaurantOrder[] }>({
    queryKey: ['restaurant-orders', selectedStatus],
    queryFn: async () => {
      const url = selectedStatus === 'all' 
        ? '/api/industries/restaurant/orders'
        : `/api/industries/restaurant/orders?status=${selectedStatus}`
      const response = await apiRequest(url)
      if (!response.ok) throw new Error('Failed to fetch orders')
      return response.json()
    },
  })

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await apiRequest(`/api/industries/restaurant/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error('Failed to update order')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-orders'] })
    },
  })

  const orders = data?.orders || []

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      COOKING: 'bg-blue-100 text-blue-800',
      READY: 'bg-green-100 text-green-800',
      SERVED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    if (confirm(`Change order status to ${newStatus}?`)) {
      updateOrderMutation.mutate({ orderId, status: newStatus })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Restaurant Orders</h1>
        <p className="mt-2 text-gray-600">
          Manage and track all restaurant orders
        </p>
      </div>

      {/* Status Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {['all', 'PENDING', 'COOKING', 'READY', 'SERVED', 'CANCELLED'].map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus(status)}
              >
                {status === 'all' ? 'All Orders' : status}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {isLoading ? (
        <div className="text-center py-12">Loading orders...</div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p>No orders found</p>
            <p className="text-sm mt-2">Orders will appear here when customers place them</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Order #{order.orderNumber}
                      {order.tableNumber && ` - Table ${order.tableNumber}`}
                    </CardTitle>
                    <CardDescription>
                      {new Date(order.createdAt).toLocaleString()}
                      {order.customerName && ` • ${order.customerName}`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.paymentStatus === 'PAID' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold mb-2">Items:</h3>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                            <p className="font-medium">{item.menuItem.name}</p>
                            <p className="text-sm text-gray-600">
                              Qty: {item.quantity} × ₹{item.menuItem.price} = ₹{item.subtotal}
                            </p>
                            {item.specialInstructions && (
                              <p className="text-xs text-blue-600 mt-1">
                                Note: {item.specialInstructions}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-xl font-bold">₹{order.totalAmount}</p>
                      {order.estimatedTime && (
                        <p className="text-sm text-gray-500 mt-1">
                          Est. Time: {order.estimatedTime} minutes
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {order.status === 'PENDING' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(order.id, 'COOKING')}
                        >
                          Start Cooking
                        </Button>
                      )}
                      {order.status === 'COOKING' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(order.id, 'READY')}
                        >
                          Mark Ready
                        </Button>
                      )}
                      {order.status === 'READY' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(order.id, 'SERVED')}
                        >
                          Mark Served
                        </Button>
                      )}
                    </div>
                  </div>

                  {order.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-gray-600">
                        <strong>Notes:</strong> {order.notes}
                      </p>
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
