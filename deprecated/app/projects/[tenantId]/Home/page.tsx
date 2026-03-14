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
  ArrowUpRight,
  CheckCircle2,
  CheckSquare,
  AlertCircle,
  PauseCircle,
  FileText
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'
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

// PayAid Brand Colors for charts
const PURPLE_PRIMARY = '#53328A' // PayAid Purple
const GOLD_ACCENT = '#F5C700' // PayAid Gold
const SUCCESS = '#059669' // Success (Emerald)
const INFO = '#0284C7' // Info (Blue)
const CHART_COLORS = [PURPLE_PRIMARY, GOLD_ACCENT, SUCCESS, INFO, '#8B5CF6', '#EC4899']

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
    return <PageLoading message="Loading Projects dashboard..." fullScreen={true} />
  }

  // Get module configuration
  const moduleConfig = getModuleConfig('projects')

  // Prepare chart data with defensive checks
  const projectsByStatusData = (() => {
    if (!stats?.projectsByStatus) return []
    if (!Array.isArray(stats.projectsByStatus)) {
      console.warn('[Projects Dashboard] projectsByStatus is not an array:', typeof stats.projectsByStatus)
      return []
    }
    return stats.projectsByStatus.map((item, idx) => ({
      name: item?.status ? item.status.replace('_', ' ') : 'Unknown',
      value: item?.count || 0,
      fill: CHART_COLORS[idx % CHART_COLORS.length]
    }))
  })()

  const monthlyProjectData = (() => {
    if (!stats?.monthlyProjectCreation) return []
    if (!Array.isArray(stats.monthlyProjectCreation)) {
      console.warn('[Projects Dashboard] monthlyProjectCreation is not an array:', typeof stats.monthlyProjectCreation)
      return []
    }
    return stats.monthlyProjectCreation.map(item => ({
      month: item?.month || '',
      projects: item?.count || 0
    }))
  })()

  const completionRate = stats && stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0

  // Hero metrics
  const heroMetrics = [
    {
      label: 'Total Projects',
      value: stats?.totalProjects || 0,
      change: stats?.activeProjects ? Math.round((stats.activeProjects / stats.totalProjects) * 100) : 0,
      trend: 'up' as const,
      icon: <FolderKanban className="w-5 h-5" />,
      color: 'purple' as const,
    },
    {
      label: 'Active Projects',
      value: stats?.activeProjects || 0,
      icon: <Target className="w-5 h-5" />,
      color: 'success' as const,
    },
    {
      label: 'Total Tasks',
      value: stats?.totalTasks || 0,
      change: completionRate,
      trend: 'up' as const,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'info' as const,
    },
    {
      label: 'Time Logged',
      value: stats?.totalTimeLogged ? `${Math.round(stats.totalTimeLogged)}h` : '0h',
      icon: <Clock className="w-5 h-5" />,
      color: 'gold' as const,
    },
  ]

  if (!moduleConfig) {
    return <div>Module configuration not found</div>
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      {/* Universal Module Hero */}
      <UniversalModuleHero
        moduleName="Projects"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">Error:</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Content Sections - 32px gap between sections */}
      <div className="p-6 space-y-8">
        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Projects by Status - Pie Chart */}
          <GlassCard>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Projects by Status</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Distribution of projects across different statuses</p>
            {projectsByStatusData.length > 0 ? (
              <div style={{ minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={projectsByStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    >
                      {Array.isArray(projectsByStatusData) && projectsByStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [value, 'Projects']}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: `1px solid ${PURPLE_PRIMARY}`,
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <p>No project data available</p>
              </div>
            )}
          </GlassCard>

          {/* Monthly Project Creation - Area Chart */}
          <GlassCard delay={0.1}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Monthly Project Creation</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Project creation trend over time</p>
            {monthlyProjectData.length > 0 ? (
              <div style={{ minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyProjectData}>
                    <defs>
                      <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={PURPLE_PRIMARY} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={PURPLE_PRIMARY} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: `1px solid ${PURPLE_PRIMARY}`,
                        borderRadius: '8px',
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="projects" 
                      stroke={PURPLE_PRIMARY} 
                      fillOpacity={1} 
                      fill="url(#colorProjects)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <p>No project creation data available</p>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Recent Projects & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Projects */}
          <GlassCard delay={0.2}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Recent Projects</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Latest projects created</p>
            {stats?.recentProjects && Array.isArray(stats.recentProjects) && stats.recentProjects.length > 0 ? (
              <div className="space-y-3">
                {stats.recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{project.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{project.progress}%</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      project.status === 'IN_PROGRESS' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : project.status === 'ON_HOLD'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : project.status === 'COMPLETED'
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No recent projects</p>
            )}
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard delay={0.3}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Quick Actions</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Get started with Projects</p>
            <div className="space-y-2">
              <Link href={`/projects/${tenantId}/Projects/new`}>
                <button className="w-full flex items-center justify-start px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors">
                  <FolderKanban className="mr-2 h-4 w-4" />
                  Create New Project
                </button>
              </Link>
              <Link href={`/projects/${tenantId}/Gantt`}>
                <button className="w-full flex items-center justify-start px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Gantt Chart
                </button>
              </Link>
              <Link href={`/projects/${tenantId}/Tasks/new`}>
                <button className="w-full flex items-center justify-start px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors">
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Create New Task
                </button>
              </Link>
              <Link href={`/projects/${tenantId}/Time/new`}>
                <button className="w-full flex items-center justify-start px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors">
                  <Clock className="mr-2 h-4 w-4" />
                  Log Time Entry
                </button>
              </Link>
              <Link href={`/projects/${tenantId}/Time`}>
                <button className="w-full flex items-center justify-start px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors">
                  <Clock className="mr-2 h-4 w-4" />
                  View Time Entries
                </button>
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

