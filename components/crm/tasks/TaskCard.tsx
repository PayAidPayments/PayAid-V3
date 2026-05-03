'use client'

import Link from 'next/link'
import { format, isPast } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Calendar, User, Bell } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useTerms } from '@/lib/terminology/use-terms'

export interface TaskCardTask {
  id: string
  title: string
  description?: string | null
  priority: string
  status: string
  dueDate: string | null
  contact?: { id: string; name: string | null } | null
  assignedTo?: { id: string; name: string | null } | null
  reminderSentAt?: string | null
}

interface TaskCardProps {
  task: TaskCardTask
  tenantId: string
  onComplete?: (id: string) => void
  onRemind?: (id: string) => void
  isDragging?: boolean
  className?: string
}

function priorityDot(priority: string) {
  switch (priority) {
    case 'high':
      return 'bg-red-500'
    case 'medium':
      return 'bg-amber-500'
    default:
      return 'bg-gray-400'
  }
}

export function TaskCard({
  task,
  tenantId,
  onComplete,
  onRemind,
  isDragging,
  className,
}: TaskCardProps) {
  const { term } = useTerms()
  const clientName = task.contact?.name ?? `No ${term('contact').toLowerCase()}`
  const due = task.dueDate ? new Date(task.dueDate) : null
  const isOverdue = due && isPast(due) && task.status !== 'completed' && task.status !== 'cancelled'

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md',
        isDragging && 'opacity-80 shadow-lg',
        className
      )}
    >
      <div className="flex items-start gap-2">
        <div className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', priorityDot(task.priority))} />
        <div className="min-w-0 flex-1">
          <Link
            href={`/crm/${tenantId}/Tasks/${task.id}`}
            className="font-medium text-foreground hover:underline line-clamp-2"
          >
            {task.title}
          </Link>
          {task.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{task.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1" title={clientName}>
              <User className="h-3 w-3" />
              {clientName}
            </span>
            {due && (
              <span
                className={cn(
                  'flex items-center gap-1',
                  isOverdue && 'text-destructive font-medium'
                )}
              >
                <Calendar className="h-3 w-3" />
                {format(due, 'MMM d')}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between gap-1">
            <Badge
              variant={task.status === 'completed' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {task.status?.replace('_', ' ') ?? 'pending'}
            </Badge>
            <div className="flex gap-1">
              {task.status !== 'completed' && task.status !== 'cancelled' && onComplete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.preventDefault()
                    onComplete(task.id)
                  }}
                  title="Complete"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </Button>
              )}
              {onRemind && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.preventDefault()
                    onRemind(task.id)
                  }}
                  title="Send reminder"
                >
                  <Bell className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
