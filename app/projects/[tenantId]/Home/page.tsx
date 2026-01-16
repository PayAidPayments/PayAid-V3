'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FolderKanban,
  Calendar, 
  Clock,
  Users,
  Target,
  RefreshCw,
  ArrowUpRight,
  CheckCircle2,
  CheckSquare,
  AlertCircle,
  PauseCircle
} from 'lucide-react'
import { DashboardLoading } from '@/components/ui/loading'
// ModuleTopBar is now in layout.tsx
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'

interface ProjectsDashboardStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  onHoldProjects: number
  totalTasks: number
  completedTasks: number
  totalTimeLogged: number
  projectsByStatus: Array<{
    status: string
    count: number
  }>
  projectsByPriority: Array<{
    priority: string
    count: number
  }>
  monthlyProjectCreation: Array<{
    month: string
    count: number
  }>
  recentProjects: Array<{
    id: string
    name: string
    status: string
    progress: number
    createdAt: string
  }>
}

// PayAid brand colors for charts
const PAYAID_PURPLE = '#53328A'
const PAYAID_GOLD = '#F5C700'
const PAYAID_LIGHT_PURPLE = '#6B4BA1'
const CHART_COLORS = [PAYAID_PURPLE, PAYAID_GOLD, PAYAID_LIGHT_PURPLE, '#8B5CF6', '#EC4899', '#10B981']

export default function ProjectsDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const [stats, setStats] = useState<ProjectsDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [tenantId])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = useAuthStore.getState().token
      
      if (!token) {
        console.error('No authentication token found')
        setLoading(false)
        return
      }

      const response = await fetch('/api/projects/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch dashboard stats')
      }
    } catch (error: any) {
      console.error('Failed to fetch dashboard stats:', error)
      setError(error.message || 'An unexpected error occurred while fetching data.')
      // Set default stats
      setStats({
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        onHoldProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        totalTimeLogged: 0,
        projectsByStatus: [],
        projectsByPriority: [],
        monthlyProjectCreation: [],
        recentProjects: [],
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <DashboardLoading message="Loading Projects dashboard..." />
  }

  // Prepare chart data
  const projectsByStatusData = stats?.projectsByStatus.map((item, idx) => ({
    name: item.status.replace('_', ' '),
    value: item.count,
    fill: CHART_COLORS[idx % CHART_COLORS.length]
  })) || []

  const monthlyProjectData = stats?.monthlyProjectCreation.map(item => ({
    month: item.month,
    projects: item.count
  })) || []

  const completionRate = stats && stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 relative" style={{ zIndex: 1 }}>
      {/* Top Navigation Bar - Decoupled Architecture (Module-Specific Only) */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
            <nav className="flex items-center gap-4 text-sm">
              <Link href={`/projects/${tenantId}/Home/`} className="text-purple-600 font-medium border-b-2 border-purple-600 pb-2">Home</Link>
              <Link href={`/projects/${tenantId}/Projects`} className="text-gray-600 hover:text-gray-900 transition-colors">All Projects</Link>
              <Link href={`/projects/${tenantId}/Tasks`} className="text-gray-600 hover:text-gray-900 transition-colors">Tasks</Link>
              <Link href={`/projects/${tenantId}/Time`} className="text-gray-600 hover:text-gray-900 transition-colors">Time Tracking</Link>
              <Link href={`/projects/${tenantId}/Gantt`} className="text-gray-600 hover:text-gray-900 transition-colors">Gantt Chart</Link>
              <Link href={`/projects/${tenantId}/Reports`} className="text-gray-600 hover:text-gray-900 transition-colors">Reports</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchDashboardStats}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
            {/* Module Switcher for Decoupled Architecture */}
            <ModuleSwitcher currentModule="projects" />
          </div>
        </div>
      </div>

      {/* Welcome Banner - Enhanced */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-6 shadow-lg mt-16">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Projects Dashboard 📁
            </h1>
            {tenant && (
              <p className="text-purple-100 flex items-center gap-2">
                <span>🏢</span>
                {tenant.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">Error:</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="p-6 space-y-6 overflow-y-auto" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* KPI Cards - Modern Design with Gradients */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Projects</CardTitle>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <FolderKanban className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats?.totalProjects || 0}
              </div>
              <p className="text-xs text-gray-600">All projects</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Active Projects</CardTitle>
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats?.activeProjects || 0}
              </div>
              <p className="text-xs text-gray-600 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-green-600" />
                <span className="text-green-600 font-medium">In progress</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Tasks</CardTitle>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats?.totalTasks || 0}
              </div>
              <p className="text-xs text-gray-600">
                {completionRate}% completed
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Time Logged</CardTitle>
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats?.totalTimeLogged ? `${Math.round(stats.totalTimeLogged)}h` : '0h'}
              </div>
              <p className="text-xs text-gray-600">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row - Modern Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projects by Status - Pie Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Projects by Status</CardTitle>
              <CardDescription>Distribution of projects across different statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {projectsByStatusData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectsByStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {projectsByStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [value, 'Projects']}
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: `1px solid ${PAYAID_PURPLE}`,
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>No project data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Project Creation - Area Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Monthly Project Creation</CardTitle>
              <CardDescription>Project creation trend over time</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyProjectData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyProjectData}>
                      <defs>
                        <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={PAYAID_PURPLE} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={PAYAID_PURPLE} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: `1px solid ${PAYAID_PURPLE}`,
                          borderRadius: '8px',
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="projects" 
                        stroke={PAYAID_PURPLE} 
                        fillOpacity={1} 
                        fill="url(#colorProjects)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>No project creation data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Projects</CardTitle>
              <CardDescription>Latest projects created</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentProjects && stats.recentProjects.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{project.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full" 
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">{project.progress}%</span>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        project.status === 'IN_PROGRESS' 
                          ? 'bg-green-100 text-green-800' 
                          : project.status === 'ON_HOLD'
                          ? 'bg-yellow-100 text-yellow-800'
                          : project.status === 'COMPLETED'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No recent projects</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              <CardDescription>Get started with Projects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/projects/${tenantId}/Projects/new`}>
                <button className="w-full flex items-center justify-start px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <FolderKanban className="mr-2 h-4 w-4" />
                  Create New Project
                </button>
              </Link>
              <Link href={`/projects/${tenantId}/Gantt`}>
                <button className="w-full flex items-center justify-start px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Gantt Chart
                </button>
              </Link>
              <Link href={`/projects/${tenantId}/Tasks/new`}>
                <button className="w-full flex items-center justify-start px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Create New Task
                </button>
              </Link>
              <Link href={`/projects/${tenantId}/Time/new`}>
                <button className="w-full flex items-center justify-start px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Clock className="mr-2 h-4 w-4" />
                  Log Time Entry
                </button>
              </Link>
              <Link href={`/projects/${tenantId}/Time`}>
                <button className="w-full flex items-center justify-start px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Clock className="mr-2 h-4 w-4" />
                  View Time Entries
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

