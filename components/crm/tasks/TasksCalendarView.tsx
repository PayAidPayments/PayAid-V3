'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
} from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface TaskItem {
  id: string
  title: string
  dueDate: string | null
  priority?: string
  status?: string
}

interface TasksCalendarViewProps {
  tasks: TaskItem[]
  tenantId: string
  currentMonth: Date
  onMonthChange: (date: Date) => void
  className?: string
}

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function TasksCalendarView({
  tasks,
  tenantId,
  currentMonth,
  onMonthChange,
  className,
}: TasksCalendarViewProps) {
  const tasksByDay = useMemo(() => {
    const map: Record<string, TaskItem[]> = {}
    tasks.forEach((t) => {
      if (!t.dueDate) return
      const key = format(new Date(t.dueDate), 'yyyy-MM-dd')
      if (!map[key]) map[key] = []
      map[key].push(t)
    })
    return map
  }, [tasks])

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    const cells: Date[] = []
    let d = calStart
    while (d <= calEnd) {
      cells.push(d)
      d = addDays(d, 1)
    }
    const result: Date[][] = []
    for (let i = 0; i < cells.length; i += 7) {
      result.push(cells.slice(i, i + 7))
    }
    return result
  }, [currentMonth])

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onMonthChange(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onMonthChange(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {WEEKDAY_HEADERS.map((day) => (
            <div
              key={day}
              className="bg-muted/50 py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
          {weeks.flatMap((week) =>
            week.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const dayTasks = tasksByDay[key] ?? []
              const inMonth = isSameMonth(day, currentMonth)
              const today = isToday(day)

              return (
                <div
                  key={key}
                  className={cn(
                    'min-h-[100px] bg-card p-2 flex flex-col',
                    !inMonth && 'opacity-50'
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                      today && 'bg-primary text-primary-foreground',
                      inMonth && !today && 'text-foreground',
                      !inMonth && 'text-muted-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  <div className="mt-1 space-y-1 flex-1 overflow-y-auto">
                    {dayTasks.slice(0, 3).map((t) => (
                      <Link
                        key={t.id}
                        href={`/crm/${tenantId}/Tasks/${t.id}`}
                        className={cn(
                          'block text-xs rounded px-1.5 py-0.5 truncate border-l-2',
                          t.priority === 'high' && 'border-red-500 bg-red-50 dark:bg-red-900/20',
                          t.priority === 'medium' && 'border-amber-500 bg-amber-50 dark:bg-amber-900/20',
                          (!t.priority || t.priority === 'low') && 'border-gray-400 bg-muted/50'
                        )}
                        title={t.title}
                      >
                        {t.title}
                      </Link>
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{dayTasks.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
