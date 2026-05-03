'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

export default function CheckInPage() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [remarks, setRemarks] = useState('')

  const { data: employees } = useQuery<{ employees: Array<{ id: string; employeeCode: string; firstName: string; lastName: string }> }>({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await fetch('/api/hr/employees?limit=1000')
      if (!response.ok) throw new Error('Failed to fetch employees')
      return response.json()
    },
  })

  const checkIn = useMutation({
    mutationFn: async (data: { employeeId: string; remarks?: string }) => {
      const response = await fetch('/api/hr/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to check in')
      }
      return response.json()
    },
    onSuccess: () => {
      alert('Checked in successfully!')
      setRemarks('')
    },
  })

  const checkOut = useMutation({
    mutationFn: async (data: { employeeId: string; remarks?: string }) => {
      const response = await fetch('/api/hr/attendance/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to check out')
      }
      return response.json()
    },
    onSuccess: () => {
      alert('Checked out successfully!')
      setRemarks('')
    },
  })

  const handleCheckIn = () => {
    if (!selectedEmployeeId) {
      alert('Please select an employee')
      return
    }
    checkIn.mutate({ employeeId: selectedEmployeeId, remarks })
  }

  const handleCheckOut = () => {
    if (!selectedEmployeeId) {
      alert('Please select an employee')
      return
    }
    checkOut.mutate({ employeeId: selectedEmployeeId, remarks })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Check In / Check Out</h1>
        <p className="mt-2 text-gray-600">Record employee attendance</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
          <CardDescription>Select employee and check in or check out</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee *
            </label>
            <select
              required
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
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
              Remarks (Optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full h-24 rounded-md border border-gray-300 px-3 py-2"
              placeholder="Enter any remarks..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleCheckIn}
              disabled={checkIn.isPending || !selectedEmployeeId}
              className="flex-1"
            >
              {checkIn.isPending ? 'Checking In...' : 'Check In'}
            </Button>
            <Button
              onClick={handleCheckOut}
              disabled={checkOut.isPending || !selectedEmployeeId}
              variant="outline"
              className="flex-1"
            >
              {checkOut.isPending ? 'Checking Out...' : 'Check Out'}
            </Button>
          </div>

          <div className="text-sm text-gray-500 text-center pt-4 border-t">
            Current Time: {format(new Date(), 'MMM dd, yyyy HH:mm:ss')}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
