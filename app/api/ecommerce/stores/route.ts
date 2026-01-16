import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createStoreSchema = z.object({
  name: z.string().min(1),
  domain: z.string().optional(),
  subdomain: z.string().optional(),
  theme: z.string().default('default'),
  logo: z.string().optional(),
  favicon: z.string().optional(),
  primaryColor: z.string().default('#3B82F6'),
  settings: z.record(z.any()).optional(),
})

/**
 * GET /api/ecommerce/stores
 * List e-commerce stores
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ecommerce')

    const stores = await prisma.ecommerceStore.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ stores })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get stores error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stores' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ecommerce/stores
 * Create e-commerce store
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ecommerce')

    const body = await request.json()
    const validated = createStoreSchema.parse(body)

    // Check if domain/subdomain already exists
    if (validated.domain) {
      const existing = await prisma.ecommerceStore.findUnique({
        where: { domain: validated.domain },
      })
      if (existing) {
        return NextResponse.json(
          { error: 'Domain already in use' },
          { status: 400 }
        )
      }
    }

    if (validated.subdomain) {
      const existing = await prisma.ecommerceStore.findUnique({
        where: { subdomain: validated.subdomain },
      })
      if (existing) {
        return NextResponse.json(
          { error: 'Subdomain already in use' },
          { status: 400 }
        )
      }
    }

    const store = await prisma.ecommerceStore.create({
      data: {
        tenantId,
        name: validated.name,
        domain: validated.domain,
        subdomain: validated.subdomain,
        theme: validated.theme,
        logo: validated.logo,
        favicon: validated.favicon,
        primaryColor: validated.primaryColor,
        settings: validated.settings,
        isActive: true,
      },
    })

    return NextResponse.json({ store }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create store error:', error)
    return NextResponse.json(
      { error: 'Failed to create store' },
      { status: 500 }
    )
  }
}

