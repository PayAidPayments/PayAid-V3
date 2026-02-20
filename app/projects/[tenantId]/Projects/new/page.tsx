'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger } from '@/components/ui/custom-select'
import { getAuthHeaders } from '@/lib/api/client'
import { ArrowLeft } from 'lucide-react'

export default function NewProjectPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    status: 'PLANNING',
    priority: 'MEDIUM',
    startDate: '',
    endDate: '',
    budget: '',
    clientId: '',
    tags: '',
  })

  const createProject = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create project')
      }
      return response.json()
    },
    onSuccess: (data) => {
      router.push(`/projects/${tenantId}/Projects/${data.project.id}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createProject.mutate({
      ...formData,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
    })
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/projects/${tenantId}/Projects`}>
            <Button variant="ghost" size="sm" className="dark:text-gray-300 dark:hover:bg-gray-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create New Project</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Set up a new project to track tasks and time</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Project Details</CardTitle>
              <CardDescription className="dark:text-gray-400">Enter the basic information for your project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="dark:text-gray-300">Project Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Website Redesign"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div>
                <Label htmlFor="code" className="dark:text-gray-300">Project Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., WEB-2024"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div>
                <Label htmlFor="description" className="dark:text-gray-300">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the project..."
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
                      <CustomSelectItem value="PLANNING" className="dark:text-gray-100">Planning</CustomSelectItem>
                      <CustomSelectItem value="IN_PROGRESS" className="dark:text-gray-100">In Progress</CustomSelectItem>
                      <CustomSelectItem value="ON_HOLD" className="dark:text-gray-100">On Hold</CustomSelectItem>
                      <CustomSelectItem value="COMPLETED" className="dark:text-gray-100">Completed</CustomSelectItem>
                      <CustomSelectItem value="CANCELLED" className="dark:text-gray-100">Cancelled</CustomSelectItem>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="dark:text-gray-300">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="endDate" className="dark:text-gray-300">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="budget" className="dark:text-gray-300">Budget (₹)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div>
                <Label htmlFor="tags" className="dark:text-gray-300">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., web, design, urgent"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link href={`/projects/${tenantId}/Projects`}>
              <Button type="button" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</Button>
            </Link>
            <Button 
              type="submit" 
              className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600"
              disabled={createProject.isPending}
            >
              {createProject.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

