'use client'

import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useProduct } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoading } from '@/components/ui/loading'

export default function ProductDetailPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const id = params.id as string
  const { data: product, isLoading } = useProduct(id)

  if (isLoading) {
    return <PageLoading message="Loading product..." fullScreen={false} />
  }

  if (!product) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Product not found</p>
        <Link href={`/inventory/${tenantId}/Products`}>
          <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Back to Products</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{product.name}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">SKU: {product.sku}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/inventory/${tenantId}/Products`}>
            <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Back</Button>
          </Link>
          <Link href={`/inventory/${tenantId}/Products/${id}/Edit`}>
            <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Edit</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.description && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Description</div>
                  <div className="text-gray-900 dark:text-gray-100">{product.description}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Cost Price</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">₹{product.costPrice.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Sale Price</div>
                  <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    ₹{product.salePrice.toLocaleString('en-IN')}
                  </div>
                </div>
                {product.discountPrice && (
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Discount Price</div>
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      ₹{product.discountPrice.toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Profit Margin</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {((product.salePrice - product.costPrice) / product.costPrice * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {product.categories && product.categories.length > 0 && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Categories</div>
                  <div className="flex flex-wrap gap-2">
                    {product.categories.map((cat: string) => (
                      <span
                        key={cat}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Current Stock</div>
                <div className={`text-2xl font-bold ${product.quantity <= product.reorderLevel ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                  {product.quantity}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Reorder Level</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{product.reorderLevel}</div>
              </div>
              {product.quantity <= product.reorderLevel && (
                <div className="p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md text-sm text-red-800 dark:text-red-200">
                  ⚠️ Low stock! Reorder needed.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Sales Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Sold</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{product.totalSold || 0} units</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  ₹{(product.totalRevenue || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
