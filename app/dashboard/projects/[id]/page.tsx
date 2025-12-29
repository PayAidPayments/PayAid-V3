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
    assignedTo?: {
      id: string
      name: string
    }
    dueDate?: string
    progress: number
    estimatedHours?: number
    actualHours: number
  }>
  members: Array<{
    id: string
    role: string
    user: {
      id: string
      name: string
      email: string
    }
  }>
  budgets: Array<{
    id: string
    category: string
    budgetedAmount: number
    actualAmount: number
  }>
  _count: {
    tasks: number
    members: number
    timeEntries: number
  }
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectId = params?.id as string

  const { data: projectData, isLoading } = useQuery<{ project: Project }>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch project')
      return response.json()
    },
  })

  const { data: tasksData } = useQuery<{ tasks: any[] }>({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch tasks')
      return response.json()
    },
  })

  const { data: timeEntriesData } = useQuery<{ timeEntries: any[]; totals: any }>({
    queryKey: ['project-time-entries', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/time-entries`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch time entries')
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

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-100 text-gray-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'IN_REVIEW':
        return 'bg-yellow-100 text-yellow-800'
      case 'DONE':
        return 'bg-green-100 text-green-800'
      case 'BLOCKED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const project = projectData?.project
  const tasks = tasksData?.tasks || []
  const timeEntries = timeEntriesData?.timeEntries || []
  const totals = timeEntriesData?.totals || { totalHours: 0, billableAmount: 0 }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading project...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Project not found</p>
        <Link href="/dashboard/projects">
          <Button className="mt-4">Back to Projects</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/projects">
              <Button variant="outline" size="sm">← Back</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              {project.code && (
                <p className="text-gray-600 mt-1">Code: {project.code}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/projects/${projectId}/edit`}>
            <Button variant="outline">Edit Project</Button>
          </Link>
          <Link href={`/dashboard/projects/${projectId}/tasks/new`}>
            <Button>Add Task</Button>
          </Link>
        </div>
      </div>

      {/* Project Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(project.status)}>
              {project.status.replace('_', ' ')}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.progress}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Budget</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{project.actualCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            {project.budget && (
              <div className="text-sm text-gray-600">
                of ₹{Number(project.budget).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalHours.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Time logged</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({project._count.tasks})</TabsTrigger>
          <TabsTrigger value="time">Time Entries</TabsTrigger>
          <TabsTrigger value="team">Team ({project._count.members})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-600">Description</div>
                  <div className="mt-1">{project.description || 'No description'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Owner</div>
                  <div className="mt-1">
                    {project.owner ? (
                      <div>
                        <div className="font-medium">{project.owner.name}</div>
                        <div className="text-sm text-gray-500">{project.owner.email}</div>
                      </div>
                    ) : (
                      'Unassigned'
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Client</div>
                  <div className="mt-1">
                    {project.client ? (
                      <div>
                        <div className="font-medium">{project.client.name}</div>
                        <div className="text-sm text-gray-500">{project.client.email}</div>
                      </div>
                    ) : (
                      'No client assigned'
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Dates</div>
                  <div className="mt-1 space-y-1">
                    {project.startDate && (
                      <div>Start: {format(new Date(project.startDate), 'MMM dd, yyyy')}</div>
                    )}
                    {project.endDate && (
                      <div>End: {format(new Date(project.endDate), 'MMM dd, yyyy')}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {project.budgets.length > 0 ? (
                  <div className="space-y-3">
                    {project.budgets.map((budget) => (
                      <div key={budget.id} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{budget.category}</div>
                          <div className="text-sm text-gray-600">
                            ₹{Number(budget.actualAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ₹{Number(budget.budgetedAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {((Number(budget.actualAmount) / Number(budget.budgetedAmount)) * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No budget categories defined</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tasks</CardTitle>
                <Link href={`/dashboard/projects/${projectId}/tasks/new`}>
                  <Button size="sm">Add Task</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No tasks yet. Create your first task to get started.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.name}</TableCell>
                        <TableCell>
                          <Badge className={getTaskStatusColor(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {task.assignedTo ? task.assignedTo.name : 'Unassigned'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${task.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{task.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {task.actualHours.toFixed(1)}h
                            {task.estimatedHours && (
                              <span className="text-gray-500"> / {Number(task.estimatedHours).toFixed(1)}h</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {task.dueDate ? (
                            format(new Date(task.dueDate), 'MMM dd, yyyy')
                          ) : (
                            <span className="text-gray-400">No due date</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link href={`/dashboard/projects/${projectId}/tasks/${task.id}`}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Time Entries</CardTitle>
                <Link href={`/dashboard/projects/${projectId}/time-entries/new`}>
                  <Button size="sm">Log Time</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {timeEntries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No time entries yet. Start logging time to track project hours.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Total Hours</div>
                        <div className="text-2xl font-bold">{totals.totalHours.toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Billable Amount</div>
                        <div className="text-2xl font-bold">
                          ₹{totals.billableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Task</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Billable</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timeEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            {format(new Date(entry.date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>{entry.user.name}</TableCell>
                          <TableCell>
                            {entry.task ? entry.task.name : 'No task'}
                          </TableCell>
                          <TableCell>{Number(entry.hours).toFixed(1)}h</TableCell>
                          <TableCell>
                            {entry.billable ? (
                              <Badge className="bg-green-100 text-green-800">
                                ₹{entry.billingRate ? (Number(entry.hours) * Number(entry.billingRate)).toFixed(2) : '0.00'}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">Non-billable</span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {entry.description || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              {project.members.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No team members added yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Allocation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.user.name}</TableCell>
                        <TableCell>{member.user.email}</TableCell>
                        <TableCell>
                          <Badge>{member.role}</Badge>
                        </TableCell>
                        <TableCell>{member.allocationPercentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

