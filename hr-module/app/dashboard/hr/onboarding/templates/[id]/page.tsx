'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface OnboardingTask {
  id: string
  title: string
  description?: string
  assignedToRole: string
  dueDaysRelative: number
  order: number
}

interface OnboardingTemplate {
  id: string
  name: string
  description?: string
  isActive: boolean
  tasks: OnboardingTask[]
  createdAt: string
}

export default function OnboardingTemplateDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [showAddTask, setShowAddTask] = useState(false)
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedToRole: 'HR',
    dueDaysRelative: '0',
    order: '0',
  })
  const [error, setError] = useState('')

  const { data: template, refetch } = useQuery<OnboardingTemplate>({
    queryKey: ['onboarding-template', id],
    queryFn: async () => {
      const response = await fetch(`/api/hr/onboarding/templates/${id}`)
      if (!response.ok) throw new Error('Failed to fetch template')
      return response.json()
    },
  })

  const { data: tasksData, refetch: refetchTasks } = useQuery<{ tasks: OnboardingTask[] }>({
    queryKey: ['onboarding-template-tasks', id],
    queryFn: async () => {
      const response = await fetch(`/api/hr/onboarding/templates/${id}/tasks`)
      if (!response.ok) throw new Error('Failed to fetch tasks')
      return response.json()
    },
  })

  const createTaskMutation = useMutation({
    mutationFn: async (data: typeof taskForm) => {
      const response = await fetch(`/api/hr/onboarding/templates/${id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          dueDaysRelative: parseInt(data.dueDaysRelative),
          order: parseInt(data.order),
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create task')
      }
      return response.json()
    },
    onSuccess: () => {
      setShowAddTask(false)
      setTaskForm({
        title: '',
        description: '',
        assignedToRole: 'HR',
        dueDaysRelative: '0',
        order: '0',
      })
      refetchTasks()
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    createTaskMutation.mutate(taskForm)
  }

  if (!template) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const tasks = tasksData?.tasks || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
          <p className="mt-2 text-gray-600">Onboarding Template Details</p>
        </div>
        <Link href="/dashboard/hr/onboarding/templates">
          <Button variant="outline">Back</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">{template.description || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                {template.isActive ? (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Inactive</span>
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tasks ({tasks.length})</CardTitle>
              <CardDescription>Manage onboarding tasks for this template</CardDescription>
            </div>
            {!showAddTask && (
              <Button onClick={() => setShowAddTask(true)}>Add Task</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showAddTask && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Add New Task</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddTask} className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="title" className="text-sm font-medium text-gray-700">
                        Task Title <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="title"
                        value={taskForm.title}
                        onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                        required
                        placeholder="e.g., Setup Laptop, Complete Documentation"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="description" className="text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="description"
                        value={taskForm.description}
                        onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                        rows={3}
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                        placeholder="Task details..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="assignedToRole" className="text-sm font-medium text-gray-700">
                        Assigned To Role <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="assignedToRole"
                        value={taskForm.assignedToRole}
                        onChange={(e) => setTaskForm({ ...taskForm, assignedToRole: e.target.value })}
                        required
                        className="w-full h-10 rounded-md border border-gray-300 px-3"
                      >
                        <option value="HR">HR</option>
                        <option value="MANAGER">Manager</option>
                        <option value="IT">IT</option>
                        <option value="ADMIN">Admin</option>
                        <option value="FINANCE">Finance</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="dueDaysRelative" className="text-sm font-medium text-gray-700">
                        Due Days (from start) <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="dueDaysRelative"
                        type="number"
                        value={taskForm.dueDaysRelative}
                        onChange={(e) => setTaskForm({ ...taskForm, dueDaysRelative: e.target.value })}
                        required
                        placeholder="e.g., 0, 1, 7"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="order" className="text-sm font-medium text-gray-700">
                        Order <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="order"
                        type="number"
                        value={taskForm.order}
                        onChange={(e) => setTaskForm({ ...taskForm, order: e.target.value })}
                        required
                        placeholder="Display order"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => setShowAddTask(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createTaskMutation.isPending}>
                      {createTaskMutation.isPending ? 'Adding...' : 'Add Task'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No tasks added yet</p>
              <Button onClick={() => setShowAddTask(true)}>Add First Task</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Due Days</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>{task.order}</TableCell>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>{task.description || '-'}</TableCell>
                    <TableCell>{task.assignedToRole}</TableCell>
                    <TableCell>
                      {task.dueDaysRelative >= 0 ? '+' : ''}
                      {task.dueDaysRelative}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
