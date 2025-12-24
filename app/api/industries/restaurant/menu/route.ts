import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createMenuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  price: z.number().min(0),
  imageUrl: z.string().optional(),
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isSpicy: z.boolean().optional(),
  preparationTime: z.number().optional(),
  calories: z.number().optional(),
  displayOrder: z.number().optional(),
})

// GET /api/industries/restaurant/menu - Get restaurant menu
export async function GET(request: NextRequest) {
  try {
    // Check crm module license
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    // Verify tenant is restaurant industry
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { industry: true },
    })

    if (tenant?.industry !== 'restaurant') {
      return NextResponse.json(
        { error: 'This endpoint is only for restaurant industry' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const availableOnly = searchParams.get('availableOnly') === 'true'

    const where: any = {
      tenantId: tenantId,
    }

    if (category) {
      where.category = category
    }

    if (availableOnly) {
      where.isAvailable = true
    }

    const menuItems = await prisma.restaurantMenuItem.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    })

    // Group by category
    const menuByCategory = menuItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    }, {} as Record<string, typeof menuItems>)

    return NextResponse.json({
      items: menuItems,
      byCategory: menuByCategory,
      categories: Object.keys(menuByCategory),
    })
  } catch (error) {
    console.error('Get restaurant menu error:', error)
    return NextResponse.json(
      { error: 'Failed to get restaurant menu' },
      { status: 500 }
    )
  }
}

// POST /api/industries/restaurant/menu - Create menu item
export async function POST(request: NextRequest) {
  try {
    // Check crm module license
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    // Verify tenant is restaurant industry
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { industry: true },
    })

    if (tenant?.industry !== 'restaurant') {
      return NextResponse.json(
        { error: 'This endpoint is only for restaurant industry' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = createMenuItemSchema.parse(body)

    const menuItem = await prisma.restaurantMenuItem.create({
      data: {
        tenantId: tenantId,
        name: validated.name,
        description: validated.description,
        category: validated.category,
        price: validated.price,
        imageUrl: validated.imageUrl,
        isVegetarian: validated.isVegetarian || false,
        isVegan: validated.isVegan || false,
        isSpicy: validated.isSpicy || false,
        preparationTime: validated.preparationTime,
        calories: validated.calories,
        displayOrder: validated.displayOrder || 0,
      },
    })

    return NextResponse.json(menuItem, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create menu item error:', error)
    return NextResponse.json(
      { error: 'Failed to create menu item' },
      { status: 500 }
    )
  }
}
