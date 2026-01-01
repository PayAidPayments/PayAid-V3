'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Calendar } from 'lucide-react'
import { format } from 'date-fns'

// Simple Gantt chart component using CSS
function GanttChart({ projects }: { projects: any[] }) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  // Calculate date range
  const allDates: Date[] = []
  projects.forEach((project) => {
    if (project.startDate) allDates.push(new Date(project.startDate))
    if (project.endDate) allDates.push(new Date(project.endDate))
  })

  const minDate = allDates.length > 0 ? new Date(Math.min(...allDates.map((d) => d.getTime()))) : new Date()
  const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates.map((d) => d.getTime()))) : new Date()

  // Generate date columns (monthly)
  const months: Date[] = []
  const current = new Date(minDate)
  while (current <= maxDate) {
    months.push(new Date(current))
    current.setMonth(current.getMonth() + 1)
  }

  const getProjectPosition = (startDate: string | null, endDate: string | null) => {
    if (!startDate || !endDate) return { left: 0, width: 0 }
    const start = new Date(startDate)
    const end = new Date(endDate)
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
    const projectStart = Math.ceil((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
    const projectDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const left = (projectStart / totalDays) * 100
    const width = (projectDays / totalDays) * 100
    return { left: Math.max(0, left), width: Math.min(100, width) }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLANNING: 'bg-blue-500',
      IN_PROGRESS: 'bg-yellow-500',
      ON_HOLD: 'bg-orange-500',
      COMPLETED: 'bg-green-500',
      CANCELLED: 'bg-red-500',
    }
    return colors[status] || 'bg-gray-500'
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header with months */}
          <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="w-64 p-2 font-medium border-r">Project</div>
            <div className="flex-1 flex">
              {months.map((month, idx) => (
                <div
                  key={idx}
                  className="flex-1 p-2 text-center text-sm border-r border-gray-200"
                  style={{ minWidth: '120px' }}
                >
                  {format(month, 'MMM yyyy')}
                </div>
              ))}
            </div>
          </div>

          {/* Project rows */}
          {projects.map((project) => {
            const position = getProjectPosition(project.startDate, project.endDate)
            return (
              <div
                key={project.id}
                className="flex border-b border-gray-200 hover:bg-gray-50"
                onClick={() => setSelectedProject(selectedProject === project.id ? null : project.id)}
              >
                <div className="w-64 p-3 border-r">
                  <div className="font-medium">{project.name}</div>
                  <div className="text-xs text-gray-500">{project.code || 'No code'}</div>
                </div>
                <div className="flex-1 relative" style={{ minHeight: '50px' }}>
                  {project.startDate && project.endDate && (
                    <div
                      className={`absolute top-2 h-6 rounded ${getStatusColor(project.status)} text-white text-xs flex items-center justify-center px-2 cursor-pointer hover:opacity-80`}
                      style={{
                        left: `${position.left}%`,
                        width: `${position.width}%`,
                        minWidth: '60px',
                      }}
                      title={`${project.name} - ${format(new Date(project.startDate), 'MMM dd')} to ${format(new Date(project.endDate), 'MMM dd')}`}
                    >
                      {project.progress}%
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Planning</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span>On Hold</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Cancelled</span>
        </div>
      </div>
    </div>
  )
}

function GanttPageContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['projects-gantt'],
    queryFn: async () => {
      const response = await fetch('/api/projects?limit=100', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch projects')
      return response.json()
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const projects = data?.projects || []

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
            <h1 className="text-3xl font-bold">Gantt Chart View</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Visual timeline of all projects
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
          <CardDescription>
            {projects.length} project{projects.length !== 1 ? 's' : ''} displayed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length > 0 ? (
            <GanttChart projects={projects} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No projects found</p>
              <Link href="/dashboard/projects/new">
                <Button className="mt-4">Create Your First Project</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function GanttPage() {
  return <GanttPageContent />
}

