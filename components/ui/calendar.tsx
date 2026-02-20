'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'

export interface CalendarProps {
  selected?: Date | { from?: Date; to?: Date }
  onSelect?: (date: Date | undefined | { from?: Date; to?: Date }) => void
  mode?: 'single' | 'range'
  className?: string
}

export function Calendar({ selected, onSelect, mode = 'single', className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay()

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleDateClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    onSelect?.(date)
  }

  const isSelected = (day: number) => {
    if (!selected) return false
    const selectedDate = selected instanceof Date ? selected : selected.from
    if (!selectedDate) return false
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  }

  return (
    <div className={cn('p-3', className)}>
      <div className="flex items-center justify-between mb-4">
        <Button onClick={prevMonth} variant="ghost" size="icon">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <Button onClick={nextMonth} variant="ghost" size="icon">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
            {day}
          </div>
        ))}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={cn(
                'p-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800',
                isSelected(day) && 'bg-purple-500 text-white hover:bg-purple-600'
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
