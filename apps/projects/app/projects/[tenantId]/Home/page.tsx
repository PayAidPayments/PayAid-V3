'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import {
  FolderKanban,
  Clock,
  Target,
  CheckCircle2,
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import type { ProjectsHomeChartStats } from './ProjectsHomeCharts'

const ProjectsHomeCharts = dynamic(
  () => import('./ProjectsHomeCharts').then((m) => ({ default: m.ProjectsHomeCharts })),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 space-y-8 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-[360px] rounded-xl bg-gray-200/80 dark:bg-gray-800/80" />
          <div className="h-[360px] rounded-xl bg-gray-200/80 dark:bg-gray-800/80" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-[280px] rounded-xl bg-gray-200/80 dark:bg-gray-800/80" />
          <div className="h-[280px] rounded-xl bg-gray-200/80 dark:bg-gray-800/80" />
        </div>
      </div>
    ),
  }
)

interface ProjectsDashboardStats extends ProjectsHomeChartStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  onHoldProjects: number
  completedTasks: number
  totalTimeLogged: number
}

export default function ProjectsDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
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
        setLoading(false)
        return
      }

      const response = await fetch('/api/projects/dashboard/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch dashboard stats')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred while fetching data.'
      console.error('Failed to fetch dashboard stats:', err)
      setError(message)
      setStats({
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        onHoldProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        totalTimeLogged: 0,
        projectsByStatus: [],
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

  const moduleConfig = getModuleConfig('projects')
  if (!moduleConfig) {
    return <div>Module configuration not found</div>
  }

  const completionRate =
    stats && stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0

  const heroMetrics = [
    {
      label: 'Total Projects',
      value: stats?.totalProjects || 0,
      change: stats?.activeProjects
        ? Math.round((stats.activeProjects / stats.totalProjects) * 100)
        : 0,
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

  return (
    <div className="w-full -mx-2 sm:-mx-0">
      <UniversalModuleHero
        moduleName="Projects"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      {error && (
        <div className="mx-2 sm:mx-0 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950/30 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300 font-medium">Error:</p>
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {stats ? <ProjectsHomeCharts tenantId={tenantId} stats={stats} /> : null}
    </div>
  )
}
