'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiRequest } from '@/lib/api/client'
import { ModuleSwitcher } from '@/components/ModuleSwitcher'
import { useAuthStore } from '@/lib/stores/auth'
import { ArrowLeft } from 'lucide-react'

export default function NewStockMovementPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const [formData, setFormData] = useState({
    productId: '',
    locationId: '',
    type: 'IN',
    quantity: '',
    reason: '',
    notes: '',
    referenceNumber: '',
  })

  // Fetch products
  const { data: productsData } = useQuery({
    queryKey: ['products', tenantId],
    queryFn: async () => {
      const response = await apiRequest(`/api/products?limit=1000`, {
        method: 'GET',
      })
      if (!response.ok) throw new Error('Failed to fetch products')
      return response.json()
    },
  })

  // Fetch warehouses/locations
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', tenantId],
    queryFn: async () => {
      const response = await apiRequest(`/api/inventory/warehouses?limit=1000`, {
        method: 'GET',
      })
      if (!response.ok) throw new Error('Failed to fetch warehouses')
      return response.json()
    },
  })

  const createStockMovement = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(`/api/inventory/stock-movements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create stock movement')
      }
      return response.json()
    },
    onSuccess: (data) => {
      router.push(`/inventory/${tenantId}/StockMovements`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createStockMovement.mutate({
      productId: formData.productId,
      locationId: formData.locationId,
      type: formData.type,
      quantity: parseInt(formData.quantity),
      reason: formData.reason || undefined,
      notes: formData.notes || undefined,
      referenceNumber: formData.referenceNumber || undefined,
    })
  }

  const products = productsData?.products || []
  const warehouses = warehousesData?.warehouses || []

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 relative" style={{ zIndex: 1 }}>
      {/* Top Navigation Bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold text-gray-900">Inventory</h2>
            <nav className="flex items-center gap-4 text-sm">
              <Link href={`/inventory/${tenantId}/Home/`} className="text-gray-600 hover:text-gray-900 transition-colors">Home</Link>
              <Link href={`/inventory/${tenantId}/Products`} className="text-gray-600 hover:text-gray-900 transition-colors">Products</Link>
              <Link href={`/inventory/${tenantId}/Warehouses`} className="text-gray-600 hover:text-gray-900 transition-colors">Warehouses</Link>
              <Link href={`/inventory/${tenantId}/StockMovements`} className="text-purple-600 font-medium border-b-2 border-purple-600 pb-2">Stock Movements</Link>
              <Link href={`/inventory/${tenantId}/Reports`} className="text-gray-600 hover:text-gray-900 transition-colors">Reports</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ModuleSwitcher currentModule="inventory" />
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href={`/inventory/${tenantId}/StockMovements`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Stock Movement</h1>
              <p className="text-sm text-gray-600 mt-1">Record stock in, out, or adjustment</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Stock Movement Details</CardTitle>
                <CardDescription>Enter the information for the stock movement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="type">Movement Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as 'IN' | 'OUT' | 'ADJUSTMENT' })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN">Stock In</SelectItem>
                      <SelectItem value="OUT">Stock Out</SelectItem>
                      <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="productId">Product *</Label>
                  <Select
                    value={formData.productId}
                    onValueChange={(value) => setFormData({ ...formData, productId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product: any) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} {product.sku ? `(${product.sku})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="locationId">Warehouse/Location *</Label>
                  <Select
                    value={formData.locationId}
                    onValueChange={(value) => setFormData({ ...formData, locationId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse: any) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} {warehouse.code ? `(${warehouse.code})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    placeholder="0"
                    min="1"
                    step="1"
                  />
                </div>

                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="e.g., Purchase, Sale, Return"
                  />
                </div>

                <div>
                  <Label htmlFor="referenceNumber">Reference Number</Label>
                  <Input
                    id="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    placeholder="e.g., PO-12345, SO-67890"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Link href={`/inventory/${tenantId}/StockMovements`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700"
                disabled={createStockMovement.isPending}
              >
                {createStockMovement.isPending ? 'Creating...' : 'Create Movement'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

