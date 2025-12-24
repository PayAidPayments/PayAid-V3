'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewPayrollCyclePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    runType: 'REGULAR' as 'REGULAR' | 'BONUS' | 'ARREARS',
  })
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/hr/payroll/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create payroll cycle')
      }
      return response.json()
    },
    onSuccess: (data) => {
      router.push(`/dashboard/hr/payroll/cycles/${data.id}`)
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
      [e.target.name]: e.target.type === 'number' ? parseInt(e.target.value) : e.target.value,
    })
  }

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Payroll Cycle</h1>
          <p className="mt-2 text-gray-600">Create a new payroll cycle</p>
        </div>
        <Link href="/dashboard/hr/payroll/cycles">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cycle Details</CardTitle>
          <CardDescription>Enter the payroll cycle information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="month" className="text-sm font-medium text-gray-700">
                  Month <span className="text-red-500">*</span>
                </label>
                <select
                  id="month"
                  name="month"
                  value={formData.month}
                  onChange={handleChange}
                  required
                  className="w-full h-10 rounded-md border border-gray-300 px-3"
                >
                  {months.map((month, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="year" className="text-sm font-medium text-gray-700">
                  Year <span className="text-red-500">*</span>
                </label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  value={formData.year}
                  onChange={handleChange}
                  required
                  min={2020}
                  max={2100}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="runType" className="text-sm font-medium text-gray-700">
                  Run Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="runType"
                  name="runType"
                  value={formData.runType}
                  onChange={handleChange}
                  required
                  className="w-full h-10 rounded-md border border-gray-300 px-3"
                >
                  <option value="REGULAR">Regular</option>
                  <option value="BONUS">Bonus</option>
                  <option value="ARREARS">Arrears</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/dashboard/hr/payroll/cycles">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Cycle'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
