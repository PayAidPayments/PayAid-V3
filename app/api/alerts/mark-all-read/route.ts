import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

/**
 * PUT /api/alerts/mark-all-read
 * Mark all alerts as read for current user
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's sales rep record
    const salesRep = await prisma.salesRep.findFirst({
      where: {
        userId: user.id,
        tenantId: user.tenantId,
      },
    })

    if (!salesRep) {
      return NextResponse.json({ success: true, count: 0 })
    }

    // Mark all unread alerts as read
    const result = await prisma.alert.updateMany({
      where: {
        repId: salesRep.id,
        tenantId: user.tenantId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      count: result.count,
    })
  } catch (error) {
    console.error('Mark all alerts read error:', error)
    return NextResponse.json(
      { error: 'Failed to mark all alerts as read' },
      { status: 500 }
    )
  }
}
