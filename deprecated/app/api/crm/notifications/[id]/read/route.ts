import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * POST /api/crm/notifications/[id]/read
 * Mark a notification as read
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

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
          id: params.id,
          repId: salesRep.id,
          tenantId,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
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
