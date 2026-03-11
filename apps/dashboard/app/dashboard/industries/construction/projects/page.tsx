'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ConstructionProject {
  id: string
  projectName: string
  projectType?: string
  clientName: string
  location: string
  startDate?: string
  expectedEndDate?: string
  budget?: number
  status: string
  projectManager?: string
  materials: any[]
  milestones: any[]
}

export default function ConstructionProjectsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const { data, isLoading } = useQuery<{ projects: ConstructionProject[] }>({
    queryKey: ['construction-projects', selectedStatus],
    queryFn: async () => {
      const url = selectedStatus === 'all'
        ? '/api/industries/construction/projects'
        : `/api/industries/construction/projects?status=${selectedStatus}`
      const response = await apiRequest(url)
      if (!response.ok) throw new Error('Failed to fetch projects')
      return response.json()
    },
  })

  const projects = data?.projects || []

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLANNING: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-green-100 text-green-800',
      ON_HOLD: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Construction Projects</h1>
        <p className="mt-2 text-gray-600">Manage construction projects and progress</p>
      </div>

      {/* Status Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="all">All Status</option>
            <option value="PLANNING">Planning</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </CardContent>
      </Card>

      {/* Projects List */}
      {isLoading ? (
        <div className="text-center py-8">Loading projects...</div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No projects found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{project.projectName}</CardTitle>
                    <CardDescription>
                      Client: {project.clientName} | 
                      Location: {project.location}
                      {project.projectType && ` | Type: ${project.projectType}`}
                    </CardDescription>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {project.startDate && (
                    <p><strong>Start Date:</strong> {new Date(project.startDate).toLocaleDateString()}</p>
                  )}
                  {project.expectedEndDate && (
                    <p><strong>Expected End:</strong> {new Date(project.expectedEndDate).toLocaleDateString()}</p>
                  )}
                  {project.budget && <p><strong>Budget:</strong> ₹{project.budget.toLocaleString()}</p>}
                  {project.projectManager && <p><strong>Project Manager:</strong> {project.projectManager}</p>}
                  <p><strong>Materials:</strong> {project.materials.length} items</p>
                  <p><strong>Milestones:</strong> {project.milestones.length}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

