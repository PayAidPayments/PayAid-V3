'use client'

import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageLoading } from '@/components/ui/loading'
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

export default function FinancePurchaseOrderDetailPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const poId = params.id as string
  const queryClient = useQueryClient()

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
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      case 'PENDING_APPROVAL':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'SENT':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'PARTIALLY_RECEIVED':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'RECEIVED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const order = poData?.order

  if (isLoading) {
    return <PageLoading message="Loading purchase order..." fullScreen={false} />
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Purchase order not found</p>
        <Link href={`/finance/${tenantId}/Purchase-Orders`}>
          <Button className="mt-4 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Back to Purchase Orders</Button>
        </Link>
      </div>
    )
  }

  const canApprove = order.status === 'PENDING_APPROVAL'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href={`/finance/${tenantId}/Purchase-Orders`}>
              <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">← Back</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Purchase Order: {order.poNumber}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">View and manage purchase order details</p>
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
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Reject
              </Button>
              <Button
                onClick={() => approveMutation.mutate(true)}
                disabled={approveMutation.isPending}
                className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              >
                {approveMutation.isPending ? 'Approving...' : 'Approve'}
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
              <Badge className={getStatusColor(order.status)}>
                {order.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Amount</div>
              <div className="text-2xl font-bold dark:text-gray-100">
                ₹{Number(order.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="dark:bg-gray-800">
          <TabsTrigger value="overview" className="dark:text-gray-300">Overview</TabsTrigger>
          <TabsTrigger value="items" className="dark:text-gray-300">Items ({order.items.length})</TabsTrigger>
          <TabsTrigger value="receipts" className="dark:text-gray-300">Goods Receipts ({order.goodsReceipts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Vendor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Vendor Name</div>
                  <div className="font-medium dark:text-gray-100">{order.vendor.name}</div>
                  {order.vendor.companyName && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">{order.vendor.companyName}</div>
                  )}
                </div>
                {order.vendor.email && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</div>
                    <div className="dark:text-gray-300">{order.vendor.email}</div>
                  </div>
                )}
                {order.vendor.phone && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</div>
                    <div className="dark:text-gray-300">{order.vendor.phone}</div>
                  </div>
                )}
                {order.vendor.gstin && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">GSTIN</div>
                    <div className="dark:text-gray-300">{order.vendor.gstin}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Order Date</div>
                  <div className="dark:text-gray-300">{format(new Date(order.orderDate), 'MMM dd, yyyy')}</div>
                </div>
                {order.expectedDeliveryDate && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Expected Delivery</div>
                    <div className="dark:text-gray-300">{format(new Date(order.expectedDeliveryDate), 'MMM dd, yyyy')}</div>
                  </div>
                )}
                {order.requestedBy && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Requested By</div>
                    <div className="dark:text-gray-300">{order.requestedBy.name}</div>
                  </div>
                )}
                {order.approvedBy && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved By</div>
                    <div className="dark:text-gray-300">{order.approvedBy.name}</div>
                    {order.approvedAt && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(order.approvedAt), 'MMM dd, yyyy')}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {order.notes && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {order.termsAndConditions && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{order.termsAndConditions}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="items">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Purchase Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="dark:text-gray-300">Product</TableHead>
                    <TableHead className="dark:text-gray-300">Description</TableHead>
                    <TableHead className="dark:text-gray-300">Qty</TableHead>
                    <TableHead className="dark:text-gray-300">Unit Price</TableHead>
                    <TableHead className="dark:text-gray-300">GST %</TableHead>
                    <TableHead className="dark:text-gray-300">Tax Amount</TableHead>
                    <TableHead className="dark:text-gray-300">Received</TableHead>
                    <TableHead className="dark:text-gray-300">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id} className="dark:border-gray-700">
                      <TableCell className="font-medium dark:text-gray-100">{item.productName}</TableCell>
                      <TableCell className="dark:text-gray-300">{item.description || '-'}</TableCell>
                      <TableCell className="dark:text-gray-300">{item.quantity}</TableCell>
                      <TableCell className="dark:text-gray-300">₹{Number(item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="dark:text-gray-300">{item.taxRate}%</TableCell>
                      <TableCell className="dark:text-gray-300">₹{Number(item.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="dark:text-gray-300">
                        {item.receivedQuantity > 0 ? (
                          <span className="text-green-600 dark:text-green-400">{item.receivedQuantity} / {item.quantity}</span>
                        ) : (
                          <span className="text-gray-400">0 / {item.quantity}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium dark:text-gray-100">
                        ₹{Number(item.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between dark:text-gray-300">
                    <span>Subtotal:</span>
                    <span className="font-medium">₹{Number(order.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between dark:text-gray-300">
                    <span>Tax:</span>
                    <span className="font-medium">₹{Number(order.tax).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between dark:text-gray-300">
                      <span>Discount:</span>
                      <span className="font-medium">-₹{Number(order.discount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t dark:border-gray-700 pt-2 dark:text-gray-100">
                    <span>Total:</span>
                    <span>₹{Number(order.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Goods Receipt Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {order.goodsReceipts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">No goods receipts yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="dark:text-gray-300">GRN Number</TableHead>
                      <TableHead className="dark:text-gray-300">Status</TableHead>
                      <TableHead className="dark:text-gray-300">Received Date</TableHead>
                      <TableHead className="dark:text-gray-300">Quality Status</TableHead>
                      <TableHead className="dark:text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.goodsReceipts.map((grn) => (
                      <TableRow key={grn.id} className="dark:border-gray-700">
                        <TableCell className="font-medium dark:text-gray-100">{grn.grnNumber}</TableCell>
                        <TableCell>
                          <Badge className="dark:bg-gray-700 dark:text-gray-200">{grn.status}</Badge>
                        </TableCell>
                        <TableCell className="dark:text-gray-300">
                          {format(new Date(grn.receivedDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {grn.qualityStatus ? (
                            <Badge className={grn.qualityStatus === 'PASSED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}>
                              {grn.qualityStatus}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">Pending</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">View</Button>
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
