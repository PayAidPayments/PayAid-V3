'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger } from '@/components/ui/custom-select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getAuthHeaders } from '@/lib/api/client'
import { formatINRStandard } from '@/lib/utils/formatINR'

interface Vendor {
  id: string
  name: string
  companyName?: string
}

interface POItem {
  productName: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  hsnCode: string
  notes: string
}

export default function FinancePurchaseOrdersNewPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const router = useRouter()
  const [formData, setFormData] = useState({
    vendorId: '',
    poNumber: '',
    orderDate: new Date().toISOString().slice(0, 16),
    expectedDeliveryDate: '',
    discount: '0',
    notes: '',
    termsAndConditions: '',
  })
  const [items, setItems] = useState<POItem[]>([
    { productName: '', description: '', quantity: 1, unitPrice: 0, taxRate: 18, hsnCode: '', notes: '' }
  ])

  const { data: vendorsData } = useQuery<{ vendors: Vendor[] }>({
    queryKey: ['vendors'],
    queryFn: async () => {
      const response = await fetch('/api/purchases/vendors?limit=1000', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch vendors')
      return response.json()
    },
  })

  const createPO = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/purchases/orders', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create purchase order')
      }
      return response.json()
    },
    onSuccess: (data) => {
      router.push(`/finance/${tenantId}/Purchase-Orders/${data.order.id}`)
    },
  })

  const addItem = () => {
    setItems([...items, { productName: '', description: '', quantity: 1, unitPrice: 0, taxRate: 18, hsnCode: '', notes: '' }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof POItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const calculateTotals = () => {
    let subtotal = 0
    items.forEach(item => {
      subtotal += item.quantity * item.unitPrice
    })
    const discount = parseFloat(formData.discount) || 0
    const tax = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice
      return sum + (itemSubtotal * item.taxRate / 100)
    }, 0)
    const total = subtotal + tax - discount
    return { subtotal, tax, discount, total }
  }

  const totals = calculateTotals()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.vendorId) {
      alert('Please select a vendor')
      return
    }

    if (items.length === 0 || items.some(item => !item.productName || item.quantity <= 0 || item.unitPrice <= 0)) {
      alert('Please add at least one valid item')
      return
    }

    const submitData: any = {
      vendorId: formData.vendorId,
      poNumber: formData.poNumber || undefined,
      orderDate: formData.orderDate || undefined,
      expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
      discount: parseFloat(formData.discount) || 0,
      notes: formData.notes || undefined,
      termsAndConditions: formData.termsAndConditions || undefined,
      items: items.map(item => ({
        productName: item.productName,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        hsnCode: item.hsnCode || undefined,
        notes: item.notes || undefined,
      })),
    }

    createPO.mutate(submitData)
  }

  const vendors = vendorsData?.vendors || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create New Purchase Order</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Create a new purchase order for a vendor</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Purchase Order Details</CardTitle>
            <CardDescription className="dark:text-gray-400">Enter the basic information for the purchase order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="vendorId" className="dark:text-gray-300">Vendor *</Label>
                <CustomSelect
                  value={formData.vendorId}
                  onValueChange={(value: string) => setFormData({ ...formData, vendorId: value })}
                  placeholder="Select a vendor"
                >
                  <CustomSelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    {vendors.map((vendor) => (
                      <CustomSelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name} {vendor.companyName && `(${vendor.companyName})`}
                      </CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
              </div>

              <div className="space-y-2">
                <Label htmlFor="poNumber" className="dark:text-gray-300">PO Number</Label>
                <Input
                  id="poNumber"
                  value={formData.poNumber}
                  onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                  placeholder="Leave empty to auto-generate"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderDate" className="dark:text-gray-300">Order Date</Label>
                <Input
                  id="orderDate"
                  type="datetime-local"
                  value={formData.orderDate}
                  onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedDeliveryDate" className="dark:text-gray-300">Expected Delivery Date</Label>
                <Input
                  id="expectedDeliveryDate"
                  type="datetime-local"
                  value={formData.expectedDeliveryDate}
                  onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount" className="dark:text-gray-300">Discount (₹)</Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  placeholder="0.00"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="dark:text-gray-300">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes..."
                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="termsAndConditions" className="dark:text-gray-300">Terms & Conditions</Label>
              <Textarea
                id="termsAndConditions"
                value={formData.termsAndConditions}
                onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                rows={3}
                placeholder="Payment terms, delivery terms, etc..."
                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="dark:text-gray-100">Items</CardTitle>
                <CardDescription className="dark:text-gray-400">Add items to the purchase order</CardDescription>
              </div>
              <Button type="button" onClick={addItem} variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="dark:text-gray-300">Product Name *</TableHead>
                    <TableHead className="dark:text-gray-300">Description</TableHead>
                    <TableHead className="dark:text-gray-300">Qty *</TableHead>
                    <TableHead className="dark:text-gray-300">Unit Price *</TableHead>
                    <TableHead className="dark:text-gray-300">GST %</TableHead>
                    <TableHead className="dark:text-gray-300">HSN Code</TableHead>
                    <TableHead className="dark:text-gray-300">Amount</TableHead>
                    <TableHead className="dark:text-gray-300">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const itemSubtotal = item.quantity * item.unitPrice
                    const itemTax = (itemSubtotal * item.taxRate) / 100
                    const itemTotal = itemSubtotal + itemTax
                    return (
                      <TableRow key={index} className="dark:border-gray-700">
                        <TableCell>
                          <Input
                            value={item.productName}
                            onChange={(e) => updateItem(index, 'productName', e.target.value)}
                            placeholder="Product name"
                            className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            placeholder="Description"
                            className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-20 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-24 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={item.taxRate}
                            onChange={(e) => updateItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                            className="w-20 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.hsnCode}
                            onChange={(e) => updateItem(index, 'hsnCode', e.target.value)}
                            placeholder="HSN"
                            className="w-24 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          />
                        </TableCell>
                        <TableCell className="font-medium dark:text-gray-100">
                          {formatINRStandard(itemTotal)}
                        </TableCell>
                        <TableCell>
                          {items.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              Remove
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between dark:text-gray-300">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatINRStandard(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between dark:text-gray-300">
                  <span>Tax:</span>
                  <span className="font-medium">{formatINRStandard(totals.tax)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between dark:text-gray-300">
                    <span>Discount:</span>
                    <span className="font-medium">-{formatINRStandard(totals.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t dark:border-gray-700 pt-2 dark:text-gray-100">
                  <span>Total:</span>
                  <span>{formatINRStandard(totals.total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {createPO.error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-400">
              {createPO.error instanceof Error ? createPO.error.message : 'Failed to create purchase order'}
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={createPO.isPending}
            className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            {createPO.isPending ? 'Creating...' : 'Create Purchase Order'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
