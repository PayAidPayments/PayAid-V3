'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { getAuthHeaders } from '@/lib/api/client'
import { PageLoading } from '@/components/ui/loading'
import { ArrowLeft, User, MapPin, Calendar } from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  total: number
  subtotal: number
  tax: number
  shipping: number
  discountAmount: number
  status: string
  createdAt: string
  shippedAt?: string
  deliveredAt?: string
  trackingUrl?: string
  shippingOrderId?: string
  customer?: {
    id: string
    name: string
    email: string
    phone?: string
  }
  items: Array<{
    id: string
    productName: string
    quantity: number
    price: number
    total: number
    product?: {
      id: string
      name: string
      sku: string
    }
  }>
  shippingAddress?: string
  shippingCity?: string
  shippingPostal?: string
  shippingCountry?: string
}

export default function OrderDetailPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const orderId = params?.id as string

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch order')
      return response.json()
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'refunded':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  if (isLoading) {
    return <PageLoading message="Loading order..." fullScreen={false} />
  }

  if (!order) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Order not found</p>
        <Link href={`/sales/${tenantId}/Orders`}>
          <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Back to Orders</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/sales/${tenantId}/Orders`}>
            <Button variant="ghost" size="sm" className="dark:text-gray-300 dark:hover:bg-gray-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Order {order.orderNumber}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {order.customer?.name || 'Guest Customer'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(order.status)}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="dark:text-gray-300">Product</TableHead>
                    <TableHead className="dark:text-gray-300">Quantity</TableHead>
                    <TableHead className="dark:text-gray-300">Price</TableHead>
                    <TableHead className="text-right dark:text-gray-300">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-gray-900 dark:text-gray-100">
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            {item.product?.sku && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {item.product.sku}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-100">{item.quantity}</TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-100">₹{item.price.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right font-medium text-gray-900 dark:text-gray-100">
                          ₹{item.total.toLocaleString('en-IN')}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 dark:text-gray-400">
                        No items found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">₹{order.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Discount</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      -₹{order.discountAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tax (GST)</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">₹{order.tax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">₹{order.shipping.toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t dark:border-gray-700 pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">Total</span>
                  <span className="font-bold text-lg text-gray-900 dark:text-gray-100">₹{order.total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {order.customer && (
            <Card className="mt-6 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                  <User className="w-4 h-4" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{order.customer.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{order.customer.email}</p>
                </div>
                {order.customer.phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{order.customer.phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {order.shippingAddress && (
            <Card className="mt-6 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                  <MapPin className="w-4 h-4" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {order.shippingAddress}
                  {order.shippingCity && `, ${order.shippingCity}`}
                  {order.shippingPostal && ` ${order.shippingPostal}`}
                  {order.shippingCountry && `, ${order.shippingCountry}`}
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="mt-6 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                <Calendar className="w-4 h-4" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Created</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              {order.shippedAt && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Shipped</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(order.shippedAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              )}
              {order.deliveredAt && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Delivered</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(order.deliveredAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {order.trackingUrl && (
            <Card className="mt-6 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 dark:text-green-400 hover:underline"
                >
                  Track Package
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
