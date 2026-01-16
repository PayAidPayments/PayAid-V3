'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export default function HRPayrollCyclesNewPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
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
      router.push(`/hr/${tenantId}/Payroll/Cycles/${data.id}`)
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
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">New Payroll Cycle</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Create a new payroll cycle</p>
        </div>
        <Link href={`/hr/${tenantId}/Payroll/Cycles`}>
          <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</Button>
        </Link>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Cycle Details</CardTitle>
          <CardDescription className="dark:text-gray-400">Enter the payroll cycle information</CardDescription>
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
                <Label htmlFor="month" className="dark:text-gray-300">
                  Month <span className="text-red-500">*</span>
                </Label>
                <select
                  id="month"
                  name="month"
                  value={formData.month}
                  onChange={handleChange}
                  required
                  className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
                >
                  {months.map((month, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year" className="dark:text-gray-300">
                  Year <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  value={formData.year}
                  onChange={handleChange}
                  required
                  min={2020}
                  max={2100}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="runType" className="dark:text-gray-300">
                  Run Type <span className="text-red-500">*</span>
                </Label>
                <select
                  id="runType"
                  name="runType"
                  value={formData.runType}
                  onChange={handleChange}
                  required
                  className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
                >
                  <option value="REGULAR">Regular</option>
                  <option value="BONUS">Bonus</option>
                  <option value="ARREARS">Arrears</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Link href={`/hr/${tenantId}/Payroll/Cycles`}>
                <Button type="button" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={createMutation.isPending} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                {createMutation.isPending ? 'Creating...' : 'Create Cycle'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
