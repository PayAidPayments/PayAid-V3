import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { prismaWithRetry } from '@/lib/db/connection-retry'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { authenticateRequest } from '@/lib/middleware/auth'

// Helper function to get user filter based on role
async function getUserFilter(tenantId: string, userId?: string) {
  if (!userId) {
    return { tenantId }
  }

  const user = await prismaWithRetry(() =>
    prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })
  )

  if (!user) {
    return { tenantId }
  }

  // Admin/Owner: see all data
  if (user.role === 'owner' || user.role === 'admin') {
    return { tenantId }
  }

  // Manager: see team data
  if (user.role === 'manager') {
    return { tenantId }
  }

  // Regular user: see only their own data
  return {
    tenantId,
    assignedToId: userId,
  }
}

// Helper to build task filter (tasks use assignedToId, not assignedTo)
function buildTaskFilter(tenantId: string, userId?: string, userRole?: string) {
  if (!userId || userRole === 'owner' || userRole === 'admin' || userRole === 'manager') {
    return { tenantId }
  }
  return {
    tenantId,
    assignedToId: userId,
  }
}

// GET /api/crm/dashboard/tasks-view - Get Tasks view data for user
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const user = await authenticateRequest(request)
    
    // Get user role for proper filtering
    let userRole: string | undefined
    if (user?.userId) {
      const userRecord = await prismaWithRetry(() =>
        prisma.user.findUnique({
          where: { id: user.userId },
          select: { role: true },
        })
      )
      userRole = userRecord?.role
    }
    
    const taskFilter = buildTaskFilter(tenantId, user?.userId, userRole)
    const contactFilter = await getUserFilter(tenantId, user?.userId)

    // For deals, we need to get the SalesRep ID if user is not admin/manager
    let dealFilter: any = { tenantId }
    if (user?.userId && userRole !== 'owner' && userRole !== 'admin' && userRole !== 'manager') {
      const salesRep = await prismaWithRetry(() =>
        prisma.salesRep.findUnique({
          where: { userId: user.userId },
          select: { id: true },
        })
      )
      if (salesRep) {
        dealFilter.assignedToId = salesRep.id
      } else {
        // If user doesn't have a SalesRep record, they won't see any deals
        dealFilter.assignedToId = 'nonexistent-id'
      }
    }

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Fetch all tasks view data in parallel with retry logic
    const [
      myOpenActivitiesToday,
      myOpenTasks,
      myMeetingsToday,
      myLeads,
      myPipelineDealsByStage,
      myDealsClosingThisMonth,
    ] = await Promise.all([
      // My open activities for today
      prismaWithRetry(() =>
        prisma.task.findMany({
          where: {
            ...taskFilter,
            dueDate: { gte: startOfToday, lte: endOfToday },
            status: { in: ['pending', 'in_progress'] },
          },
          include: {
            contact: {
              select: { name: true, company: true },
            },
          },
          orderBy: { dueDate: 'asc' },
        })
      ),
      // My open tasks
      prismaWithRetry(() =>
        prisma.task.findMany({
          where: {
            ...taskFilter,
            status: { in: ['pending', 'in_progress'] },
          },
          include: {
            contact: {
              select: { name: true, company: true },
            },
          },
          orderBy: { dueDate: 'asc' },
          take: 20,
        })
      ),
      // My meetings for today (tasks with "meeting" in title or description)
      prismaWithRetry(() =>
        prisma.task.findMany({
          where: {
            ...taskFilter,
            dueDate: { gte: startOfToday, lte: endOfToday },
            OR: [
              { title: { contains: 'meeting', mode: 'insensitive' } },
              { title: { contains: 'call', mode: 'insensitive' } },
              { description: { contains: 'meeting', mode: 'insensitive' } },
            ],
            status: { in: ['pending', 'in_progress'] },
          },
          include: {
            contact: {
              select: { name: true, company: true },
            },
          },
          orderBy: { dueDate: 'asc' },
        })
      ),
      // My Leads
      prismaWithRetry(() =>
        prisma.contact.findMany({
          where: {
            ...contactFilter,
            type: 'lead',
            status: 'active',
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true,
            leadScore: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        })
      ),
      // My Pipeline Deals By Stage
      prismaWithRetry(() =>
        prisma.deal.groupBy({
          by: ['stage'],
          where: {
            ...dealFilter,
            stage: { not: 'lost' },
          },
          _count: { id: true },
          _sum: { value: true },
        })
      ),
      // My Deals Closing This Month - limit to 50 to prevent large datasets
      prismaWithRetry(() =>
        prisma.deal.findMany({
          where: {
            ...dealFilter,
            expectedCloseDate: { gte: startOfMonth, lte: endOfMonth },
            stage: { not: 'lost' },
          },
          include: {
            contact: {
              select: { name: true, company: true },
            },
          },
          orderBy: { expectedCloseDate: 'asc' },
          take: 50, // Limit to prevent loading too many deals
        })
      ),
    ])

    // Format pipeline deals by stage
    const pipelineByStage = myPipelineDealsByStage.map(item => ({
      stage: item.stage.charAt(0).toUpperCase() + item.stage.slice(1),
      count: item._count.id,
      totalValue: item._sum.value || 0,
    }))

    const durationMs = Date.now() - startTime
    console.log(`[CRM_TASKS_VIEW] tenant=${tenantId} user=${user?.userId || 'unknown'} duration=${durationMs}ms`)

    return NextResponse.json({
      myOpenActivitiesToday: myOpenActivitiesToday.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        status: task.status,
        priority: task.priority,
        contact: task.contact,
      })),
      myOpenTasks: myOpenTasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        status: task.status,
        priority: task.priority,
        contact: task.contact,
      })),
      myMeetingsToday: myMeetingsToday.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        status: task.status,
        priority: task.priority,
        contact: task.contact,
      })),
      myLeads: myLeads,
      myPipelineDealsByStage: pipelineByStage,
      myDealsClosingThisMonth: myDealsClosingThisMonth.map(deal => ({
        id: deal.id,
        name: deal.name,
        value: deal.value,
        stage: deal.stage,
        expectedCloseDate: deal.expectedCloseDate,
        probability: deal.probability,
        contact: deal.contact,
      })),
    }, {
      headers: {
        // User-specific data: keep caching private
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
        Vary: 'Authorization',
        'Server-Timing': `app;dur=${durationMs}`,
      },
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('CRM tasks view error:', error)
    
    // Handle connection pool exhaustion specifically
    const errorMessage = error?.message || String(error)
    const isPoolExhausted = errorMessage.includes('MaxClientsInSessionMode') || 
                            errorMessage.includes('max clients reached')
    
    if (isPoolExhausted) {
      console.warn('Database connection pool exhausted for CRM tasks view')
      return NextResponse.json(
        { 
          error: 'Database temporarily unavailable',
          message: 'Too many concurrent requests. Please try again in a moment.',
          retryAfter: 5, // Suggest retrying after 5 seconds
        },
        { status: 503 } // Service Unavailable
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch tasks view data', message: error?.message },
      { status: 500 }
    )
  }
}

