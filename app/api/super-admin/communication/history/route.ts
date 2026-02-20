import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/super-admin/communication/history
 * Get broadcast history
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication first
    try {
      await requireSuperAdmin()
    } catch (authError: any) {
      return NextResponse.json(
        { error: authError.message === 'Unauthorized' ? 'Unauthorized' : 'Forbidden' },
        { status: authError.message === 'Unauthorized' ? 401 : 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get platform announcements from Alert model
    // Filter by type 'PLATFORM_ANNOUNCEMENT'
    const announcements = await prisma.alert.findMany({
      where: {
        type: 'PLATFORM_ANNOUNCEMENT',
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            subscriptionTier: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    // Group by title/message to show unique broadcasts
    const broadcastMap = new Map<string, {
      title: string
      message: string
      priority: string
      createdAt: string
      tenantCount: number
      tenants: Array<{ id: string; name: string; tier: string }>
      channels: string[]
    }>()

    for (const ann of announcements) {
      const key = `${ann.title}|${ann.message}|${ann.createdAt.toISOString().split('T')[0]}`
      
      if (!broadcastMap.has(key)) {
        broadcastMap.set(key, {
          title: ann.title,
          message: ann.message,
          priority: ann.priority,
          createdAt: ann.createdAt.toISOString(),
          tenantCount: 0,
          tenants: [],
          channels: ann.channels,
        })
      }

      const broadcast = broadcastMap.get(key)!
      broadcast.tenantCount++
      broadcast.tenants.push({
        id: ann.tenant.id,
        name: ann.tenant.name,
        tier: ann.tenant.subscriptionTier,
      })
    }

    const broadcasts = Array.from(broadcastMap.values())

    // Get total count
    const total = await prisma.alert.count({
      where: {
        type: 'PLATFORM_ANNOUNCEMENT',
      },
    })

    return NextResponse.json({
      broadcasts,
      total,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('Get broadcast history error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch broadcast history' },
      { status: 500 }
    )
  }
}
