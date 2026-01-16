import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/crm/cpq/products - Get products for CPQ
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    // Get products from inventory or create sample data
    // In production, this would fetch from Product model
    const sampleProducts = [
      {
        id: 'product-1',
        name: 'Enterprise License',
        description: 'Full enterprise license with all features',
        basePrice: 9999,
        unit: 'license',
        category: 'Software',
      },
      {
        id: 'product-2',
        name: 'Professional License',
        description: 'Professional license with core features',
        basePrice: 4999,
        unit: 'license',
        category: 'Software',
      },
      {
        id: 'product-3',
        name: 'Implementation Services',
        description: 'On-site implementation and training',
        basePrice: 50000,
        unit: 'project',
        category: 'Services',
      },
    ]

    return NextResponse.json({ products: sampleProducts })
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
