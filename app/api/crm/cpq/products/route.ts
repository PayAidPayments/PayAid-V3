import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/crm/cpq/products - Get products for CPQ (from Product model, tenant-scoped)
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const products = await prisma.product.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        description: true,
        sku: true,
        salePrice: true,
        hsnCode: true,
        sacCode: true,
        categories: true,
      },
      orderBy: { name: 'asc' },
    })

    const list = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? undefined,
      sku: p.sku,
      basePrice: p.salePrice,
      unit: 'unit',
      category: Array.isArray(p.categories) && p.categories[0] ? String(p.categories[0]) : undefined,
      hsnCode: p.hsnCode ?? undefined,
      sacCode: p.sacCode ?? undefined,
    }))

    return NextResponse.json({ success: true, products: list })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get products error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products', message: error?.message },
      { status: 500 }
    )
  }
}
