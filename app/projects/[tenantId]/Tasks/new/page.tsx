'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger } from '@/components/ui/custom-select'
import { getAuthHeaders, apiRequest } from '@/lib/api/client'
import { ArrowLeft } from 'lucide-react'

export default function NewTaskPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const [formData, setFormData] = useState({
    projectId: '',
    name: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    assignedToId: '',
    startDate: '',
    dueDate: '',
    dependsOnTaskId: '',
    estimatedHours: '',
    tags: '',
    notes: '',
  })

  // Fetch projects
  const { data: projectsData } = useQuery({
    queryKey: ['projects', tenantId],
    queryFn: async () => {
      const response = await apiRequest(`/api/projects?limit=1000`, {
        method: 'GET',
      })
      if (!response.ok) throw new Error('Failed to fetch projects')
      return response.json()
    },
  })

  // Fetch users
  const { data: usersData } = useQuery({
    queryKey: ['users', tenantId],
    queryFn: async () => {
      const response = await apiRequest(`/api/crm/users`, {
        method: 'GET',
      })
      if (!response.ok) throw new Error('Failed to fetch users')
      return response.json()
    },
  })

  // Fetch tasks for dependency selection (only if project is selected)
  const { data: tasksData } = useQuery({
    queryKey: ['tasks', formData.projectId],
    queryFn: async () => {
      if (!formData.projectId) return { tasks: [] }
      const response = await apiRequest(`/api/projects/tasks?projectId=${formData.projectId}`, {
        method: 'GET',
      })
      if (!response.ok) throw new Error('Failed to fetch tasks')
      return response.json()
    },
    enabled: !!formData.projectId,
  })

  const createTask = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(`/api/projects/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create task')
      }
      return response.json()
    },
    onSuccess: (data) => {
      router.push(`/projects/${tenantId}/Tasks`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createTask.mutate({
      projectId: formData.projectId,
      name: formData.name,
      description: formData.description || undefined,
      status: formData.status,
      priority: formData.priority,
      assignedToId: formData.assignedToId || undefined,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
      dependsOnTaskId: formData.dependsOnTaskId || undefined,
      estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      notes: formData.notes || undefined,
    })
  }

  const projects = projectsData?.projects || []
  const users = usersData?.users || []
  const tasks = tasksData?.tasks || []

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/projects/${tenantId}/Tasks`}>
            <Button variant="ghost" size="sm" className="dark:text-gray-300 dark:hover:bg-gray-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create New Task</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Add a new task to track work</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Task Details</CardTitle>
              <CardDescription className="dark:text-gray-400">Enter the information for your task</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="projectId" className="dark:text-gray-300">Project *</Label>
                <CustomSelect
                  value={formData.projectId}
                  onValueChange={(value: string) => setFormData({ ...formData, projectId: value, dependsOnTaskId: '' })}
                  placeholder="Select a project"
                >
                  <CustomSelectTrigger className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                  </CustomSelectTrigger>
                  <CustomSelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    {projects.map((project: any) => (
                      <CustomSelectItem key={project.id} value={project.id} className="dark:text-gray-100">
                        {project.name} {project.code ? `(${project.code})` : ''}
                      </CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
              </div>

              <div>
                <Label htmlFor="name" className="dark:text-gray-300">Task Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Design homepage mockup"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div>
                <Label htmlFor="description" className="dark:text-gray-300">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the task..."
                  rows={4}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status" className="dark:text-gray-300">Status</Label>
                  <CustomSelect
                    value={formData.status}
                    onValueChange={(value: string) => setFormData({ ...formData, status: value })}
                    placeholder="Status"
                  >
                    <CustomSelectTrigger className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                    </CustomSelectTrigger>
                    <CustomSelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <CustomSelectItem value="TODO" className="dark:text-gray-100">To Do</CustomSelectItem>
                      <CustomSelectItem value="IN_PROGRESS" className="dark:text-gray-100">In Progress</CustomSelectItem>
                      <CustomSelectItem value="IN_REVIEW" className="dark:text-gray-100">In Review</CustomSelectItem>
                      <CustomSelectItem value="DONE" className="dark:text-gray-100">Done</CustomSelectItem>
                      <CustomSelectItem value="BLOCKED" className="dark:text-gray-100">Blocked</CustomSelectItem>
                    </CustomSelectContent>
                  </CustomSelect>
                </div>

                <div>
                  <Label htmlFor="priority" className="dark:text-gray-300">Priority</Label>
                  <CustomSelect
                    value={formData.priority}
                    onValueChange={(value: string) => setFormData({ ...formData, priority: value })}
                    placeholder="Priority"
                  >
                    <CustomSelectTrigger className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                    </CustomSelectTrigger>
                    <CustomSelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <CustomSelectItem value="LOW" className="dark:text-gray-100">Low</CustomSelectItem>
                      <CustomSelectItem value="MEDIUM" className="dark:text-gray-100">Medium</CustomSelectItem>
                      <CustomSelectItem value="HIGH" className="dark:text-gray-100">High</CustomSelectItem>
                      <CustomSelectItem value="URGENT" className="dark:text-gray-100">Urgent</CustomSelectItem>
                    </CustomSelectContent>
                  </CustomSelect>
                </div>
              </div>

              <div>
                <Label htmlFor="assignedToId" className="dark:text-gray-300">Assign To</Label>
                <CustomSelect
                  value={formData.assignedToId}
                  onValueChange={(value: string) => setFormData({ ...formData, assignedToId: value })}
                  placeholder="Select a user"
                >
                  <CustomSelectTrigger className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                  </CustomSelectTrigger>
                  <CustomSelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <CustomSelectItem value="" className="dark:text-gray-100">Unassigned</CustomSelectItem>
                    {users.map((user: any) => (
                      <CustomSelectItem key={user.id} value={user.id} className="dark:text-gray-100">
                        {user.name} ({user.email})
                      </CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="dark:text-gray-300">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="dueDate" className="dark:text-gray-300">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                </div>
              </div>

              {formData.projectId && (
                <div>
                  <Label htmlFor="dependsOnTaskId" className="dark:text-gray-300">Depends On Task</Label>
                  <CustomSelect
                    value={formData.dependsOnTaskId}
                    onValueChange={(value: string) => setFormData({ ...formData, dependsOnTaskId: value })}
                    placeholder="Select a task"
                  >
                    <CustomSelectTrigger className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                    </CustomSelectTrigger>
                    <CustomSelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <CustomSelectItem value="" className="dark:text-gray-100">No dependency</CustomSelectItem>
                      {tasks.map((task: any) => (
                        <CustomSelectItem key={task.id} value={task.id} className="dark:text-gray-100">
                          {task.name} ({task.status})
                        </CustomSelectItem>
                      ))}
                    </CustomSelectContent>
                  </CustomSelect>
                </div>
              )}

              <div>
                <Label htmlFor="estimatedHours" className="dark:text-gray-300">Estimated Hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.5"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div>
                <Label htmlFor="tags" className="dark:text-gray-300">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., design, frontend, urgent"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div>
                <Label htmlFor="notes" className="dark:text-gray-300">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link href={`/projects/${tenantId}/Tasks`}>
              <Button type="button" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</Button>
            </Link>
            <Button 
              type="submit" 
              className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600"
              disabled={createTask.isPending}
            >
              {createTask.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

