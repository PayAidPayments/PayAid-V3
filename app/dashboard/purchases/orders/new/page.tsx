'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getAuthHeaders } from '@/lib/api/client'

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

export default function NewPurchaseOrderPage() {
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
      router.push(`/dashboard/purchases/orders/${data.order.id}`)
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
        <h1 className="text-3xl font-bold text-gray-900">Create New Purchase Order</h1>
        <p className="text-gray-600 mt-1">Create a new purchase order for a vendor</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Purchase Order Details</CardTitle>
            <CardDescription>Enter the basic information for the purchase order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="vendorId">Vendor *</Label>
                <Select
                  value={formData.vendorId}
                  onValueChange={(value) => setFormData({ ...formData, vendorId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name} {vendor.companyName && `(${vendor.companyName})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="poNumber">PO Number</Label>
                <Input
                  id="poNumber"
                  value={formData.poNumber}
                  onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                  placeholder="Leave empty to auto-generate"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderDate">Order Date</Label>
                <Input
                  id="orderDate"
                  type="datetime-local"
                  value={formData.orderDate}
                  onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedDeliveryDate">Expected Delivery Date</Label>
                <Input
                  id="expectedDeliveryDate"
                  type="datetime-local"
                  value={formData.expectedDeliveryDate}
                  onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Discount (₹)</Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
              <Textarea
                id="termsAndConditions"
                value={formData.termsAndConditions}
                onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                rows={3}
                placeholder="Payment terms, delivery terms, etc..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Items</CardTitle>
                <CardDescription>Add items to the purchase order</CardDescription>
              </div>
              <Button type="button" onClick={addItem} variant="outline">
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name *</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Qty *</TableHead>
                    <TableHead>Unit Price *</TableHead>
                    <TableHead>GST %</TableHead>
                    <TableHead>HSN Code</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const itemSubtotal = item.quantity * item.unitPrice
                    const itemTax = (itemSubtotal * item.taxRate) / 100
                    const itemTotal = itemSubtotal + itemTax
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            value={item.productName}
                            onChange={(e) => updateItem(index, 'productName', e.target.value)}
                            placeholder="Product name"
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            placeholder="Description"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-20"
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-24"
                            required
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
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.hsnCode}
                            onChange={(e) => updateItem(index, 'hsnCode', e.target.value)}
                            placeholder="HSN"
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          ₹{itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          {items.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(index)}
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

            {/* Totals */}
            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">₹{totals.tax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium">-₹{totals.discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>₹{totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {createPO.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              {createPO.error instanceof Error ? createPO.error.message : 'Failed to create purchase order'}
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={createPO.isPending}
          >
            {createPO.isPending ? 'Creating...' : 'Create Purchase Order'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

