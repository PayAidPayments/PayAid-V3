'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Candidate {
  id: string
  fullName: string
  email: string
}

interface Employee {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
}

export default function NewInterviewPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    candidateId: '',
    roundName: '',
    scheduledAt: '',
    mode: 'VIDEO' as 'IN_PERSON' | 'VIDEO' | 'PHONE',
    interviewerId: '',
  })
  const [error, setError] = useState('')

  const { data: candidatesData } = useQuery<{ candidates: Candidate[] }>({
    queryKey: ['candidates'],
    queryFn: async () => {
      const response = await fetch('/api/hr/candidates?limit=1000')
      if (!response.ok) throw new Error('Failed to fetch candidates')
      return response.json()
    },
  })

  const { data: employeesData } = useQuery<{ employees: Employee[] }>({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await fetch('/api/hr/employees?limit=1000&status=ACTIVE')
      if (!response.ok) throw new Error('Failed to fetch employees')
      return response.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/hr/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          scheduledAt: new Date(data.scheduledAt).toISOString(),
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to schedule interview')
      }
      return response.json()
    },
    onSuccess: () => {
      router.push('/dashboard/hr/hiring/interviews')
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
          <h1 className="text-3xl font-bold text-gray-900">Schedule Interview</h1>
          <p className="mt-2 text-gray-600">Schedule a new interview round</p>
        </div>
        <Link href="/dashboard/hr/hiring/interviews">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interview Details</CardTitle>
          <CardDescription>Enter the interview scheduling information</CardDescription>
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
                <label htmlFor="candidateId" className="text-sm font-medium text-gray-700">
                  Candidate <span className="text-red-500">*</span>
                </label>
                <select
                  id="candidateId"
                  name="candidateId"
                  value={formData.candidateId}
                  onChange={handleChange}
                  required
                  className="w-full h-10 rounded-md border border-gray-300 px-3"
                >
                  <option value="">Select Candidate</option>
                  {candidatesData?.candidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.fullName} ({candidate.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="roundName" className="text-sm font-medium text-gray-700">
                  Round Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="roundName"
                  name="roundName"
                  value={formData.roundName}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Technical Round 1, HR Round"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="scheduledAt" className="text-sm font-medium text-gray-700">
                  Scheduled Date & Time <span className="text-red-500">*</span>
                </label>
                <Input
                  id="scheduledAt"
                  name="scheduledAt"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="mode" className="text-sm font-medium text-gray-700">
                  Mode <span className="text-red-500">*</span>
                </label>
                <select
                  id="mode"
                  name="mode"
                  value={formData.mode}
                  onChange={handleChange}
                  required
                  className="w-full h-10 rounded-md border border-gray-300 px-3"
                >
                  <option value="VIDEO">Video</option>
                  <option value="IN_PERSON">In Person</option>
                  <option value="PHONE">Phone</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="interviewerId" className="text-sm font-medium text-gray-700">
                  Interviewer <span className="text-red-500">*</span>
                </label>
                <select
                  id="interviewerId"
                  name="interviewerId"
                  value={formData.interviewerId}
                  onChange={handleChange}
                  required
                  className="w-full h-10 rounded-md border border-gray-300 px-3"
                >
                  <option value="">Select Interviewer</option>
                  {employeesData?.employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.employeeCode} - {employee.firstName} {employee.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/dashboard/hr/hiring/interviews">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Scheduling...' : 'Schedule Interview'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
