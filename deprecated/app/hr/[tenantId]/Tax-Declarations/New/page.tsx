'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface TaxCategory {
  id: string
  name: string
  code: string
  maxAmountInr?: number
}

interface Employee {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
}

export default function NewTaxDeclarationPage() {
  const router = useRouter()
  const params = useParams()
  const tenantId = params.tenantId as string
  const [formData, setFormData] = useState({
    employeeId: '',
    categoryId: '',
    financialYear: '2024-25',
    declaredAmountInr: '',
  })
  const [error, setError] = useState('')

  const { data: categoriesData } = useQuery<{ categories: TaxCategory[] }>({
    queryKey: ['tax-categories'],
    queryFn: async () => {
      const response = await fetch('/api/hr/tax-declarations/categories')
      if (!response.ok) throw new Error('Failed to fetch tax categories')
      return response.json()
    },
  })

  const { data: employeesData } = useQuery<{ employees: Employee[] }>({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await fetch('/api/hr/employees?limit=1000')
      if (!response.ok) throw new Error('Failed to fetch employees')
      return response.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/hr/tax-declarations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          declaredAmountInr: parseFloat(data.declaredAmountInr),
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create tax declaration')
      }
      return response.json()
    },
    onSuccess: (data) => {
      router.push(`/hr/${tenantId}/Tax-Declarations/${data.id}`)
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    createMutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const selectedCategory = categoriesData?.categories.find((c) => c.id === formData.categoryId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">New Tax Declaration</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Create a new tax declaration</p>
        </div>
        <Link href={`/hr/${tenantId}/Tax-Declarations`}>
          <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</Button>
        </Link>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Declaration Details</CardTitle>
          <CardDescription className="dark:text-gray-400">Enter the tax declaration information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="employeeId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Employee <span className="text-red-500">*</span>
                </label>
                <select
                  id="employeeId"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  required
                  className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
                >
                  <option value="">Select Employee</option>
                  {employeesData?.employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeCode} - {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="categoryId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tax Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                  className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
                >
                  <option value="">Select Category</option>
                  {categoriesData?.categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="financialYear" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Financial Year <span className="text-red-500">*</span>
                </label>
                <select
                  id="financialYear"
                  name="financialYear"
                  value={formData.financialYear}
                  onChange={handleChange}
                  required
                  className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
                >
                  <option value="2024-25">2024-25</option>
                  <option value="2025-26">2025-26</option>
                  <option value="2026-27">2026-27</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="declaredAmountInr" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Declared Amount ₹ <span className="text-red-500">*</span>
                </label>
                <Input
                  id="declaredAmountInr"
                  name="declaredAmountInr"
                  type="number"
                  step="0.01"
                  value={formData.declaredAmountInr}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 150000"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
                {selectedCategory?.maxAmountInr && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Maximum allowed: ₹{Number(selectedCategory.maxAmountInr).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href={`/hr/${tenantId}/Tax-Declarations`}>
                <Button type="button" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={createMutation.isPending} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                {createMutation.isPending ? 'Creating...' : 'Create Declaration'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
