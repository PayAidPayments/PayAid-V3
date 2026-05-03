'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export default function NewExpensePage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    vendor: '',
    date: new Date().toISOString().split('T')[0],
    receiptUrl: '',
    gstAmount: '',
    hsnCode: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = [
    'Travel',
    'Office Supplies',
    'Marketing',
    'Utilities',
    'Rent',
    'Salaries',
    'Other',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/accounting/expenses', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          gstAmount: formData.gstAmount ? parseFloat(formData.gstAmount) : undefined,
          date: formData.date ? new Date(formData.date).toISOString() : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create expense')
      }

      router.push('/dashboard/accounting/expenses')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create expense')
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Expense</h1>
          <p className="mt-2 text-gray-600">Record a new business expense</p>
        </div>
        <Link href="/dashboard/accounting/expenses">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Information</CardTitle>
          <CardDescription>Enter the expense details below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description *
                </label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-medium">
                  Amount (₹) *
                </label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="vendor" className="text-sm font-medium">
                  Vendor
                </label>
                <Input
                  id="vendor"
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="date" className="text-sm font-medium">
                  Date *
                </label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="gstAmount" className="text-sm font-medium">
                  GST Amount (₹)
                </label>
                <Input
                  id="gstAmount"
                  name="gstAmount"
                  type="number"
                  step="0.01"
                  value={formData.gstAmount}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="hsnCode" className="text-sm font-medium">
                  HSN Code
                </label>
                <Input
                  id="hsnCode"
                  name="hsnCode"
                  value={formData.hsnCode}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="receiptUrl" className="text-sm font-medium">
                  Receipt URL
                </label>
                <Input
                  id="receiptUrl"
                  name="receiptUrl"
                  type="url"
                  value={formData.receiptUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/receipt.jpg"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/dashboard/accounting/expenses">
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Expense'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
