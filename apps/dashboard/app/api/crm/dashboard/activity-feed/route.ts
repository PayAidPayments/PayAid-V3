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
    const requestedLimit = parseInt(searchParams.get('limit') || '100', 10)
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 200) : 100
    const type = (searchParams.get('type') || '').toLowerCase() // Optional: filter by type
    const mode = (searchParams.get('mode') || 'full').toLowerCase() === 'light' ? 'light' : 'full'
    const cursor = searchParams.get('cursor')
    const cursorDate = cursor ? new Date(cursor) : null
    const hasValidCursor = !!(cursorDate && !Number.isNaN(cursorDate.getTime()))

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

    const interactionTypes = new Set(['call', 'email', 'meeting', 'whatsapp', 'sms'])
    const fetchTasks = !type || type === 'task'
    const fetchDeals = !type || type === 'deal'
    const fetchInteractions = !type || interactionTypes.has(type)
    const sourceCount = [fetchTasks, fetchInteractions, fetchDeals].filter(Boolean).length || 1
    const perSourceTake = Math.min(120, Math.max(20, Math.ceil(limit / sourceCount) + 8))

    const taskWhere: any = {
      ...baseFilter,
      ...(hasValidCursor ? { updatedAt: { lt: cursorDate! } } : {}),
    }
    const interactionWhere: any = {
      contact: {
        tenantId,
      },
      ...(fetchInteractions && type ? { type } : {}),
      ...(hasValidCursor ? { createdAt: { lt: cursorDate! } } : {}),
      ...(user?.userId && userRole !== 'owner' && userRole !== 'admin' && userRole !== 'manager'
        ? { createdByRepId: user.userId }
        : {}),
    }
    const dealWhere: any = {
      tenantId,
      ...(hasValidCursor ? { updatedAt: { lt: cursorDate! } } : {}),
      ...(user?.userId && userRole !== 'owner' && userRole !== 'admin' && userRole !== 'manager'
        ? {
            assignedTo: {
              userId: user.userId,
            },
          }
        : {}),
    }

    // Fetch all activity types in parallel
    const [tasks, interactions, deals] = await Promise.all([
      // Tasks (activities)
      fetchTasks
        ? prismaWithRetry(() =>
            prisma.task.findMany({
              where: taskWhere,
              select: {
                id: true,
                title: true,
                ...(mode === 'full' ? { description: true } : {}),
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
              take: perSourceTake,
            })
          )
        : Promise.resolve([]),
      // Interactions (calls, emails, meetings, WhatsApp, SMS)
      fetchInteractions
        ? prismaWithRetry(() =>
            prisma.interaction.findMany({
              where: interactionWhere,
              select: {
                id: true,
                type: true,
                subject: true,
                ...(mode === 'full' ? { notes: true, duration: true } : {}),
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
              take: perSourceTake,
            })
          )
        : Promise.resolve([]),
      // Deals (created, updated, won, lost)
      fetchDeals
        ? prismaWithRetry(() =>
            prisma.deal.findMany({
              where: dealWhere,
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
              take: perSourceTake,
            })
          )
        : Promise.resolve([]),
    ])

    // Combine and sort all activities chronologically
    const activities: any[] = []

    // Add tasks as activities
    tasks.forEach((task) => {
      activities.push({
        id: `task_${task.id}`,
        type: 'task',
        title: task.title,
        description: mode === 'full' ? task.description : undefined,
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
        description: mode === 'full' ? interaction.notes : undefined,
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
    const lastTimestamp = limitedActivities.length > 0 ? limitedActivities[limitedActivities.length - 1].timestamp : null
    const nextCursor = limitedActivities.length === limit && lastTimestamp
      ? new Date(lastTimestamp).toISOString()
      : null
    const sourceHitCap =
      (Array.isArray(tasks) && tasks.length >= perSourceTake) ||
      (Array.isArray(interactions) && interactions.length >= perSourceTake) ||
      (Array.isArray(deals) && deals.length >= perSourceTake)
    const hasMore = Boolean(nextCursor && sourceHitCap)

    const durationMs = Date.now() - startTime
    console.log(`[CRM_ACTIVITY_FEED] tenant=${tenantId} user=${user?.userId || 'unknown'} type=${type || 'all'} limit=${limit} mode=${mode} cursor=${cursor || 'none'} duration=${durationMs}ms`)

    return NextResponse.json({
      activities: limitedActivities,
      total: activities.length,
      nextCursor,
      hasMore,
      mode,
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
