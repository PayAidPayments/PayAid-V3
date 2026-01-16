'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function HRLeaveApplyPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
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
      router.push(`/hr/${tenantId}/Leave/Requests`)
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Apply for Leave</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Submit a new leave request</p>
        </div>
        <Link href={`/hr/${tenantId}/Leave/Requests`}>
          <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Back</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Leave Request Details</CardTitle>
            <CardDescription className="dark:text-gray-400">Fill in the details to apply for leave</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId" className="dark:text-gray-300">Employee *</Label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.employeeCode} - {emp.firstName} {emp.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaveTypeId" className="dark:text-gray-300">Leave Type *</Label>
                <Select
                  value={formData.leaveTypeId}
                  onValueChange={(value) => setFormData({ ...formData, leaveTypeId: value })}
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes?.leaveTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} {type.isPaid ? '(Paid)' : '(Unpaid)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBalance && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Available balance: {selectedBalance.balance} days
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate" className="dark:text-gray-300">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="dark:text-gray-300">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  min={formData.startDate}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isHalfDay"
                    checked={formData.isHalfDay}
                    onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isHalfDay" className="dark:text-gray-300">Half Day</Label>
                </div>
                {formData.isHalfDay && (
                  <Select
                    value={formData.halfDayType}
                    onValueChange={(value: 'FIRST_HALF' | 'SECOND_HALF') => setFormData({ ...formData, halfDayType: value })}
                  >
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIRST_HALF">First Half</SelectItem>
                      <SelectItem value="SECOND_HALF">Second Half</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="reason" className="dark:text-gray-300">Reason *</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                  rows={4}
                  placeholder="Enter reason for leave..."
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>
            </div>

            {createLeaveRequest.error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                {createLeaveRequest.error instanceof Error ? createLeaveRequest.error.message : 'Failed to create leave request'}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={createLeaveRequest.isPending}
                className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              >
                {createLeaveRequest.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
              <Link href={`/hr/${tenantId}/Leave/Requests`}>
                <Button type="button" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
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
