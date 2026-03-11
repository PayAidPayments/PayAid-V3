'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Department {
  id: string
  name: string
}

interface Location {
  id: string
  name: string
  city: string
  state: string
}

export default function NewJobRequisitionPage() {
  const router = useRouter()
  const params = useParams()
  const tenantId = params.tenantId as string
  const [formData, setFormData] = useState({
    title: '',
    departmentId: '',
    locationId: '',
    employmentType: 'FULL_TIME' as 'FULL_TIME' | 'PART_TIME' | 'INTERN' | 'CONTRACT',
    budgetedCtcMinInr: '',
    budgetedCtcMaxInr: '',
    status: 'DRAFT' as 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'ON_HOLD' | 'CLOSED',
  })
  const [error, setError] = useState('')

  const { data: departmentsData } = useQuery<{ departments: Department[] }>({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await fetch('/api/hr/departments?isActive=true')
      if (!response.ok) throw new Error('Failed to fetch departments')
      return response.json()
    },
  })

  const { data: locationsData } = useQuery<{ locations: Location[] }>({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await fetch('/api/hr/locations?isActive=true')
      if (!response.ok) throw new Error('Failed to fetch locations')
      return response.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/hr/job-requisitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          departmentId: data.departmentId || undefined,
          locationId: data.locationId || undefined,
          budgetedCtcMinInr: data.budgetedCtcMinInr ? parseFloat(data.budgetedCtcMinInr) : undefined,
          budgetedCtcMaxInr: data.budgetedCtcMaxInr ? parseFloat(data.budgetedCtcMaxInr) : undefined,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create job requisition')
      }
      return response.json()
    },
    onSuccess: (data) => {
      router.push(`/hr/${tenantId}/Hiring/Job-Requisitions/${data.id}`)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">New Job Requisition</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Create a new job opening</p>
        </div>
        <Link href={`/hr/${tenantId}/Hiring/Job-Requisitions`}>
          <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</Button>
        </Link>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Job Requisition Details</CardTitle>
          <CardDescription className="dark:text-gray-400">Enter the job opening details below</CardDescription>
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
                <label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Senior Software Engineer"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="departmentId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Department
                </label>
                <select
                  id="departmentId"
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
                >
                  <option value="">Select Department</option>
                  {departmentsData?.departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="locationId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Location
                </label>
                <select
                  id="locationId"
                  name="locationId"
                  value={formData.locationId}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
                >
                  <option value="">Select Location</option>
                  {locationsData?.locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} - {loc.city}, {loc.state}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="employmentType" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Employment Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="employmentType"
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                  required
                  className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
                >
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="INTERN">Intern</option>
                  <option value="CONTRACT">Contract</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                  <option value="APPROVED">Approved</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="budgetedCtcMinInr" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Budgeted CTC (Min) ₹
                </label>
                <Input
                  id="budgetedCtcMinInr"
                  name="budgetedCtcMinInr"
                  type="number"
                  step="0.01"
                  value={formData.budgetedCtcMinInr}
                  onChange={handleChange}
                  placeholder="e.g., 500000"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="budgetedCtcMaxInr" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Budgeted CTC (Max) ₹
                </label>
                <Input
                  id="budgetedCtcMaxInr"
                  name="budgetedCtcMaxInr"
                  type="number"
                  step="0.01"
                  value={formData.budgetedCtcMaxInr}
                  onChange={handleChange}
                  placeholder="e.g., 800000"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href={`/hr/${tenantId}/Hiring/Job-Requisitions`}>
                <Button type="button" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={createMutation.isPending} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                {createMutation.isPending ? 'Creating...' : 'Create Requisition'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
