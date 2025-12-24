'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ApplyLeavePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    isHalfDay: false,
    halfDayType: 'FIRST_HALF' as 'FIRST_HALF' | 'SECOND_HALF',
    reason: '',
  })

  const { data: employees } = useQuery<{ employees: Array<{ id: string; employeeCode: string; firstName: string; lastName: string }> }>({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await fetch('/api/hr/employees?limit=1000')
      if (!response.ok) throw new Error('Failed to fetch employees')
      return response.json()
    },
  })

  const { data: leaveTypes } = useQuery<{ leaveTypes: Array<{ id: string; name: string; code: string; isPaid: boolean }> }>({
    queryKey: ['leave-types'],
    queryFn: async () => {
      const response = await fetch('/api/hr/leave/types?isActive=true')
      if (!response.ok) throw new Error('Failed to fetch leave types')
      return response.json()
    },
  })

  const { data: balances } = useQuery<{ balances: Array<{ leaveType: { id: string; name: string }; balance: number }> }>({
    queryKey: ['leave-balances', formData.employeeId],
    queryFn: async () => {
      if (!formData.employeeId) return null
      const response = await fetch(`/api/hr/leave/balances?employeeId=${formData.employeeId}`)
      if (!response.ok) throw new Error('Failed to fetch leave balances')
      return response.json()
    },
    enabled: !!formData.employeeId,
  })

  const createLeaveRequest = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/hr/leave/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          startDate: new Date(data.startDate).toISOString(),
          endDate: new Date(data.endDate).toISOString(),
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create leave request')
      }
      return response.json()
    },
    onSuccess: () => {
      router.push('/dashboard/hr/leave/requests')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createLeaveRequest.mutate(formData)
  }

  const selectedBalance = balances?.balances.find(
    (b) => b.leaveType.id === formData.leaveTypeId
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Apply for Leave</h1>
          <p className="mt-2 text-gray-600">Submit a new leave request</p>
        </div>
        <Link href="/dashboard/hr/leave/requests">
          <Button variant="outline">Back</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Leave Request Details</CardTitle>
            <CardDescription>Fill in the details to apply for leave</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee *
              </label>
              <select
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full h-10 rounded-md border border-gray-300 px-3"
              >
                <option value="">Select Employee</option>
                {employees?.employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeCode} - {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leave Type *
              </label>
              <select
                required
                value={formData.leaveTypeId}
                onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                className="w-full h-10 rounded-md border border-gray-300 px-3"
              >
                <option value="">Select Leave Type</option>
                {leaveTypes?.leaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} {type.isPaid ? '(Paid)' : '(Unpaid)'}
                  </option>
                ))}
              </select>
              {selectedBalance && (
                <p className="text-sm text-gray-500 mt-1">
                  Available Balance: {selectedBalance.balance} days
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full h-10 rounded-md border border-gray-300 px-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full h-10 rounded-md border border-gray-300 px-3"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isHalfDay}
                  onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Half Day</span>
              </label>
              {formData.isHalfDay && (
                <select
                  value={formData.halfDayType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      halfDayType: e.target.value as 'FIRST_HALF' | 'SECOND_HALF',
                    })
                  }
                  className="mt-2 w-full h-10 rounded-md border border-gray-300 px-3"
                >
                  <option value="FIRST_HALF">First Half</option>
                  <option value="SECOND_HALF">Second Half</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason *
              </label>
              <textarea
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full h-24 rounded-md border border-gray-300 px-3 py-2"
                placeholder="Enter reason for leave..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={createLeaveRequest.isPending}>
                {createLeaveRequest.isPending ? 'Submitting...' : 'Submit Leave Request'}
              </Button>
              <Link href="/dashboard/hr/leave/requests">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
