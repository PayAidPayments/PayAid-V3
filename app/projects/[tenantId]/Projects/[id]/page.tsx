'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { getAuthHeaders } from '@/lib/api/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageLoading } from '@/components/ui/loading'
import { ArrowLeft, Plus, Clock, Users } from 'lucide-react'

interface Project {
  id: string
  name: string
  code?: string
  description?: string
  status: string
  priority: string
  startDate?: string
  endDate?: string
  actualStartDate?: string
  actualEndDate?: string
  budget?: number
  actualCost: number
  progress: number
  totalHours: number
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
  tasks: Array<{
    id: string
    name: string
    status: string
    priority: string
    assigneeId?: string
    dueDate?: string
    progress: number
  }>
  members: Array<{
    id: string
    userId: string
    role: string
    user: {
      id: string
      name: string
      email: string
    }
  }>
  timeEntries: Array<{
    id: string
    userId: string
    taskId?: string
    hours: number
    date: string
    description?: string
    billable: boolean
    user: {
      id: string
      name: string
      email: string
    }
  }>
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const tenantId = params?.tenantId as string
  const projectId = params?.id as string

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch project')
      return response.json()
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'IN_PROGRESS':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  if (isLoading) {
    return <PageLoading message="Loading project..." fullScreen={false} />
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Project not found</p>
        <Link href={`/projects/${tenantId}/Projects`}>
          <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Back to Projects</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/projects/${tenantId}/Projects`}>
              <Button variant="ghost" size="sm" className="dark:text-gray-300 dark:hover:bg-gray-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h1>
              {project.code && (
                <p className="text-sm text-gray-600 dark:text-gray-400">Code: {project.code}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(project.status)}>
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* Project Details Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="dark:bg-gray-800">
            <TabsTrigger value="overview" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100">Overview</TabsTrigger>
            <TabsTrigger value="tasks" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100">Tasks ({project.tasks?.length || 0})</TabsTrigger>
            <TabsTrigger value="time" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100">Time Entries</TabsTrigger>
            <TabsTrigger value="team" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100">Team ({project.members?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Info */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-gray-100">Project Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{project.description || 'No description'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {project.startDate ? format(new Date(project.startDate), 'MMM dd, yyyy') : '-'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {project.endDate ? format(new Date(project.endDate), 'MMM dd, yyyy') : '-'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Owner</label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{project.owner?.name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Client</label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{project.client?.name || '-'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Project Metrics */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-gray-100">Project Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</label>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-purple-600 dark:bg-purple-500 h-3 rounded-full" 
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{project.progress}% complete</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Budget</label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                        {project.budget ? `₹${project.budget.toLocaleString('en-IN')}` : '-'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Actual Cost</label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                        ₹{project.actualCost?.toLocaleString('en-IN') || '0'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Hours</label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                      {project.totalHours || 0} hours
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="dark:text-gray-100">Tasks</CardTitle>
                  <Link href={`/projects/${tenantId}/Tasks/New?projectId=${projectId}`}>
                    <Button size="sm" className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {project.tasks && project.tasks.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="dark:text-gray-300">Task</TableHead>
                        <TableHead className="dark:text-gray-300">Status</TableHead>
                        <TableHead className="dark:text-gray-300">Priority</TableHead>
                        <TableHead className="dark:text-gray-300">Progress</TableHead>
                        <TableHead className="dark:text-gray-300">Due Date</TableHead>
                        <TableHead className="dark:text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {project.tasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium text-gray-900 dark:text-gray-100">{task.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">{task.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">{task.priority}</Badge>
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-gray-100">{task.progress}%</TableCell>
                          <TableCell className="text-gray-900 dark:text-gray-100">
                            {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : '-'}
                          </TableCell>
                          <TableCell>
                            <Link href={`/projects/${tenantId}/Tasks/${task.id}`}>
                              <Button variant="ghost" size="sm" className="dark:text-gray-300 dark:hover:bg-gray-700">View</Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No tasks yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="time">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="dark:text-gray-100">Time Entries</CardTitle>
                  <Link href={`/projects/${tenantId}/Time?projectId=${projectId}`}>
                    <Button size="sm" className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      Log Time
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {project.timeEntries && project.timeEntries.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="dark:text-gray-300">Date</TableHead>
                        <TableHead className="dark:text-gray-300">User</TableHead>
                        <TableHead className="dark:text-gray-300">Hours</TableHead>
                        <TableHead className="dark:text-gray-300">Description</TableHead>
                        <TableHead className="dark:text-gray-300">Billable</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {project.timeEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-gray-900 dark:text-gray-100">
                            {format(new Date(entry.date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-gray-100">{entry.user?.name || '-'}</TableCell>
                          <TableCell className="text-gray-900 dark:text-gray-100">{entry.hours}</TableCell>
                          <TableCell className="text-gray-900 dark:text-gray-100">{entry.description || '-'}</TableCell>
                          <TableCell>
                            {entry.billable ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Yes</Badge>
                            ) : (
                              <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">No</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No time entries yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="dark:text-gray-100">Team Members</CardTitle>
                  <Button size="sm" className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {project.members && project.members.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="dark:text-gray-300">Name</TableHead>
                        <TableHead className="dark:text-gray-300">Email</TableHead>
                        <TableHead className="dark:text-gray-300">Role</TableHead>
                        <TableHead className="dark:text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {project.members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium text-gray-900 dark:text-gray-100">{member.user?.name || '-'}</TableCell>
                          <TableCell className="text-gray-900 dark:text-gray-100">{member.user?.email || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">{member.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="dark:text-gray-300 dark:hover:bg-gray-700">Remove</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No team members yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  )
}

