'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { getAuthHeaders } from '@/lib/api/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PurchaseOrder {
  id: string
  poNumber: string
  status: string
  orderDate: string
  expectedDeliveryDate?: string
  actualDeliveryDate?: string
  subtotal: number
  tax: number
  discount: number
  total: number
  vendor: {
    id: string
    name: string
    companyName?: string
    email?: string
    phone?: string
    gstin?: string
  }
  items: Array<{
    id: string
    productName: string
    description?: string
    quantity: number
    unitPrice: number
    taxRate: number
    taxAmount: number
    total: number
    receivedQuantity: number
    hsnCode?: string
  }>
  requestedBy?: {
    id: string
    name: string
    email: string
  }
  approvedBy?: {
    id: string
    name: string
    email: string
  }
  approvedAt?: string
  notes?: string
  termsAndConditions?: string
  goodsReceipts: Array<{
    id: string
    grnNumber: string
    status: string
    receivedDate: string
    qualityStatus?: string
  }>
}

export default function PurchaseOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const poId = params?.id as string

  const { data: poData, isLoading } = useQuery<{ order: PurchaseOrder }>({
    queryKey: ['purchase-order', poId],
    queryFn: async () => {
      const response = await fetch(`/api/purchases/orders/${poId}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch purchase order')
      return response.json()
    },
  })

  const approveMutation = useMutation({
    mutationFn: async (approved: boolean) => {
      const response = await fetch(`/api/purchases/orders/${poId}/approve`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update purchase order')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', poId] })
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'PENDING_APPROVAL':
        return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800'
      case 'SENT':
        return 'bg-purple-100 text-purple-800'
      case 'PARTIALLY_RECEIVED':
        return 'bg-orange-100 text-orange-800'
      case 'RECEIVED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const order = poData?.order

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading purchase order...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Purchase order not found</p>
        <Link href="/dashboard/purchases/orders">
          <Button className="mt-4">Back to Purchase Orders</Button>
        </Link>
      </div>
    )
  }

  const canApprove = order.status === 'PENDING_APPROVAL'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/purchases/orders">
              <Button variant="outline" size="sm">← Back</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Purchase Order: {order.poNumber}</h1>
              <p className="text-gray-600 mt-1">View and manage purchase order details</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {canApprove && (
            <>
              <Button
                variant="outline"
                onClick={() => approveMutation.mutate(false)}
                disabled={approveMutation.isPending}
              >
                Reject
              </Button>
              <Button
                onClick={() => approveMutation.mutate(true)}
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending ? 'Approving...' : 'Approve'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <Badge className={getStatusColor(order.status)}>
                {order.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Total Amount</div>
              <div className="text-2xl font-bold">
                ₹{Number(order.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="items">Items ({order.items.length})</TabsTrigger>
          <TabsTrigger value="receipts">Goods Receipts ({order.goodsReceipts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <div className="text-sm font-medium text-gray-600">Vendor Name</div>
                  <div className="font-medium">{order.vendor.name}</div>
                  {order.vendor.companyName && (
                    <div className="text-sm text-gray-500">{order.vendor.companyName}</div>
                  )}
                </div>
                {order.vendor.email && (
                  <div>
                    <div className="text-sm font-medium text-gray-600">Email</div>
                    <div>{order.vendor.email}</div>
                  </div>
                )}
                {order.vendor.phone && (
                  <div>
                    <div className="text-sm font-medium text-gray-600">Phone</div>
                    <div>{order.vendor.phone}</div>
                  </div>
                )}
                {order.vendor.gstin && (
                  <div>
                    <div className="text-sm font-medium text-gray-600">GSTIN</div>
                    <div>{order.vendor.gstin}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <div className="text-sm font-medium text-gray-600">Order Date</div>
                  <div>{format(new Date(order.orderDate), 'MMM dd, yyyy')}</div>
                </div>
                {order.expectedDeliveryDate && (
                  <div>
                    <div className="text-sm font-medium text-gray-600">Expected Delivery</div>
                    <div>{format(new Date(order.expectedDeliveryDate), 'MMM dd, yyyy')}</div>
                  </div>
                )}
                {order.requestedBy && (
                  <div>
                    <div className="text-sm font-medium text-gray-600">Requested By</div>
                    <div>{order.requestedBy.name}</div>
                  </div>
                )}
                {order.approvedBy && (
                  <div>
                    <div className="text-sm font-medium text-gray-600">Approved By</div>
                    <div>{order.approvedBy.name}</div>
                    {order.approvedAt && (
                      <div className="text-sm text-gray-500">
                        {format(new Date(order.approvedAt), 'MMM dd, yyyy')}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {order.termsAndConditions && (
            <Card>
              <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-line">{order.termsAndConditions}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>GST %</TableHead>
                    <TableHead>Tax Amount</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>{item.description || '-'}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>₹{Number(item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell>{item.taxRate}%</TableCell>
                      <TableCell>₹{Number(item.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        {item.receivedQuantity > 0 ? (
                          <span className="text-green-600">{item.receivedQuantity} / {item.quantity}</span>
                        ) : (
                          <span className="text-gray-400">0 / {item.quantity}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{Number(item.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totals */}
              <div className="mt-6 flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₹{Number(order.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium">₹{Number(order.tax).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-medium">-₹{Number(order.discount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>₹{Number(order.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts">
          <Card>
            <CardHeader>
              <CardTitle>Goods Receipt Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {order.goodsReceipts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No goods receipts yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>GRN Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Received Date</TableHead>
                      <TableHead>Quality Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.goodsReceipts.map((grn) => (
                      <TableRow key={grn.id}>
                        <TableCell className="font-medium">{grn.grnNumber}</TableCell>
                        <TableCell>
                          <Badge>{grn.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(grn.receivedDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {grn.qualityStatus ? (
                            <Badge className={grn.qualityStatus === 'PASSED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {grn.qualityStatus}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">Pending</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

