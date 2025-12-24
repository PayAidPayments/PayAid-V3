'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

interface KitchenOrderItem {
  id: string
  quantity: number
  specialInstructions?: string
  menuItem: {
    id: string
    name: string
    preparationTime?: number
    category: string
    isSpicy: boolean
    isVegetarian: boolean
  }
}

interface KitchenOrder {
  id: string
  orderNumber: string
  tableNumber?: number
  status: string
  items: KitchenOrderItem[]
  createdAt: string
  estimatedTime?: number
}

export default function KitchenDisplayPage() {
  const queryClient = useQueryClient()

  // Auto-refresh every 10 seconds
  const { data, isLoading } = useQuery<{ pending: KitchenOrder[]; cooking: KitchenOrder[] }>({
    queryKey: ['kitchen-display'],
    queryFn: async () => {
      const response = await apiRequest('/api/industries/restaurant/kitchen')
      if (!response.ok) throw new Error('Failed to fetch kitchen orders')
      return response.json()
    },
    refetchInterval: 10000, // Refresh every 10 seconds
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
      queryClient.invalidateQueries({ queryKey: ['kitchen-display'] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-orders'] })
    },
  })

  const pendingOrders = data?.pending || []
  const cookingOrders = data?.cooking || []

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateOrderMutation.mutate({ orderId, status: newStatus })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kitchen Display</h1>
        <p className="mt-2 text-gray-600">
          Real-time order display for kitchen staff
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600">Pending Orders ({pendingOrders.length})</CardTitle>
            <CardDescription>New orders waiting to be started</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : pendingOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-2xl mb-2">✅</p>
                <p>No pending orders</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 border-2 border-yellow-300 rounded-lg bg-yellow-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg">
                          Order #{order.orderNumber}
                          {order.tableNumber && ` - Table ${order.tableNumber}`}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(order.id, 'COOKING')}
                      >
                        Start Cooking
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="p-2 bg-white rounded border"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">
                                {item.quantity}x {item.menuItem.name}
                              </p>
                              {item.menuItem.preparationTime && (
                                <p className="text-xs text-gray-500">
                                  ⏱️ {item.menuItem.preparationTime} min
                                </p>
                              )}
                              {item.specialInstructions && (
                                <p className="text-xs text-blue-600 mt-1">
                                  📝 {item.specialInstructions}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1 ml-2">
                              {item.menuItem.isSpicy && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                                  🌶️
                                </span>
                              )}
                              {item.menuItem.isVegetarian && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                  🥬
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cooking Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Cooking ({cookingOrders.length})</CardTitle>
            <CardDescription>Orders currently being prepared</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : cookingOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-2xl mb-2">👨‍🍳</p>
                <p>No orders cooking</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cookingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 border-2 border-blue-300 rounded-lg bg-blue-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg">
                          Order #{order.orderNumber}
                          {order.tableNumber && ` - Table ${order.tableNumber}`}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Started: {new Date(order.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(order.id, 'READY')}
                      >
                        Mark Ready
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="p-2 bg-white rounded border"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">
                                {item.quantity}x {item.menuItem.name}
                              </p>
                              {item.menuItem.preparationTime && (
                                <p className="text-xs text-gray-500">
                                  ⏱️ {item.menuItem.preparationTime} min
                                </p>
                              )}
                              {item.specialInstructions && (
                                <p className="text-xs text-blue-600 mt-1">
                                  📝 {item.specialInstructions}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1 ml-2">
                              {item.menuItem.isSpicy && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                                  🌶️
                                </span>
                              )}
                              {item.menuItem.isVegetarian && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                  🥬
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
