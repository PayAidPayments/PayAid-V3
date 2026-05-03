import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

// GET /api/sms/delivery-reports - List SMS delivery reports
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'communication')

    const status = request.nextUrl.searchParams.get('status')
    const provider = request.nextUrl.searchParams.get('provider')
    const phoneNumber = request.nextUrl.searchParams.get('phoneNumber')
    const campaignId = request.nextUrl.searchParams.get('campaignId')
    const startDate = request.nextUrl.searchParams.get('startDate')
    const endDate = request.nextUrl.searchParams.get('endDate')

    const where: any = { tenantId }
    if (status) where.status = status
    if (provider) where.provider = provider
    if (phoneNumber) where.phoneNumber = { contains: phoneNumber }
    if (campaignId) where.campaignId = campaignId
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const reports = await prisma.sMSDeliveryReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    })

    // Calculate summary stats
    const total = reports.length
    const delivered = reports.filter((r) => r.status === 'DELIVERED').length
    const failed = reports.filter((r) => r.status === 'FAILED').length
    const pending = reports.filter((r) => r.status === 'PENDING').length

    return NextResponse.json({
      reports,
      summary: {
        total,
        delivered,
        failed,
        pending,
        deliveryRate: total > 0 ? ((delivered / total) * 100).toFixed(2) : '0.00',
      },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get SMS delivery reports error:', error)
    return NextResponse.json(
      { error: 'Failed to get SMS delivery reports' },
      { status: 500 }
    )
  }
}

