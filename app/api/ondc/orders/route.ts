import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

// GET /api/ondc/orders - List ONDC orders
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = { tenantId }
    if (status) where.status = status

    const orders = await prisma.oNDCOrder.findMany({
      where,
      include: {
        integration: {
          select: {
            id: true,
            sellerId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get ONDC orders error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ONDC orders' },
      { status: 500 }
    )
  }
}

