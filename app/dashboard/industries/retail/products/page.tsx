'use client'

import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface RetailProduct {
  id: string
  name: string
  description?: string
  sku?: string
  barcode?: string
  category?: string
  brand?: string
  price: string
  costPrice?: string
  stockQuantity: number
  minStockLevel: number
  maxStockLevel?: number
  isActive: boolean
}

export default function RetailProductsPage() {
  const { data, isLoading } = useQuery<{ products: RetailProduct[] }>({
    queryKey: ['retail-products'],
    queryFn: async () => {
      const response = await apiRequest('/api/industries/retail/products')
      if (!response.ok) throw new Error('Failed to fetch products')
      return response.json()
    },
  })

  const products = data?.products || []

  const getStockStatus = (product: RetailProduct) => {
    if (product.stockQuantity === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' }
    }
    if (product.stockQuantity <= product.minStockLevel) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' }
    }
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Retail Products</h1>
          <p className="mt-2 text-gray-600">
            Manage your product catalog and inventory
          </p>
        </div>
        <Button>Add Product</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Products</CardDescription>
            <CardTitle className="text-2xl">{products.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Stock</CardDescription>
            <CardTitle className="text-2xl">
              {products.filter((p) => p.stockQuantity > p.minStockLevel).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Low Stock</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">
              {products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Out of Stock</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {products.filter((p) => p.stockQuantity === 0).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Products List */}
      {isLoading ? (
        <div className="text-center py-12">Loading products...</div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p>No products found</p>
            <p className="text-sm mt-2">Add your first product to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => {
            const stockStatus = getStockStatus(product)
            return (
              <Card key={product.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      {product.brand && (
                        <CardDescription className="mt-1">{product.brand}</CardDescription>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${stockStatus.color}`}>
                      {stockStatus.label}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {product.description && (
                      <p className="text-sm text-gray-600">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div>
                        <p className="text-sm text-gray-600">Price</p>
                        <p className="text-xl font-bold">₹{product.price}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Stock</p>
                        <p className="text-lg font-semibold">{product.stockQuantity}</p>
                        {product.minStockLevel > 0 && (
                          <p className="text-xs text-gray-500">
                            Min: {product.minStockLevel}
                          </p>
                        )}
                      </div>
                    </div>
                    {product.sku && (
                      <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                    )}
                    {product.barcode && (
                      <p className="text-xs text-gray-500">Barcode: {product.barcode}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
