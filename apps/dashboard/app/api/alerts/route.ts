import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { prismaWithRetry } from '@/lib/db/connection-retry'

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

    // Get user's sales rep record - use minimal retries
    let salesRep
    try {
      salesRep = await prismaWithRetry(() =>
        prisma.salesRep.findFirst({
          where: {
            userId: user.userId,
            tenantId: user.tenantId,
          },
        }),
        {
          maxRetries: 1,
          retryDelay: 200,
          exponentialBackoff: false,
        }
      )
    } catch (error: any) {
      // If circuit breaker is open, return empty alerts
      if (error?.code === 'CIRCUIT_OPEN' || error?.isCircuitBreaker) {
        return NextResponse.json({ alerts: [], unreadCount: 0 }, { status: 503 })
      }
      throw error
    }

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

    // Execute queries sequentially to prevent pool exhaustion
    let alerts = []
    let unreadCount = 0
    
    try {
      alerts = await prismaWithRetry(() =>
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
        {
          maxRetries: 1,
          retryDelay: 200,
          exponentialBackoff: false,
        }
      )
      
      // Small delay between queries
      await new Promise(resolve => setTimeout(resolve, 100))
      
      unreadCount = await prismaWithRetry(() =>
        prisma.alert.count({
          where: {
            repId: salesRep.id,
            tenantId: user.tenantId,
            isRead: false,
          },
        }),
        {
          maxRetries: 1,
          retryDelay: 200,
          exponentialBackoff: false,
        }
      )
    } catch (error: any) {
      // If circuit breaker is open, return empty alerts
      if (error?.code === 'CIRCUIT_OPEN' || error?.isCircuitBreaker) {
        return NextResponse.json({ alerts: [], unreadCount: 0 }, { status: 503 })
      }
      throw error
    }

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
  } catch (error: any) {
    console.error('Get alerts error:', error)
    
    // Handle circuit breaker and pool exhaustion gracefully
    const errorMessage = error?.message || String(error)
    const errorCode = error?.code || ''
    
    if (errorCode === 'CIRCUIT_OPEN' || error?.isCircuitBreaker || 
        errorMessage.includes('connection pool') || errorMessage.includes('temporarily unavailable')) {
      return NextResponse.json(
        { alerts: [], unreadCount: 0 },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to get alerts' },
      { status: 500 }
    )
  }
}
