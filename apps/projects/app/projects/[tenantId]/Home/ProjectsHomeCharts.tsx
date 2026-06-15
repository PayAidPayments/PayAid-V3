'use client'

import Link from 'next/link'
import { Calendar, CheckSquare, Clock, FolderKanban } from 'lucide-react'
import { GlassCard } from '@/components/modules/GlassCard'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const PURPLE_PRIMARY = '#53328A'
const CHART_COLORS = [PURPLE_PRIMARY, '#F5C700', '#059669', '#0284C7', '#8B5CF6', '#EC4899']

export type ProjectsHomeChartStats = {
  totalTasks: number
  recentProjects: Array<{
    id: string
    name: string
    status: string
    progress: number
    createdAt: string
  }>
  projectsByStatus: Array<{ status: string; count: number }>
  monthlyProjectCreation: Array<{ month: string; count: number }>
}

type ProjectsHomeChartsProps = {
  tenantId: string
  stats: ProjectsHomeChartStats
}

export function ProjectsHomeCharts({ tenantId, stats }: ProjectsHomeChartsProps) {
  const projectsByStatusData = (() => {
    if (!stats?.projectsByStatus || !Array.isArray(stats.projectsByStatus)) return []
    return stats.projectsByStatus.map((item, idx) => ({
      name: item?.status ? item.status.replace('_', ' ') : 'Unknown',
      value: item?.count || 0,
      fill: CHART_COLORS[idx % CHART_COLORS.length],
    }))
  })()

  const monthlyProjectData = (() => {
    if (!stats?.monthlyProjectCreation || !Array.isArray(stats.monthlyProjectCreation)) return []
    return stats.monthlyProjectCreation.map((item) => ({
      month: item?.month || '',
      projects: item?.count || 0,
    }))
  })()

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Projects by Status</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Distribution of projects across different statuses
          </p>
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
                    label={({ name, percent }) =>
                      `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
                    }
                  >
                    {projectsByStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value, 'Projects']}
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

        <GlassCard delay={0.1}>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Monthly Project Creation</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Project creation trend over time</p>
          {monthlyProjectData.length > 0 ? (
            <div style={{ minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyProjectData}>
                  <defs>
                    <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PURPLE_PRIMARY} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={PURPLE_PRIMARY} stopOpacity={0} />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard delay={0.2}>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Recent Projects</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Latest projects created</p>
          {stats?.recentProjects?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{project.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{project.progress}%</span>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      project.status === 'IN_PROGRESS'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : project.status === 'ON_HOLD'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : project.status === 'COMPLETED'
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No recent projects</p>
          )}
        </GlassCard>

        <GlassCard delay={0.3}>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Quick Actions</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Get started with Projects</p>
          <div className="space-y-2">
            <Link href={`/projects/${tenantId}/Projects/new`}>
              <button
                type="button"
                className="w-full flex items-center justify-start px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors"
              >
                <FolderKanban className="mr-2 h-4 w-4" />
                Create New Project
              </button>
            </Link>
            <Link href={`/projects/${tenantId}/Gantt`}>
              <button
                type="button"
                className="w-full flex items-center justify-start px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors"
              >
                <Calendar className="mr-2 h-4 w-4" />
                View Gantt Chart
              </button>
            </Link>
            <Link href={`/projects/${tenantId}/Tasks/new`}>
              <button
                type="button"
                className="w-full flex items-center justify-start px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors"
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                Create New Task
              </button>
            </Link>
            <Link href={`/projects/${tenantId}/Time/new`}>
              <button
                type="button"
                className="w-full flex items-center justify-start px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors"
              >
                <Clock className="mr-2 h-4 w-4" />
                Log Time Entry
              </button>
            </Link>
            <Link href={`/projects/${tenantId}/Time`}>
              <button
                type="button"
                className="w-full flex items-center justify-start px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white/70 dark:hover:bg-gray-800/70 transition-colors"
              >
                <Clock className="mr-2 h-4 w-4" />
                View Time Entries
              </button>
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}