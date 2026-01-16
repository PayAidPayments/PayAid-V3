'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react'
import Link from 'next/link'

interface Appointment {
  id: string
  contactName: string
  serviceName?: string
  assignedToName?: string
  appointmentDate: string
  startTime: string
  endTime?: string
  status: string
  service?: {
    color?: string
  }
}

interface CalendarViewProps {
  appointments: Appointment[]
  loading: boolean
  token: string
}

export function CalendarView({ appointments, loading, token }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [calendarData, setCalendarData] = useState<any>(null)

  useEffect(() => {
    fetchCalendarData()
  }, [currentDate, view])

  const fetchCalendarData = async () => {
    try {
      const response = await fetch(
        `/api/appointments/calendar?view=${view}&date=${currentDate.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setCalendarData(data)
      }
    } catch (error) {
      console.error('Failed to fetch calendar data:', error)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getAppointmentsForDate = (date: Date | null) => {
    if (!date || !calendarData?.grouped) return []
    const dateKey = date.toISOString().split('T')[0]
    return calendarData.grouped[dateKey] || []
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: 'bg-blue-500',
      CONFIRMED: 'bg-green-500',
      IN_PROGRESS: 'bg-yellow-500',
      COMPLETED: 'bg-gray-500',
      CANCELLED: 'bg-red-500',
      NO_SHOW: 'bg-orange-500',
    }
    return colors[status] || 'bg-gray-500'
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const isToday = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading calendar...</p>
      </div>
    )
  }

  if (view === 'month') {
    const days = getDaysInMonth(currentDate)
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
      <div className="space-y-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {monthName}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant={view === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('month')}
            >
              Month
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('week')}
            >
              Week
            </Button>
            <Button
              variant={view === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('day')}
            >
              Day
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {/* Week day headers */}
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2"
                >
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {days.map((date, index) => {
                const dayAppointments = getAppointmentsForDate(date)
                const isCurrentDay = isToday(date)

                return (
                  <div
                    key={index}
                    className={`min-h-[100px] border border-gray-200 dark:border-gray-700 rounded-lg p-2 ${
                      isCurrentDay
                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700'
                        : 'bg-white dark:bg-gray-800'
                    }`}
                  >
                    {date && (
                      <>
                        <div
                          className={`text-sm font-medium mb-1 ${
                            isCurrentDay
                              ? 'text-purple-700 dark:text-purple-300'
                              : 'text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 3).map((apt: Appointment) => (
                            <Link
                              key={apt.id}
                              href={`/dashboard/appointments/${apt.id}`}
                              className="block"
                            >
                              <div
                                className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${
                                  apt.service?.color
                                    ? `bg-[${apt.service.color}] text-white`
                                    : `${getStatusColor(apt.status)} text-white`
                                }`}
                                style={
                                  apt.service?.color
                                    ? { backgroundColor: apt.service.color }
                                    : undefined
                                }
                                title={`${apt.contactName} - ${formatTime(apt.startTime)}`}
                              >
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTime(apt.startTime)}
                                </div>
                                <div className="truncate">{apt.contactName}</div>
                              </div>
                            </Link>
                          ))}
                          {dayAppointments.length > 3 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                              +{dayAppointments.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Week and Day views can be added later
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Week and Day views coming soon. Please use Month view for now.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setView('month')}
        >
          Switch to Month View
        </Button>
      </CardContent>
    </Card>
  )
}

