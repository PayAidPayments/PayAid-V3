'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ModuleSwitcher } from '@/components/ModuleSwitcher'
import { useAuthStore } from '@/lib/stores/auth'
import { BarChart3, CheckCircle2, Clock, TrendingUp } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

export default function ProjectsReportsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const [selectedReport, setSelectedReport] = useState<string>('overview')

  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['projects-reports', 'overview', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/reports?type=overview`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch overview')
      return response.json()
    },
  })

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['projects-reports', 'status', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/reports?type=status`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch status')
      return response.json()
    },
  })

  const { data: timeData, isLoading: timeLoading } = useQuery({
    queryKey: ['projects-reports', 'time', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/reports?type=time`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch time')
      return response.json()
    },
  })

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['projects-reports', 'tasks', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/reports?type=tasks`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch tasks')
      return response.json()
    },
  })

  const CHART_COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6']

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
              <Link href={`/projects/${tenantId}/Time`} className="text-gray-600 hover:text-gray-900 transition-colors">Time Tracking</Link>
              <Link href={`/projects/${tenantId}/Gantt`} className="text-gray-600 hover:text-gray-900 transition-colors">Gantt Chart</Link>
              <Link href={`/projects/${tenantId}/Reports`} className="text-purple-600 font-medium border-b-2 border-purple-600 pb-2">Reports</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ModuleSwitcher currentModule="projects" />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Reports</h1>
          <p className="mt-2 text-gray-600">Analyze project performance and metrics</p>
        </div>

        {/* Overview Stats */}
        {overviewData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewData.totalProjects || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{overviewData.activeProjects || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewData.totalTasks || 0}</div>
                <p className="text-xs text-gray-500 mt-1">{overviewData.completedTasks || 0} completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Time Logged</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewData.totalTimeLogged || 0}h</div>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Status Report</CardTitle>
              <CardDescription>Overview of all projects by status</CardDescription>
            </CardHeader>
            <CardContent>
              {statusLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : statusData?.projectsByStatus?.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData.projectsByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.status || entry.name || ''} ${entry.percent ? (entry.percent * 100).toFixed(0) : 0}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {statusData.projectsByStatus.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No project data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Time Tracking Report</CardTitle>
              <CardDescription>Time spent across projects</CardDescription>
            </CardHeader>
            <CardContent>
              {timeLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : timeData?.byProject?.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeData.byProject} layout="vertical">
                      <XAxis type="number" />
                      <YAxis dataKey="projectName" type="category" width={120} />
                      <Tooltip formatter={(value: any) => `${value}h`} />
                      <Legend />
                      <Bar dataKey="totalHours" fill="#8B5CF6" name="Total Hours" />
                      <Bar dataKey="billableHours" fill="#EC4899" name="Billable Hours" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No time tracking data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task Completion Report</CardTitle>
              <CardDescription>Task completion rates and trends</CardDescription>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : tasksData?.byStatus?.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tasksData.byStatus}>
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8B5CF6" name="Tasks" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No task data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task Priority Distribution</CardTitle>
              <CardDescription>Tasks by priority level</CardDescription>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : tasksData?.byPriority?.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tasksData.byPriority}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.priority || entry.name || ''} ${entry.percent ? (entry.percent * 100).toFixed(0) : 0}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {tasksData.byPriority.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No priority data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

