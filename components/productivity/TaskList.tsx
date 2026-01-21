'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import type { Task } from '@/types/base-modules'

interface TaskListProps {
  organizationId: string
  projectId?: string
}

export function TaskList({ organizationId, projectId }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  useEffect(() => {
    fetchTasks()
  }, [organizationId, projectId, page])

  async function fetchTasks() {
    try {
      setLoading(true)
      const url = projectId
        ? `/api/productivity/tasks?organizationId=${organizationId}&projectId=${projectId}&page=${page}&pageSize=${pageSize}`
        : `/api/productivity/tasks?organizationId=${organizationId}&page=${page}&pageSize=${pageSize}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setTasks(data.data.tasks)
        setTotal(data.data.total)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-4">Loading tasks...</div>
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900'
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900'
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900'
      default:
        return 'bg-gray-100 dark:bg-gray-700'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 dark:bg-green-900'
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900'
      case 'blocked':
        return 'bg-red-100 dark:bg-red-900'
      default:
        return 'bg-gray-100 dark:bg-gray-700'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tasks</h2>
        <Button onClick={() => {/* Open create modal */}}>Add Task</Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left">Title</th>
              <th className="p-4 text-left">Priority</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Due Date</th>
              <th className="p-4 text-left">Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="p-4 font-medium">{task.title}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </td>
                <td className="p-4">
                  {task.dueDate 
                    ? new Date(task.dueDate).toLocaleDateString('en-IN')
                    : '-'}
                </td>
                <td className="p-4">
                  {task.assignedTo.length > 0 
                    ? `${task.assignedTo.length} assignee(s)`
                    : 'Unassigned'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {total > pageSize && (
          <div className="p-4 flex justify-between">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {Math.ceil(total / pageSize)}
            </span>
            <Button
              variant="outline"
              disabled={page >= Math.ceil(total / pageSize)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
