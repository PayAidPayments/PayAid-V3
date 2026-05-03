'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'

interface AttendanceCalendar {
  calendar: Record<string, {
    date: string
    day: number
    isHoliday: boolean
    holidayName?: string
    isOptional: boolean
    attendance: {
      status: string
      checkInTime?: string
      checkOutTime?: string
      workHours?: number
    } | null
  }>
  statistics: {
    presentDays: number
    absentDays: number
    halfDays: number
    totalWorkingDays: number
    totalWorkHours: number
    holidays: number
  }
}

export default function AttendanceCalendarPage() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const { data: employees } = useQuery<{ employees: Array<{ id: string; employeeCode: string; firstName: string; lastName: string }> }>({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await fetch('/api/hr/employees?limit=1000')
      if (!response.ok) throw new Error('Failed to fetch employees')
      return response.json()
    },
  })

  const { data: calendarData, isLoading } = useQuery<AttendanceCalendar>({
    queryKey: ['attendance-calendar', selectedEmployeeId, currentMonth.getMonth() + 1, currentMonth.getFullYear()],
    queryFn: async () => {
      if (!selectedEmployeeId) return null
      const month = currentMonth.getMonth() + 1
      const year = currentMonth.getFullYear()
      const response = await fetch(`/api/hr/attendance/calendar?employeeId=${selectedEmployeeId}&month=${month}&year=${year}`)
      if (!response.ok) throw new Error('Failed to fetch attendance calendar')
      return response.json()
    },
    enabled: !!selectedEmployeeId,
  })

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-600'
    const colors: Record<string, string> = {
      PRESENT: 'bg-green-100 text-green-800',
      ABSENT: 'bg-red-100 text-red-800',
      HALF_DAY: 'bg-yellow-100 text-yellow-800',
      HOLIDAY: 'bg-blue-100 text-blue-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-600'
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Calendar</h1>
          <p className="mt-2 text-gray-600">View employee attendance for the month</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="h-10 rounded-md border border-gray-300 px-3"
          >
            <option value="">Select Employee</option>
            {employees?.employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.employeeCode} - {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
          <input
            type="month"
            value={`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-')
              setCurrentMonth(new Date(parseInt(year), parseInt(month) - 1))
            }}
            className="h-10 rounded-md border border-gray-300 px-3"
          />
        </div>
      </div>

      {!selectedEmployeeId ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p>Please select an employee to view attendance calendar</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-64">Loading...</div>
      ) : calendarData ? (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Present</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {calendarData.statistics.presentDays}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Absent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {calendarData.statistics.absentDays}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Half Day</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {calendarData.statistics.halfDays}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Working Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {calendarData.statistics.totalWorkingDays}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Holidays</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {calendarData.statistics.holidays}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Total Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {calendarData.statistics.totalWorkHours.toFixed(1)}h
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar Grid */}
          <Card>
            <CardHeader>
              <CardTitle>
                {format(currentMonth, 'MMMM yyyy')} - Attendance Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {daysInMonth.map((day) => {
                  const dateStr = day.toISOString().split('T')[0]
                  const dayData = calendarData.calendar[dateStr]

                  if (!dayData) {
                    return (
                      <div
                        key={dateStr}
                        className="aspect-square border border-gray-200 rounded p-2 text-center"
                      >
                        <div className="text-sm font-medium">{day.getDate()}</div>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={dateStr}
                      className={`aspect-square border rounded p-2 text-center ${getStatusColor(
                        dayData.attendance?.status || (dayData.isHoliday ? 'HOLIDAY' : null)
                      )}`}
                    >
                      <div className="text-sm font-medium">{dayData.day}</div>
                      {dayData.isHoliday && (
                        <div className="text-xs mt-1">{dayData.holidayName}</div>
                      )}
                      {dayData.attendance && (
                        <div className="text-xs mt-1">
                          {dayData.attendance.checkInTime
                            ? format(new Date(dayData.attendance.checkInTime), 'HH:mm')
                            : '-'}
                          {dayData.attendance.checkOutTime && (
                            <span className="ml-1">
                              - {format(new Date(dayData.attendance.checkOutTime), 'HH:mm')}
                            </span>
                          )}
                        </div>
                      )}
                      {dayData.attendance?.workHours && (
                        <div className="text-xs mt-1">
                          {dayData.attendance.workHours.toFixed(1)}h
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
