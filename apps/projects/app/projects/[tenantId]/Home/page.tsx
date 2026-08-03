'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  FolderKanban,
  Clock,
  Target,
  CheckCircle2,
  Plus,
  ListTodo,
} from 'lucide-react'
import {
  ModuleDashboardShell,
  DashboardEmptyState,
  DashboardSkeleton,
  type DashboardKpi,
  type DashboardAction,
} from '@/components/modules/dashboard'
import { getModuleConfig } from '@/lib/modules/module-config'
import { useAuthStore } from '@/lib/stores/auth'
import type { ProjectsHomeChartStats } from './ProjectsHomeCharts'

const ProjectsHomeCharts = dynamic(
  () => import('./ProjectsHomeCharts').then((m) => ({ default: m.ProjectsHomeCharts })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] rounded-xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
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
  const moduleConfig = getModuleConfig('projects')

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
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to fetch dashboard stats')
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred while fetching data.'
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

  if (loading) return <DashboardSkeleton />
  if (!moduleConfig) return <div>Module configuration not found</div>

  const completionRate =
    stats && stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0

  const kpis: DashboardKpi[] = [
    {
      label: 'Total projects',
      value: stats?.totalProjects || 0,
      change: stats?.totalProjects
        ? Math.round(((stats.activeProjects || 0) / Math.max(stats.totalProjects, 1)) * 100)
        : undefined,
      trend: 'up',
      icon: <FolderKanban className="w-5 h-5" />,
      tone: 'purple',
      href: `/projects/${tenantId}/Projects`,
    },
    {
      label: 'Active',
      value: stats?.activeProjects || 0,
      icon: <Target className="w-5 h-5" />,
      tone: 'success',
      href: `/projects/${tenantId}/Projects?status=active`,
    },
    {
      label: 'Tasks',
      value: stats?.totalTasks || 0,
      change: completionRate || undefined,
      trend: 'up',
      icon: <CheckCircle2 className="w-5 h-5" />,
      tone: 'info',
      href: `/projects/${tenantId}/Tasks`,
    },
    {
      label: 'Time logged',
      value: stats?.totalTimeLogged ? `${Math.round(stats.totalTimeLogged)}h` : '0h',
      icon: <Clock className="w-5 h-5" />,
      tone: 'gold',
    },
  ]

  const actions: DashboardAction[] = [
    {
      label: 'New project',
      href: `/projects/${tenantId}/Projects/new`,
      icon: <Plus className="w-4 h-4" />,
    },
    {
      label: 'Tasks',
      href: `/projects/${tenantId}/Tasks`,
      icon: <ListTodo className="w-4 h-4" />,
      variant: 'secondary',
    },
    {
      label: 'Time entries',
      href: `/projects/${tenantId}/Time`,
      variant: 'secondary',
    },
  ]

  const hasProjects = (stats?.totalProjects || 0) > 0

  return (
    <ModuleDashboardShell
      moduleId="projects"
      title="Projects"
      moduleIcon={<moduleConfig.icon className="w-7 h-7" />}
      error={error}
      kpis={kpis}
      insight={{
        text: hasProjects
          ? `${stats?.activeProjects || 0} active projects · ${completionRate}% task completion · ${stats?.totalTimeLogged ? Math.round(stats.totalTimeLogged) : 0}h logged.`
          : 'No projects yet. Create a project to unlock status charts and recent activity.',
        status: hasProjects ? 'ready' : 'unavailable',
      }}
      actions={actions}
      secondaryTitle="Projects by status"
      secondaryDescription="Primary portfolio chart — recent lists live under Projects"
      secondary={
        stats && hasProjects ? (
          <ProjectsHomeCharts tenantId={tenantId} stats={stats} compact />
        ) : (
          <DashboardEmptyState
            icon={<FolderKanban />}
            title="No projects yet"
            description="Create your first project to see status distribution here."
            actionLabel="New project"
            actionHref={`/projects/${tenantId}/Projects/new`}
          />
        )
      }
    />
  )
}
