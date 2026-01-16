import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

// GET /api/projects/reports - Get project reports data
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'projects')

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'overview'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    switch (reportType) {
      case 'overview': {
        // Get all project IDs for this tenant
        const projects = await prisma.project.findMany({
          where: { tenantId },
          select: { id: true },
        })
        const projectIds = projects.map(p => p.id)

        // Get overview statistics
        const [
          totalProjects,
          activeProjects,
          completedProjects,
          totalTasks,
          completedTasks,
          totalTimeLogged,
          totalBudget,
          totalCost,
        ] = await Promise.all([
          prisma.project.count({ where: { tenantId } }),
          prisma.project.count({ where: { tenantId, status: 'IN_PROGRESS' } }),
          prisma.project.count({ where: { tenantId, status: 'COMPLETED' } }),
          prisma.projectTask.count({ where: { projectId: { in: projectIds } } }),
          prisma.projectTask.count({ where: { projectId: { in: projectIds }, status: 'DONE' } }),
          prisma.timeEntry.aggregate({
            where: { projectId: { in: projectIds }, ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }) },
            _sum: { hours: true },
          }),
          prisma.project.aggregate({
            where: { tenantId },
            _sum: { budget: true },
          }),
          prisma.project.aggregate({
            where: { tenantId },
            _sum: { actualCost: true },
          }),
        ])

        return NextResponse.json({
          totalProjects,
          activeProjects,
          completedProjects,
          totalTasks,
          completedTasks,
          totalTimeLogged: Number(totalTimeLogged._sum.hours) || 0,
          totalBudget: Number(totalBudget._sum.budget) || 0,
          totalCost: Number(totalCost._sum.actualCost) || 0,
        })
      }

      case 'status': {
        // Projects by status
        const projectsByStatus = await prisma.project.groupBy({
          by: ['status'],
          where: { tenantId },
          _count: { id: true },
        })

        return NextResponse.json({
          projectsByStatus: projectsByStatus.map((p: any) => ({
            status: p.status,
            count: p._count.id,
          })),
        })
      }

      case 'time': {
        // Get all project IDs for this tenant
        const projects = await prisma.project.findMany({
          where: { tenantId },
          select: { id: true },
        })
        const projectIds = projects.map(p => p.id)

        // Time tracking report
        const timeEntries = await prisma.timeEntry.findMany({
          where: {
            projectId: { in: projectIds },
            ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
          },
          include: {
            project: { select: { id: true, name: true } },
            task: { select: { id: true, name: true } },
            user: { select: { id: true, name: true, email: true } },
          },
        })

        const byProject = timeEntries.reduce((acc: any, entry) => {
          const projectId = entry.projectId
          if (!acc[projectId]) {
            acc[projectId] = {
              projectId,
              projectName: entry.project.name,
              totalHours: 0,
              billableHours: 0,
              billableAmount: 0,
            }
          }
          const hours = Number(entry.hours)
          acc[projectId].totalHours += hours
          if (entry.billable) {
            acc[projectId].billableHours += hours
            if (entry.billingRate) {
              acc[projectId].billableAmount += hours * Number(entry.billingRate)
            }
          }
          return acc
        }, {})

        return NextResponse.json({
          byProject: Object.values(byProject),
          totalHours: timeEntries.reduce((sum, entry) => sum + Number(entry.hours), 0),
        })
      }

      case 'tasks': {
        // Get all project IDs for this tenant
        const projects = await prisma.project.findMany({
          where: { tenantId },
          select: { id: true },
        })
        const projectIds = projects.map(p => p.id)

        // Task completion report
        const tasks = await prisma.projectTask.findMany({
          where: { projectId: { in: projectIds } },
          include: {
            project: { select: { id: true, name: true } },
            assignedTo: { select: { id: true, name: true } },
          },
        })

        const byStatus = tasks.reduce((acc: any, task) => {
          const status = task.status
          if (!acc[status]) {
            acc[status] = { status, count: 0 }
          }
          acc[status].count++
          return acc
        }, {})

        const byPriority = tasks.reduce((acc: any, task) => {
          const priority = task.priority
          if (!acc[priority]) {
            acc[priority] = { priority, count: 0 }
          }
          acc[priority].count++
          return acc
        }, {})

        return NextResponse.json({
          byStatus: Object.values(byStatus),
          byPriority: Object.values(byPriority),
          totalTasks: tasks.length,
          completedTasks: tasks.filter(t => t.status === 'DONE').length,
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get projects reports error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

