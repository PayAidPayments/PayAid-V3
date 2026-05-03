'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiRequest } from '@/lib/api/client'
import { parseErrorMessage, withRetryGuidance } from '@/lib/ui/request-error-guidance'

export default function InventoryNewProductPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const createProductIdempotencyKey = useMemo(
    () =>
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? `inventory:product:create:${crypto.randomUUID()}`
        : `inventory:product:create:${Date.now()}`,
    []
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    costPrice: '',
    salePrice: '',
    quantity: '0',
    reorderLevel: '10',
    categories: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const response = await apiRequest('/api/products', {
        method: 'POST',
        headers: { 'x-idempotency-key': createProductIdempotencyKey },
        timeoutMs: 25000,
        body: JSON.stringify({
          name: formData.name.trim(),
          sku: formData.sku.trim(),
          description: formData.description.trim() || undefined,
          costPrice: Number(formData.costPrice),
          salePrice: Number(formData.salePrice),
          quantity: Number(formData.quantity || 0),
          reorderLevel: Number(formData.reorderLevel || 10),
          categories: formData.categories
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          images: [],
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message =
          (data.error || data.message)
            ? withRetryGuidance(data.error || data.message)
            : await parseErrorMessage(response, 'Failed to create product')
        throw new Error(message)
      }

      router.push(`/inventory/${tenantId}/Products`)
    } catch (submitError) {
      setError(withRetryGuidance(submitError instanceof Error ? submitError.message : 'Failed to create product'))
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">New Product</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Add a stock item to your inventory catalog.
          </p>
        </div>
        <Link href={`/inventory/${tenantId}/Products`}>
          <Button variant="outline" disabled={isSubmitting} title={isSubmitting ? 'Please wait' : 'Back'}>
            Back
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
          <CardDescription>Fill required fields to create a new inventory product.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name *
                </label>
                <Input
                  id="name"
                  required
                  disabled={isSubmitting}
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="sku" className="text-sm font-medium">
                  SKU *
                </label>
                <Input
                  id="sku"
                  required
                  disabled={isSubmitting}
                  value={formData.sku}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Input
                  id="description"
                  disabled={isSubmitting}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="costPrice" className="text-sm font-medium">
                  Cost Price (₹) *
                </label>
                <Input
                  id="costPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  disabled={isSubmitting}
                  value={formData.costPrice}
                  onChange={(e) => setFormData((prev) => ({ ...prev, costPrice: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="salePrice" className="text-sm font-medium">
                  Sale Price (₹) *
                </label>
                <Input
                  id="salePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  disabled={isSubmitting}
                  value={formData.salePrice}
                  onChange={(e) => setFormData((prev) => ({ ...prev, salePrice: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="quantity" className="text-sm font-medium">
                  Quantity
                </label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  disabled={isSubmitting}
                  value={formData.quantity}
                  onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="reorderLevel" className="text-sm font-medium">
                  Reorder Level
                </label>
                <Input
                  id="reorderLevel"
                  type="number"
                  min="0"
                  disabled={isSubmitting}
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reorderLevel: e.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="categories" className="text-sm font-medium">
                  Categories (comma-separated)
                </label>
                <Input
                  id="categories"
                  disabled={isSubmitting}
                  value={formData.categories}
                  onChange={(e) => setFormData((prev) => ({ ...prev, categories: e.target.value }))}
                  placeholder="Electronics, Accessories"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Link href={`/inventory/${tenantId}/Products`}>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting} title={isSubmitting ? 'Please wait' : 'Create product'}>
                {isSubmitting ? 'Creating…' : 'Create Product'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
