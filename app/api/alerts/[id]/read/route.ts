import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

/**
 * PUT /api/alerts/[id]/read
 * Mark an alert as read
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: alertId } = await params

    // Verify alert belongs to user's sales rep
    const salesRep = await prisma.salesRep.findFirst({
      where: {
        userId: user.id,
        tenantId: user.tenantId,
      },
    })

    if (!salesRep) {
      return NextResponse.json(
        { error: 'Sales rep not found' },
        { status: 404 }
      )
    }

    const alert = await prisma.alert.findFirst({
      where: {
        id: alertId,
        repId: salesRep.id,
        tenantId: user.tenantId,
      },
    })

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      )
    }

    // Mark as read
    const updated = await prisma.alert.update({
      where: { id: alertId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      alert: {
        id: updated.id,
        isRead: updated.isRead,
        readAt: updated.readAt,
      },
    })
  } catch (error) {
    console.error('Mark alert read error:', error)
    return NextResponse.json(
      { error: 'Failed to mark alert as read' },
      { status: 500 }
    )
  }
}
