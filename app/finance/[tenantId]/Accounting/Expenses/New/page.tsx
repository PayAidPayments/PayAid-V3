'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
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

export default function FinanceExpensesNewPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
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
    employeeId: '',
    isRecurring: false,
    recurringFrequency: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
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

  // Fetch employees for employee expense selection
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await fetch('/api/hr/employees?limit=1000', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) return { employees: [] }
      return response.json()
    },
  })

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
          employeeId: formData.employeeId || undefined,
          isRecurring: formData.isRecurring,
          recurringFrequency: formData.isRecurring ? formData.recurringFrequency : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create expense')
      }

      router.push(`/finance/${tenantId}/Accounting/Expenses`)
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">New Expense</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Record a new business expense</p>
        </div>
        <Link href={`/finance/${tenantId}/Accounting/Expenses`}>
          <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</Button>
        </Link>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Expense Information</CardTitle>
          <CardDescription className="dark:text-gray-400">Enter the expense details below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="description" className="text-sm font-medium dark:text-gray-300">
                  Description *
                </label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-medium dark:text-gray-300">
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
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium dark:text-gray-300">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3 py-2 text-sm"
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
                <label htmlFor="vendor" className="text-sm font-medium dark:text-gray-300">
                  Vendor
                </label>
                <Input
                  id="vendor"
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="date" className="text-sm font-medium dark:text-gray-300">
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
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="gstAmount" className="text-sm font-medium dark:text-gray-300">
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
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="hsnCode" className="text-sm font-medium dark:text-gray-300">
                  HSN Code
                </label>
                <Input
                  id="hsnCode"
                  name="hsnCode"
                  value={formData.hsnCode}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="receiptUrl" className="text-sm font-medium dark:text-gray-300">
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
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="employeeId" className="text-sm font-medium dark:text-gray-300">
                  Employee (for reimbursement)
                </label>
                <select
                  id="employeeId"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3 py-2 text-sm"
                  disabled={isSubmitting}
                >
                  <option value="">Not an employee expense</option>
                  {employeesData?.employees?.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeCode} - {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    name="isRecurring"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                    disabled={isSubmitting}
                    className="h-4 w-4"
                  />
                  <label htmlFor="isRecurring" className="text-sm font-medium dark:text-gray-300">
                    Recurring Expense
                  </label>
                </div>
                {formData.isRecurring && (
                  <select
                    name="recurringFrequency"
                    value={formData.recurringFrequency}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3 py-2 text-sm mt-2"
                    disabled={isSubmitting}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Link href={`/finance/${tenantId}/Accounting/Expenses`}>
                <Button type="button" variant="outline" disabled={isSubmitting} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                {isSubmitting ? 'Creating...' : 'Create Expense'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
