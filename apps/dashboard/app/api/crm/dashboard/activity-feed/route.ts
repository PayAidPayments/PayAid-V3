import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { prismaWithRetry } from '@/lib/db/connection-retry'
import { requireModuleAccess, handleLicenseError, authenticateRequest } from '@/lib/middleware/auth'

// GET /api/crm/dashboard/activity-feed - Get chronological activity feed
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const user = await authenticateRequest(request)
    
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100')
    const type = searchParams.get('type') // Optional: filter by type

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

    // Build filter - managers/admins see all, regular users see their own
    const baseFilter: any = { tenantId }
    if (user?.userId && userRole !== 'owner' && userRole !== 'admin' && userRole !== 'manager') {
      baseFilter.OR = [
        { createdByRepId: user.userId },
        { assignedToId: user.userId },
      ]
    }

    // Fetch all activity types in parallel
    const [tasks, interactions, deals] = await Promise.all([
      // Tasks (activities)
      prismaWithRetry(() =>
        prisma.task.findMany({
          where: {
            ...baseFilter,
            ...(type === 'task' ? {} : {}), // All tasks for activity feed
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            dueDate: true,
            createdAt: true,
            updatedAt: true,
            assignedToId: true,
            contactId: true,
            contact: {
              select: {
                id: true,
                name: true,
                email: true,
                company: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: limit,
        })
      ),
      // Interactions (calls, emails, meetings, WhatsApp, SMS)
      prismaWithRetry(() =>
        prisma.interaction.findMany({
          where: {
            contact: {
              tenantId,
            },
            ...(type ? { type } : {}),
            ...(user?.userId && userRole !== 'owner' && userRole !== 'admin' && userRole !== 'manager'
              ? { createdByRepId: user.userId }
              : {}),
          },
          select: {
            id: true,
            type: true,
            subject: true,
            notes: true,
            duration: true,
            outcome: true,
            createdAt: true,
            contactId: true,
            contact: {
              select: {
                id: true,
                name: true,
                email: true,
                company: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        })
      ),
      // Deals (created, updated, won, lost)
      prismaWithRetry(() =>
        prisma.deal.findMany({
          where: {
            tenantId,
            ...(user?.userId && userRole !== 'owner' && userRole !== 'admin' && userRole !== 'manager'
              ? {
                  assignedTo: {
                    userId: user.userId,
                  },
                }
              : {}),
          },
          select: {
            id: true,
            name: true,
            value: true,
            stage: true,
            probability: true,
            expectedCloseDate: true,
            createdAt: true,
            updatedAt: true,
            contactId: true,
            contact: {
              select: {
                id: true,
                name: true,
                email: true,
                company: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: limit,
        })
      ),
    ])

    // Combine and sort all activities chronologically
    const activities: any[] = []

    // Add tasks as activities
    tasks.forEach((task) => {
      activities.push({
        id: `task_${task.id}`,
        type: 'task',
        title: task.title,
        description: task.description,
        status: task.status,
        timestamp: task.updatedAt || task.createdAt,
        contact: task.contact,
        metadata: {
          dueDate: task.dueDate,
          assignedToId: task.assignedToId,
        },
      })
    })

    // Add interactions as activities
    interactions.forEach((interaction) => {
      activities.push({
        id: `interaction_${interaction.id}`,
        type: interaction.type, // email, call, meeting, whatsapp, sms
        title: interaction.subject || `${interaction.type} interaction`,
        description: interaction.notes,
        timestamp: interaction.createdAt,
        contact: interaction.contact,
        metadata: {
          duration: interaction.duration,
          outcome: interaction.outcome,
        },
      })
    })

    // Add deals as activities
    deals.forEach((deal) => {
      activities.push({
        id: `deal_${deal.id}`,
        type: 'deal',
        title: deal.name,
        description: `Deal ${deal.stage} - ₹${deal.value?.toLocaleString('en-IN') || '0'}`,
        status: deal.stage,
        timestamp: deal.updatedAt || deal.createdAt,
        contact: deal.contact,
        metadata: {
          value: deal.value,
          stage: deal.stage,
          probability: deal.probability,
          expectedCloseDate: deal.expectedCloseDate,
        },
      })
    })

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // Limit to requested number
    const limitedActivities = activities.slice(0, limit)

    const durationMs = Date.now() - startTime
    console.log(`[CRM_ACTIVITY_FEED] tenant=${tenantId} user=${user?.userId || 'unknown'} type=${type || 'all'} limit=${limit} duration=${durationMs}ms`)

    return NextResponse.json({
      activities: limitedActivities,
      total: activities.length,
    }, {
      headers: {
        // User-specific / role-filtered: private caching only
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=20',
        Vary: 'Authorization',
        'Server-Timing': `app;dur=${durationMs}`,
      },
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get activity feed error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity feed', message: error?.message },
      { status: 500 }
    )
  }
}
