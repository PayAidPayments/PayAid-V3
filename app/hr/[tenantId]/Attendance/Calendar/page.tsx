'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoading } from '@/components/ui/loading'
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

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

export default function HRAttendanceCalendarPage() {
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
    if (!status) return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    const colors: Record<string, string> = {
      PRESENT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      ABSENT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      HALF_DAY: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      HOLIDAY: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  if (isLoading) {
    return <PageLoading message="Loading attendance calendar..." fullScreen={false} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Attendance Calendar</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">View employee attendance for the month</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
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
            className="h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
          />
        </div>
      </div>

      {!selectedEmployeeId ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
            <p>Please select an employee to view attendance calendar</p>
          </CardContent>
        </Card>
      ) : calendarData ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Present</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {calendarData.statistics.presentDays}
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Absent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {calendarData.statistics.absentDays}
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Half Day</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {calendarData.statistics.halfDays}
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Working Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold dark:text-gray-100">
                  {calendarData.statistics.totalWorkingDays}
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Holidays</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {calendarData.statistics.holidays}
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold dark:text-gray-100">
                  {calendarData.statistics.totalWorkHours.toFixed(1)}h
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">
                {format(currentMonth, 'MMMM yyyy')} - Attendance Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center font-semibold text-gray-600 dark:text-gray-400 py-2">
                    {day}
                  </div>
                ))}

                {daysInMonth.map((day) => {
                  const dateStr = day.toISOString().split('T')[0]
                  const dayData = calendarData.calendar[dateStr]

                  if (!dayData) {
                    return (
                      <div
                        key={dateStr}
                        className="aspect-square border border-gray-200 dark:border-gray-700 rounded p-2 text-center dark:bg-gray-700"
                      >
                        <div className="text-sm font-medium dark:text-gray-300">{day.getDate()}</div>
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
