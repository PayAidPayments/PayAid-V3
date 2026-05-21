'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger } from '@/components/ui/custom-select'
// ModuleTopBar is now in layout.tsx
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'
import { Calendar, RefreshCw } from 'lucide-react'
import { apiRequest } from '@/lib/api/client'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays, addDays, parseISO } from 'date-fns'

export default function ProjectsGanttPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const [selectedProject, setSelectedProject] = useState<string>('all')

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

  // Fetch tasks
  const { data: tasksData, isLoading, error, refetch } = useQuery({
    queryKey: ['projects-tasks-gantt', tenantId, selectedProject],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedProject !== 'all') {
        params.append('projectId', selectedProject)
      }
      const response = await apiRequest(`/api/projects/tasks?${params.toString()}`, {
        method: 'GET',
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch tasks')
      }
      return response.json()
    },
  })

  const projects = projectsData?.projects || []
  const tasks = tasksData?.tasks || []

  // Calculate date range for Gantt chart
  const getDateRange = () => {
    if (!tasks || tasks.length === 0) {
      const today = new Date()
      return {
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: addDays(today, 30),
      }
    }

    const dates = tasks
      .filter((task: any) => task.startDate || task.dueDate)
      .flatMap((task: any) => [
        task.startDate ? parseISO(task.startDate) : null,
        task.dueDate ? parseISO(task.dueDate) : null,
      ])
      .filter(Boolean) as Date[]

    if (dates.length === 0) {
      const today = new Date()
      return {
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: addDays(today, 30),
      }
    }

    const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
    
    return {
      start: startOfWeek(minDate, { weekStartsOn: 1 }),
      end: addDays(maxDate, 7),
    }
  }

  const dateRange = getDateRange()
  const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end })
  const totalDays = differenceInDays(dateRange.end, dateRange.start) + 1

  const getTaskPosition = (task: any) => {
    if (!task.startDate && !task.dueDate) return null

    const start = task.startDate ? parseISO(task.startDate) : dateRange.start
    const end = task.dueDate ? parseISO(task.dueDate) : addDays(start, 7)
    
    const left = differenceInDays(start, dateRange.start)
    const width = differenceInDays(end, start) + 1
    
    return {
      left: (left / totalDays) * 100,
      width: (width / totalDays) * 100,
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE':
        return 'bg-green-500'
      case 'IN_PROGRESS':
        return 'bg-blue-500'
      case 'IN_REVIEW':
        return 'bg-yellow-500'
      case 'BLOCKED':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 relative" style={{ zIndex: 1 }}>
      {/* ModuleTopBar is now in layout.tsx */}

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gantt Chart</h1>
            <p className="mt-2 text-gray-600">Visualize project timelines and dependencies</p>
          </div>
          <div className="flex items-center gap-3">
            <CustomSelect value={selectedProject} onValueChange={setSelectedProject} placeholder="Select project">
              <CustomSelectTrigger className="w-48">
              </CustomSelectTrigger>
              <CustomSelectContent>
                <CustomSelectItem value="all">All Projects</CustomSelectItem>
                {projects.map((project: any) => (
                  <CustomSelectItem key={project.id} value={project.id}>
                    {project.name}
                  </CustomSelectItem>
                ))}
              </CustomSelectContent>
            </CustomSelect>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Timeline</CardTitle>
            <CardDescription>Task timeline visualization with start and due dates</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <PageLoading message="Loading Gantt chart..." fullScreen={false} />
            ) : error ? (
              <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-red-600 mb-4">Failed to load tasks. Please try again.</p>
                  <Button onClick={() => refetch()}>Retry</Button>
                </div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="h-96 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No tasks found</p>
                  <p className="text-sm text-gray-400 mt-2">Create tasks with start and due dates to see them on the Gantt chart</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  {/* Date Header */}
                  <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10">
                    <div className="w-64 flex-shrink-0 border-r border-gray-200 p-2 font-medium">Task</div>
                    <div className="flex-1 flex">
                      {days.map((day, index) => {
                        if (index % 7 === 0 || index === 0) {
                          return (
                            <div key={day.toISOString()} className="flex-1 border-r border-gray-200 p-2 text-xs text-center font-medium">
                              {format(day, 'MMM d')}
                            </div>
                          )
                        }
                        return null
                      })}
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-1">
                    {tasks.map((task: any) => {
                      const position = getTaskPosition(task)
                      if (!position) return null

                      return (
                        <div key={task.id} className="flex border-b border-gray-100 hover:bg-gray-50">
                          <div className="w-64 flex-shrink-0 border-r border-gray-200 p-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`}></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{task.name}</p>
                                <p className="text-xs text-gray-500 truncate">{task.project?.name || 'No Project'}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 relative p-2">
                            <div
                              className={`absolute h-6 rounded ${getStatusColor(task.status)} opacity-80 hover:opacity-100 transition-opacity`}
                              style={{
                                left: `${position.left}%`,
                                width: `${Math.max(position.width, 2)}%`,
                                top: '50%',
                                transform: 'translateY(-50%)',
                              }}
                              title={`${task.name} - ${task.startDate ? format(parseISO(task.startDate), 'MMM d') : 'No start'} to ${task.dueDate ? format(parseISO(task.dueDate), 'MMM d') : 'No due date'}`}
                            >
                              <div className="px-2 py-1 text-xs text-white truncate h-full flex items-center">
                                {task.name}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

