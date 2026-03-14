import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

// GET /api/industries/retail/products - List retail products
export async function GET(request: NextRequest) {
  try {
    // Check crm module license
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    // Verify tenant is retail industry
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { industry: true },
    })

    if (tenant?.industry !== 'retail') {
      return NextResponse.json(
        { error: 'This endpoint is only for retail industry' },
        { status: 403 }
      )
    }

    const products = await prisma.retailProduct.findMany({
      where: {
        tenantId: tenantId,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Get retail products error:', error)
    return NextResponse.json(
      { error: 'Failed to get retail products' },
      { status: 500 }
    )
  }
}
