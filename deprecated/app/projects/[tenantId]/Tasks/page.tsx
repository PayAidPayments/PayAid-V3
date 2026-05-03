'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger } from '@/components/ui/custom-select'
// ModuleTopBar is now in layout.tsx
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'
import { RefreshCw, Plus, CheckCircle2, Clock, Calendar, Search, X } from 'lucide-react'
import { apiRequest } from '@/lib/api/client'

export default function ProjectsTasksPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Fetch projects for filter
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

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['projects-tasks', tenantId, statusFilter, priorityFilter, projectFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (priorityFilter !== 'all') {
        params.append('priority', priorityFilter)
      }
      if (projectFilter !== 'all') {
        params.append('projectId', projectFilter)
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

  // Client-side search filtering
  const filteredTasks = useMemo(() => {
    if (!data?.tasks) return []
    if (!searchQuery.trim()) return data.tasks
    
    const query = searchQuery.toLowerCase()
    return data.tasks.filter((task: any) =>
      task.name.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.projectName?.toLowerCase().includes(query) ||
      task.project?.name?.toLowerCase().includes(query)
    )
  }, [data?.tasks, searchQuery])

  const projects = projectsData?.projects || []

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 relative" style={{ zIndex: 1 }}>
      {/* ModuleTopBar is now in layout.tsx */}

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
            <p className="mt-2 text-gray-600">Manage and track all project tasks</p>
          </div>
          <Link href={`/projects/${tenantId}/Tasks/new`}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search tasks by name, description, or project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <CustomSelect value={projectFilter} onValueChange={setProjectFilter} placeholder="All Projects">
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
            <CustomSelect value={priorityFilter} onValueChange={setPriorityFilter} placeholder="All Priorities">
              <CustomSelectTrigger className="w-40">
              </CustomSelectTrigger>
              <CustomSelectContent>
                <CustomSelectItem value="all">All Priorities</CustomSelectItem>
                <CustomSelectItem value="LOW">Low</CustomSelectItem>
                <CustomSelectItem value="MEDIUM">Medium</CustomSelectItem>
                <CustomSelectItem value="HIGH">High</CustomSelectItem>
                <CustomSelectItem value="URGENT">Urgent</CustomSelectItem>
              </CustomSelectContent>
            </CustomSelect>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'TODO' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('TODO')}
              size="sm"
            >
              To Do
            </Button>
            <Button
              variant={statusFilter === 'IN_PROGRESS' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('IN_PROGRESS')}
              size="sm"
            >
              In Progress
            </Button>
            <Button
              variant={statusFilter === 'IN_REVIEW' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('IN_REVIEW')}
              size="sm"
            >
              In Review
            </Button>
            <Button
              variant={statusFilter === 'DONE' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('DONE')}
              size="sm"
            >
              Done
            </Button>
            <Button
              variant={statusFilter === 'BLOCKED' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('BLOCKED')}
              size="sm"
            >
              Blocked
            </Button>
          </div>
        </div>

        {/* Tasks List */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <PageLoading message="Loading tasks..." fullScreen={false} />
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">Failed to load tasks. Please try again.</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2 font-medium">No tasks found</p>
                <p className="text-sm text-gray-400 mb-4">
                  {searchQuery ? 'No tasks match your search' : statusFilter !== 'all' ? `No tasks with status "${statusFilter}"` : 'Get started by creating your first task'}
                </p>
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery('')} className="mr-2">
                    Clear Search
                  </Button>
                )}
                <Link href={`/projects/${tenantId}/Projects`}>
                  <Button>View Projects</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTasks.map((task: any) => (
                  <Link key={task.id} href={`/projects/${tenantId}/Projects/${task.projectId}`}>
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className={`w-5 h-5 ${task.status === 'DONE' ? 'text-green-600' : 'text-gray-400'}`} />
                        <div>
                          <p className="font-medium">{task.name}</p>
                          <p className="text-sm text-gray-500">{task.projectName || task.project?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">
                          <Clock className="w-4 h-4 inline mr-1" />
                          {task.estimatedHours || task.actualHours || 0}h
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          task.status === 'DONE' ? 'bg-green-100 text-green-800' :
                          task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'BLOCKED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

