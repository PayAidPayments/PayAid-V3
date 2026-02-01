import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/projects/dashboard/stats - Get Projects dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'projects')

    // Get current date for calculations
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const sixMonthsAgo = new Date(now)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Fetch all data in parallel
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      onHoldProjects,
      totalTasks,
      completedTasks,
      totalTimeLogged,
      projectsByStatus,
      projectsByPriority,
      recentProjects,
    ] = await Promise.all([
      // Total projects
      prisma.project.count({
        where: { tenantId },
      }).catch(() => 0),
      
      // Active projects
      prisma.project.count({
        where: {
          tenantId,
          status: 'IN_PROGRESS',
        },
      }).catch(() => 0),
      
      // Completed projects
      prisma.project.count({
        where: {
          tenantId,
          status: 'COMPLETED',
        },
      }).catch(() => 0),
      
      // On hold projects
      prisma.project.count({
        where: {
          tenantId,
          status: 'ON_HOLD',
        },
      }).catch(() => 0),
      
      // Total tasks
      prisma.projectTask.count({
        where: { 
          project: {
            tenantId,
          },
        },
      }).catch(() => 0),
      
      // Completed tasks
      prisma.projectTask.count({
        where: {
          project: {
            tenantId,
          },
          status: 'COMPLETED',
        },
      }).catch(() => 0),
      
      // Total time logged this month
      prisma.timeEntry.aggregate({
        where: {
          project: {
            tenantId,
          },
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: { hours: true },
      }).catch(() => ({ _sum: { hours: null } })),
      
      // Projects by status
      prisma.project.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { id: true },
      }).catch(() => []),
      
      // Projects by priority
      prisma.project.groupBy({
        by: ['priority'],
        where: { tenantId },
        _count: { id: true },
      }).catch(() => []),
      
      // Recent projects (last 5)
      prisma.project.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          progress: true,
          createdAt: true,
        },
      }).catch(() => []),
    ])

    // Monthly project creation (last 6 months)
    // Use Prisma queries instead of raw SQL for database compatibility
    let monthlyProjectCreation: Array<{ month: string; count: number }> = []
    try {
      const projects = await prisma.project.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: sixMonthsAgo,
          },
        },
        select: {
          createdAt: true,
        },
      })

      // Group by month
      const monthMap = new Map<string, number>()
      projects.forEach((project) => {
        if (project.createdAt) {
          const date = new Date(project.createdAt)
          const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1)
        }
      })

      monthlyProjectCreation = Array.from(monthMap.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => {
          const dateA = new Date(a.month)
          const dateB = new Date(b.month)
          return dateA.getTime() - dateB.getTime()
        })
    } catch (error) {
      console.error('Error fetching monthly project creation:', error)
      monthlyProjectCreation = []
    }

    return NextResponse.json({
      totalProjects,
      activeProjects,
      completedProjects,
      onHoldProjects,
      totalTasks,
      completedTasks,
      totalTimeLogged: Number(totalTimeLogged._sum?.hours || 0) || 0,
      projectsByStatus: projectsByStatus.map((p: any) => ({
        status: p.status,
        count: p._count.id || 0,
      })),
      projectsByPriority: projectsByPriority.map((p: any) => ({
        priority: p.priority,
        count: p._count.id || 0,
      })),
      monthlyProjectCreation: Array.isArray(monthlyProjectCreation) 
        ? monthlyProjectCreation.map((m: any) => ({
            month: m.month || '',
            count: Number(m.count) || 0,
          }))
        : [],
      recentProjects: recentProjects.map((p: any) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        progress: p.progress || 0,
        createdAt: p.createdAt.toISOString(),
      })),
    })
  } catch (error: any) {
    console.error('Projects dashboard stats error:', error)
    
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    return NextResponse.json(
      { error: 'Failed to fetch projects dashboard stats', message: error?.message },
      { status: 500 }
    )
  }
}

