'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger } from '@/components/ui/custom-select'
import { MessageCircle } from 'lucide-react'

export default function HRLeaveApplyPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const router = useRouter()
  const createLeaveRequestIdempotencyKey = useMemo(
    () =>
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? `hr:leave-request:create:${crypto.randomUUID()}`
        : `hr:leave-request:create:${Date.now()}`,
    []
  )
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
        headers: {
          'Content-Type': 'application/json',
          'x-idempotency-key': createLeaveRequestIdempotencyKey,
        },
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
          <Button
            variant="outline"
            disabled={createLeaveRequest.isPending}
            title={createLeaveRequest.isPending ? 'Please wait' : 'Back to leave requests'}
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Back
          </Button>
        </Link>
      </div>

      {/* WhatsApp Leave CTA */}
      <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
        <CardContent className="py-3 px-4 flex flex-wrap items-center gap-3">
          <MessageCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Apply via WhatsApp</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Submit leave on the go. Ensure your number is linked in HR Settings to use the WhatsApp leave flow.</p>
          </div>
          <Link href={`/hr/${tenantId}/Settings`}>
            <Button variant="outline" size="sm" className="border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300">
              HR Settings
            </Button>
          </Link>
        </CardContent>
      </Card>

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
                <CustomSelect
                  value={formData.employeeId}
                  onValueChange={(value: string) => setFormData({ ...formData, employeeId: value })}
                  placeholder="Select employee"
                >
                  <CustomSelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    {employees?.employees.map((emp) => (
                      <CustomSelectItem key={emp.id} value={emp.id}>
                        {emp.employeeCode} - {emp.firstName} {emp.lastName}
                      </CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaveTypeId" className="dark:text-gray-300">Leave Type *</Label>
                <CustomSelect
                  value={formData.leaveTypeId}
                  onValueChange={(value: string) => setFormData({ ...formData, leaveTypeId: value })}
                  placeholder="Select leave type"
                >
                  <CustomSelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    {leaveTypes?.leaveTypes.map((type) => (
                      <CustomSelectItem key={type.id} value={type.id}>
                        {type.name} {type.isPaid ? '(Paid)' : '(Unpaid)'}
                      </CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
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
                  <CustomSelect
                    value={formData.halfDayType}
                    onValueChange={(value: string) => setFormData({ ...formData, halfDayType: value as 'FIRST_HALF' | 'SECOND_HALF' })}
                    placeholder="Half day type"
                  >
                    <CustomSelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                    </CustomSelectTrigger>
                    <CustomSelectContent>
                      <CustomSelectItem value="FIRST_HALF">First Half</CustomSelectItem>
                      <CustomSelectItem value="SECOND_HALF">Second Half</CustomSelectItem>
                    </CustomSelectContent>
                  </CustomSelect>
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
                title={createLeaveRequest.isPending ? 'Please wait' : 'Submit leave request'}
                className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              >
                {createLeaveRequest.isPending ? 'Submitting…' : 'Submit Request'}
              </Button>
              <Link href={`/hr/${tenantId}/Leave/Requests`}>
                <Button
                  type="button"
                  variant="outline"
                  disabled={createLeaveRequest.isPending}
                  title={createLeaveRequest.isPending ? 'Please wait' : 'Cancel and return'}
                  className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>

      <Card className="dark:bg-gray-800 dark:border-gray-700 border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="dark:text-gray-100 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            Apply via WhatsApp
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Employees can apply for leave by sending a message to the PayAid WhatsApp bot. Configure the bot in Settings and share the number with your team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Example message format:</p>
          <code className="block p-3 rounded-md bg-gray-100 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200">
            Apply leave from 2026-02-25 to 2026-02-26, CL, Personal work
          </code>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Leave types: CL, SL, PL, EL, ML, HL. The bot uses <strong>POST /api/hr/whatsapp/leave/apply</strong>; connect your WhatsApp Business API webhook to this endpoint.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
