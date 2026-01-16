import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createLocationSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().default('India'),
  isActive: z.boolean().default(true),
})

// GET /api/locations - Get all locations
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'inventory')

    const locations = await prisma.location.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    })

    // Fetch stats for each location
    const locationsWithStats = await Promise.all(
      locations.map(async (location) => {
        const [employees, products, invoices, orders] = await Promise.all([
          prisma.employee.count({
            where: {
              tenantId,
              locationId: location.id,
              status: 'ACTIVE',
            },
          }),
          prisma.inventoryLocation.count({
            where: {
              tenantId,
              locationId: location.id,
              quantity: { gt: 0 },
            },
          }),
          prisma.invoice.findMany({
            where: {
              tenantId,
              createdAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              },
              status: 'PAID',
            },
            select: { total: true },
          }),
          prisma.order.count({
            where: {
              tenantId,
              createdAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              },
            },
          }),
        ])

        const revenue = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)

        return {
          ...location,
          stats: {
            employees,
            products,
            revenue,
            orders,
          },
        }
      })
    )

    return NextResponse.json({ locations: locationsWithStats })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get locations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}

// POST /api/locations - Create a new location
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'inventory')

    const body = await request.json()
    const validated = createLocationSchema.parse(body)

    // Check if location name already exists for this tenant
    const existing = await prisma.location.findFirst({
      where: {
        tenantId,
        name: validated.name,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Location with this name already exists' },
        { status: 400 }
      )
    }

    const location = await prisma.location.create({
      data: {
        tenantId,
        name: validated.name,
        code: validated.code || null,
        city: validated.city || null,
        state: validated.state || null,
        country: validated.country,
        isActive: validated.isActive,
      },
    })

    return NextResponse.json({ location }, { status: 201 })
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

    console.error('Create location error:', error)
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    )
  }
}

