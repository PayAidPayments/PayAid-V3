'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Plus, User } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_COLUMNS = [
  { id: 'TODO', name: 'To Do', color: 'bg-gray-100' },
  { id: 'IN_PROGRESS', name: 'In Progress', color: 'bg-yellow-100' },
  { id: 'REVIEW', name: 'Review', color: 'bg-blue-100' },
  { id: 'DONE', name: 'Done', color: 'bg-green-100' },
]

function KanbanBoard({ projectId }: { projectId: string | null }) {
  const queryClient = useQueryClient()
  const [draggedTask, setDraggedTask] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => {
      const url = projectId
        ? `/api/projects/${projectId}/tasks`
        : '/api/tasks?limit=100'
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch tasks')
      return response.json()
    },
    enabled: true,
  })

  const updateTask = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error('Failed to update task')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] })
    },
  })

  const tasks = data?.tasks || []

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task: any) => {
      // Map task statuses to kanban columns
      if (status === 'TODO') {
        return task.status === 'pending' || task.status === 'TODO'
      }
      if (status === 'IN_PROGRESS') {
        return task.status === 'in_progress' || task.status === 'IN_PROGRESS'
      }
      if (status === 'REVIEW') {
        return task.status === 'review' || task.status === 'REVIEW'
      }
      if (status === 'DONE') {
        return task.status === 'completed' || task.status === 'DONE'
      }
      return false
    })
  }

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault()
    if (!draggedTask) return

    // Map kanban status to task status
    const statusMap: Record<string, string> = {
      TODO: 'pending',
      IN_PROGRESS: 'in_progress',
      REVIEW: 'review',
      DONE: 'completed',
    }

    const newStatus = statusMap[targetStatus] || targetStatus.toLowerCase()
    await updateTask.mutateAsync({ id: draggedTask, status: newStatus })
    setDraggedTask(null)
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    }
    return colors[priority?.toLowerCase() || 'medium'] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUS_COLUMNS.map((column) => {
        const columnTasks = getTasksByStatus(column.id)
        return (
          <div
            key={column.id}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <Card className="h-full">
              <CardHeader className={`${column.color} pb-3`}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {column.name}
                  </CardTitle>
                  <span className="text-xs bg-white px-2 py-1 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 p-3 min-h-[400px]">
                {columnTasks.map((task: any) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    className="p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-move"
                  >
                    <div className="font-medium text-sm mb-2">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {task.description}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority || 'medium'}
                      </span>
                      {task.assignedTo && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <User className="h-3 w-3" />
                          <span>{task.assignedTo.name?.split(' ')[0] || 'Unassigned'}</span>
                        </div>
                      )}
                    </div>
                    {task.dueDate && (
                      <div className="text-xs text-gray-500 mt-2">
                        Due: {format(new Date(task.dueDate), 'MMM dd')}
                      </div>
                    )}
                  </div>
                ))}
                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No tasks
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}

function KanbanPageContent() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects?limit=100', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch projects')
      return response.json()
    },
  })

  const projects = projectsData?.projects || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/projects">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Kanban Board</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Drag and drop tasks to update their status
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedProject || ''}
            onChange={(e) => setSelectedProject(e.target.value || null)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Tasks</option>
            {projects.map((project: any) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <Link href="/dashboard/tasks/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <KanbanBoard projectId={selectedProject} />
        </CardContent>
      </Card>
    </div>
  )
}

export default function KanbanPage() {
  return <KanbanPageContent />
}

