import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * POST /api/crm/notifications/read-all
 * Mark all notifications as read
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, user } = await requireModuleAccess(request, 'crm')

    await prisma.notification.updateMany({
      where: {
        tenantId,
        userId: user?.userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Mark all notifications read error:', error)

    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    )
  }
}
