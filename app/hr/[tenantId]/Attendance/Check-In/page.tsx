'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageLoading } from '@/components/ui/loading'

export default function HRAttendanceCheckInPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Check In / Check Out</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Record employee attendance</p>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Attendance</CardTitle>
          <CardDescription className="dark:text-gray-400">Select employee and check in or check out</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="employee" className="dark:text-gray-300">Employee *</Label>
            <select
              required
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3 mt-1"
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
            <Label htmlFor="remarks" className="dark:text-gray-300">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder="Add any remarks..."
              className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 mt-1"
            />
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleCheckIn}
              disabled={checkIn.isPending || !selectedEmployeeId}
              className="flex-1 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
            >
              {checkIn.isPending ? 'Checking In...' : 'Check In'}
            </Button>
            <Button
              onClick={handleCheckOut}
              disabled={checkOut.isPending || !selectedEmployeeId}
              variant="outline"
              className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {checkOut.isPending ? 'Checking Out...' : 'Check Out'}
            </Button>
          </div>

          {(checkIn.error || checkOut.error) && (
            <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              {checkIn.error instanceof Error ? checkIn.error.message : checkOut.error instanceof Error ? checkOut.error.message : 'An error occurred'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
