'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useUpdateTask } from '@/lib/hooks/use-api'
import { TaskCard, type TaskCardTask } from '@/components/crm/tasks/TaskCard'
import { Badge } from '@/components/ui/badge'
import { addDays, endOfWeek } from 'date-fns'
import { cn } from '@/lib/utils/cn'

const KANBAN_COLUMNS = [
  { id: 'todo', title: 'To Do', status: 'pending' as const },
  { id: 'in_progress', title: 'In Progress', status: 'in_progress' as const },
  { id: 'due_soon', title: 'Due Soon', status: 'pending' as const },
  { id: 'completed', title: 'Completed', status: 'completed' as const },
]

function DraggableTaskCard({
  task,
  tenantId,
  onComplete,
  onRemind,
}: {
  task: TaskCardTask
  tenantId: string
  onComplete?: (id: string) => void
  onRemind?: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={isDragging ? 'opacity-50' : ''}>
      <div className="cursor-grab active:cursor-grabbing">
        <TaskCard
          task={task}
          tenantId={tenantId}
          onComplete={onComplete}
          onRemind={onRemind}
          isDragging={isDragging}
        />
      </div>
    </div>
  )
}

function KanbanColumn({
  columnId,
  title,
  tasks,
  tenantId,
  onComplete,
  onRemind,
}: {
  columnId: string
  title: string
  tasks: TaskCardTask[]
  tenantId: string
  onComplete?: (id: string) => void
  onRemind?: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-xl border-2 border-dashed border-muted p-3 min-h-[320px] transition-colors flex flex-col',
        isOver && 'ring-2 ring-primary bg-primary/5'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <Badge variant="secondary">{tasks.length}</Badge>
      </div>
      <div className="space-y-2 overflow-y-auto flex-1">
        {tasks.map((task) => (
          <DraggableTaskCard
            key={task.id}
            task={task}
            tenantId={tenantId}
            onComplete={onComplete}
            onRemind={onRemind}
          />
        ))}
      </div>
    </div>
  )
}

export interface TasksKanbanViewProps {
  tasks: TaskCardTask[]
  tenantId: string
  onComplete: (id: string) => void
  onRemind: (id: string) => void
  onStatusChange: (taskId: string, status: string, dueDate?: Date) => void
  className?: string
}

export function TasksKanbanView({
  tasks,
  tenantId,
  onComplete,
  onRemind,
  onStatusChange,
  className,
}: TasksKanbanViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const updateTask = useUpdateTask()

  const buckets = useMemo(() => {
    const endOfNext7 = endOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 })
    const todo: TaskCardTask[] = []
    const inProgress: TaskCardTask[] = []
    const dueSoon: TaskCardTask[] = []
    const completed: TaskCardTask[] = []

    tasks.forEach((t) => {
      const due = t.dueDate ? new Date(t.dueDate) : null
      const isOpen = t.status === 'pending' || t.status === 'in_progress'
      const isDueSoon = isOpen && due && due <= endOfNext7

      if (t.status === 'completed' || t.status === 'cancelled') {
        completed.push(t)
      } else if (isDueSoon) {
        dueSoon.push(t)
      } else if (t.status === 'in_progress') {
        inProgress.push(t)
      } else {
        todo.push(t)
      }
    })

    return [
      { id: 'todo', title: 'To Do', tasks: todo },
      { id: 'in_progress', title: 'In Progress', tasks: inProgress },
      { id: 'due_soon', title: 'Due Soon', tasks: dueSoon },
      { id: 'completed', title: 'Completed', tasks: completed },
    ]
  }, [tasks])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null)
      const taskId = String(event.active.id)
      const overId = event.over?.id
      if (overId == null) return
      const col = KANBAN_COLUMNS.find((c) => c.id === String(overId))
      if (!col) return
      const task = tasks.find((t) => t.id === taskId)
      if (!task || task.status === col.status) return

      if (col.id === 'due_soon') {
        const dueDate = endOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 })
        updateTask.mutate(
          { id: taskId, data: { status: 'pending', dueDate: dueDate.toISOString() } },
          { onSuccess: () => onStatusChange(taskId, 'pending', dueDate) }
        )
      } else {
        updateTask.mutate(
          { id: taskId, data: { status: col.status } },
          { onSuccess: () => onStatusChange(taskId, col.status) }
        )
      }
    },
    [tasks, updateTask, onStatusChange]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={cn('grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4', className)}>
        {buckets.map((col) => (
          <KanbanColumn
            key={col.id}
            columnId={col.id}
            title={col.title}
            tasks={col.tasks}
            tenantId={tenantId}
            onComplete={onComplete}
            onRemind={onRemind}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-1 scale-[1.02] shadow-xl">
            <TaskCard task={activeTask} tenantId={tenantId} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
