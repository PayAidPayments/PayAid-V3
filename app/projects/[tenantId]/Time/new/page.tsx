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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiRequest } from '@/lib/api/client'
import { ModuleSwitcher } from '@/components/ModuleSwitcher'
import { useAuthStore } from '@/lib/stores/auth'
import { ArrowLeft } from 'lucide-react'

export default function NewTimeEntryPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const [formData, setFormData] = useState({
    projectId: '',
    taskId: '',
    date: new Date().toISOString().slice(0, 16),
    hours: '',
    description: '',
    billable: false,
    billingRate: '',
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

  // Fetch tasks for selected project
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

  const createTimeEntry = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(`/api/projects/time-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create time entry')
      }
      return response.json()
    },
    onSuccess: (data) => {
      router.push(`/projects/${tenantId}/Time`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createTimeEntry.mutate({
      projectId: formData.projectId,
      taskId: formData.taskId || undefined,
      date: new Date(formData.date).toISOString(),
      hours: parseFloat(formData.hours),
      description: formData.description || undefined,
      billable: formData.billable,
      billingRate: formData.billingRate ? parseFloat(formData.billingRate) : undefined,
    })
  }

  const projects = projectsData?.projects || []
  const tasks = tasksData?.tasks || []

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 relative" style={{ zIndex: 1 }}>
      {/* Top Navigation Bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
            <nav className="flex items-center gap-4 text-sm">
              <Link href={`/projects/${tenantId}/Home/`} className="text-gray-600 hover:text-gray-900 transition-colors">Home</Link>
              <Link href={`/projects/${tenantId}/Projects`} className="text-gray-600 hover:text-gray-900 transition-colors">All Projects</Link>
              <Link href={`/projects/${tenantId}/Tasks`} className="text-gray-600 hover:text-gray-900 transition-colors">Tasks</Link>
              <Link href={`/projects/${tenantId}/Time`} className="text-purple-600 font-medium border-b-2 border-purple-600 pb-2">Time Tracking</Link>
              <Link href={`/projects/${tenantId}/Gantt`} className="text-gray-600 hover:text-gray-900 transition-colors">Gantt Chart</Link>
              <Link href={`/projects/${tenantId}/Reports`} className="text-gray-600 hover:text-gray-900 transition-colors">Reports</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ModuleSwitcher currentModule="projects" />
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href={`/projects/${tenantId}/Time`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Log Time Entry</h1>
              <p className="text-sm text-gray-600 mt-1">Record time spent on a project or task</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Time Entry Details</CardTitle>
                <CardDescription>Enter the time you spent working</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="projectId">Project *</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => setFormData({ ...formData, projectId: value, taskId: '' })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project: any) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name} {project.code ? `(${project.code})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.projectId && (
                  <div>
                    <Label htmlFor="taskId">Task (Optional)</Label>
                    <Select
                      value={formData.taskId}
                      onValueChange={(value) => setFormData({ ...formData, taskId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a task" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No specific task</SelectItem>
                        {tasks.map((task: any) => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.name} ({task.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date & Time *</Label>
                    <Input
                      id="date"
                      type="datetime-local"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="hours">Hours *</Label>
                    <Input
                      id="hours"
                      type="number"
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                      required
                      placeholder="0.00"
                      min="0"
                      step="0.25"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What did you work on?"
                    rows={4}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="billable"
                    checked={formData.billable}
                    onChange={(e) => setFormData({ ...formData, billable: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <Label htmlFor="billable" className="cursor-pointer">This time entry is billable</Label>
                </div>

                {formData.billable && (
                  <div>
                    <Label htmlFor="billingRate">Billing Rate (₹/hour)</Label>
                    <Input
                      id="billingRate"
                      type="number"
                      value={formData.billingRate}
                      onChange={(e) => setFormData({ ...formData, billingRate: e.target.value })}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Link href={`/projects/${tenantId}/Time`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700"
                disabled={createTimeEntry.isPending}
              >
                {createTimeEntry.isPending ? 'Logging...' : 'Log Time'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

