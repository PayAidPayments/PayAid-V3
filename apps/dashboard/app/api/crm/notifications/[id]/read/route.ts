import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { findIdempotentRequest, markIdempotentRequest } from '@/lib/ai-native/m0-service'

/**
 * POST /api/crm/notifications/[id]/read
 * Mark a notification as read
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const idempotencyKey = request.headers.get('x-idempotency-key')?.trim()

    if (idempotencyKey) {
      const existing = await findIdempotentRequest(tenantId, `crm:notification:read:${id}:${idempotencyKey}`)
      if (existing) {
        return NextResponse.json({ success: true, deduplicated: true }, { status: 200 })
      }
    }

    // Find SalesRep by userId
    const salesRep = await prisma.salesRep.findFirst({
      where: {
        userId: userId,
        tenantId,
      },
    })

    if (salesRep) {
      await prisma.alert.updateMany({
        where: {
          id: id,
          repId: salesRep.id,
          tenantId,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })
    }

    if (idempotencyKey) {
      await markIdempotentRequest(tenantId, userId, `crm:notification:read:${id}:${idempotencyKey}`, {
        notification_id: id,
        rep_id: salesRep?.id || null,
        marked_read: true,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Mark notification read error:', error)

    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}
