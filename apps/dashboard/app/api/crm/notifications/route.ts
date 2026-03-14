import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/crm/notifications
 * Get notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    // Fetch alerts as notifications for the user
    // Note: Alert uses repId (SalesRep), need to find SalesRep by userId first
    const salesRep = await prisma.salesRep.findFirst({
      where: {
        userId: userId,
        tenantId,
      },
    })

    const notifications = salesRep ? await prisma.alert.findMany({
      where: {
        repId: salesRep.id,
        tenantId,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }) : []

    const unreadCount = salesRep ? await prisma.alert.count({
      where: {
        repId: salesRep.id,
        tenantId,
        isRead: false,
      },
    }) : 0

    return NextResponse.json({
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message || n.title,
        timestamp: n.createdAt,
        read: n.isRead,
        actionUrl: null,
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
