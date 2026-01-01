'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { getAuthHeaders } from '@/lib/api/client'
import { getDynamicTitle, getDynamicDescription } from '@/lib/utils/status-labels'
import { Calendar, Columns } from 'lucide-react'

interface Project {
  id: string
  name: string
  code?: string
  description?: string
  status: string
  priority: string
  startDate?: string
  endDate?: string
  budget?: number
  progress: number
  owner?: {
    id: string
    name: string
    email: string
  }
  client?: {
    id: string
    name: string
    email: string
  }
  _count: {
    tasks: number
    members: number
    timeEntries: number
  }
}

export default function ProjectsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery<{
    projects: Project[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>({
    queryKey: ['projects', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/projects?${params}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch projects')
      return response.json()
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-green-100 text-green-800'
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const projects = data?.projects || []
  const pagination = data?.pagination
  
  const dynamicTitle = getDynamicTitle('Projects', statusFilter)
  const dynamicDescription = getDynamicDescription('Projects', statusFilter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{dynamicTitle}</h1>
          <p className="text-gray-600 mt-1">{dynamicDescription}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/projects/gantt">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Gantt View
            </Button>
          </Link>
          <Link href="/dashboard/projects/kanban">
            <Button variant="outline">
              <Columns className="h-4 w-4 mr-2" />
              Kanban View
            </Button>
          </Link>
          <Link href="/dashboard/projects/new">
            <Button>New Project</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('all')}
        >
          All
        </Button>
        <Button
          variant={statusFilter === 'PLANNING' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('PLANNING')}
        >
          Planning
        </Button>
        <Button
          variant={statusFilter === 'IN_PROGRESS' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('IN_PROGRESS')}
        >
          In Progress
        </Button>
        <Button
          variant={statusFilter === 'ON_HOLD' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('ON_HOLD')}
        >
          On Hold
        </Button>
        <Button
          variant={statusFilter === 'COMPLETED' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('COMPLETED')}
        >
          Completed
        </Button>
      </div>

      {/* Projects Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No projects found. Create your first project to get started.</p>
            <Link href="/dashboard/projects/new">
              <Button className="mt-4">Create Project</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{project.name}</div>
                      {project.code && (
                        <div className="text-sm text-gray-500">{project.code}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(project.priority)}>
                      {project.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{project.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {project.owner ? (
                      <div className="text-sm">
                        <div className="font-medium">{project.owner.name}</div>
                        <div className="text-gray-500">{project.owner.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {project.client ? (
                      <div className="text-sm">
                        <div className="font-medium">{project.client.name}</div>
                        <div className="text-gray-500">{project.client.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">No client</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{project._count.tasks} tasks</div>
                      <div className="text-gray-500">{project._count.members} members</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {project.endDate ? (
                      format(new Date(project.endDate), 'MMM dd, yyyy')
                    ) : (
                      <span className="text-gray-400">No due date</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/projects/${project.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {((page - 1) * pagination.limit) + 1} to {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} projects
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

