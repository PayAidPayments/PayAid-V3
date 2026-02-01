import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/crm/notifications
 * Get notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId, user } = await requireModuleAccess(request, 'crm')

    // Fetch notifications for the user
    const notifications = await prisma.notification.findMany({
      where: {
        tenantId,
        userId: user?.userId,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const unreadCount = await prisma.notification.count({
      where: {
        tenantId,
        userId: user?.userId,
        read: false,
      },
    })

    return NextResponse.json({
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message || n.title,
        timestamp: n.createdAt,
        read: n.read,
        actionUrl: n.actionUrl,
      })),
      unreadCount,
    })
  } catch (error: any) {
    console.error('Notifications error:', error)

    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    // Return empty notifications if error (graceful degradation)
    return NextResponse.json({
      notifications: [],
      unreadCount: 0,
    })
  }
}
