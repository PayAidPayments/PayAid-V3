import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createProductSchema = z.object({
  storeId: z.string(),
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  inventoryQuantity: z.number().int().default(0),
  trackInventory: z.boolean().default(true),
  weight: z.number().positive().optional(),
  images: z.array(z.string()).default([]),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  isDigital: z.boolean().default(false),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
})

/**
 * GET /api/ecommerce/products
 * List products
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ecommerce')

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')

    const where: any = { tenantId }
    if (storeId) where.storeId = storeId
    if (category) where.category = category
    if (isActive !== null) where.isActive = isActive === 'true'
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const products = await prisma.ecommerceProduct.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ products })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get products error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ecommerce/products
 * Create product
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ecommerce')

    const body = await request.json()
    const validated = createProductSchema.parse(body)

    // Verify store belongs to tenant
    const store = await prisma.ecommerceStore.findFirst({
      where: {
        id: validated.storeId,
        tenantId,
      },
    })

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      )
    }

    // Check if SKU already exists in this store
    const existing = await prisma.ecommerceProduct.findUnique({
      where: {
        storeId_sku: {
          storeId: validated.storeId,
          sku: validated.sku,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Product with this SKU already exists in this store' },
        { status: 400 }
      )
    }

    const product = await prisma.ecommerceProduct.create({
      data: {
        storeId: validated.storeId,
        tenantId,
        sku: validated.sku,
        name: validated.name,
        description: validated.description,
        shortDescription: validated.shortDescription,
        price: validated.price,
        compareAtPrice: validated.compareAtPrice,
        costPrice: validated.costPrice,
        inventoryQuantity: validated.inventoryQuantity,
        trackInventory: validated.trackInventory,
        weight: validated.weight,
        images: validated.images,
        category: validated.category,
        tags: validated.tags,
        isActive: validated.isActive,
        isDigital: validated.isDigital,
        seoTitle: validated.seoTitle,
        seoDescription: validated.seoDescription,
      },
      include: {
        store: true,
      },
    })

    return NextResponse.json({ product }, { status: 201 })
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

    console.error('Create product error:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

