import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

// GET /api/alerts - Get all alerts for current user
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get user's sales rep record
    const salesRep = await prisma.salesRep.findFirst({
      where: {
        userId: user.id,
        tenantId: user.tenantId,
      },
    })

    if (!salesRep) {
      // User is not a sales rep, return empty
      return NextResponse.json({ alerts: [], unreadCount: 0 })
    }

    const where: any = {
      repId: salesRep.id,
      tenantId: user.tenantId,
    }

    if (unreadOnly) {
      where.isRead = false
    }

    const [alerts, unreadCount] = await Promise.all([
      prisma.alert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          rep: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.alert.count({
        where: {
          repId: salesRep.id,
          tenantId: user.tenantId,
          isRead: false,
        },
      }),
    ])

    return NextResponse.json({
      alerts: alerts.map((alert) => ({
        id: alert.id,
        type: alert.type,
        title: alert.title,
        message: alert.message,
        leadId: alert.leadId,
        dealId: alert.dealId,
        taskId: alert.taskId,
        priority: alert.priority,
        isRead: alert.isRead,
        readAt: alert.readAt,
        createdAt: alert.createdAt,
      })),
      unreadCount,
    })
  } catch (error) {
    console.error('Get alerts error:', error)
    return NextResponse.json(
      { error: 'Failed to get alerts' },
      { status: 500 }
    )
  }
}
