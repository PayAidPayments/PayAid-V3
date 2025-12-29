import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'

const createTableSchema = z.object({
  tableNumber: z.number().int().positive(),
  name: z.string().optional(),
  capacity: z.number().int().positive(),
  location: z.string().optional(),
  notes: z.string().optional(),
})

const updateTableSchema = z.object({
  name: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  location: z.string().optional(),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE']).optional(),
  notes: z.string().optional(),
})

// GET /api/industries/restaurant/tables - List all tables
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const location = searchParams.get('location')

    const where: any = {
      tenantId: user.tenantId,
    }

    if (status) {
      where.status = status
    }

    if (location) {
      where.location = location
    }

    const tables = await prisma.restaurantTable.findMany({
      where,
      include: {
        _count: {
          select: {
            orders: true,
            reservations: true,
          },
        },
      },
      orderBy: {
        tableNumber: 'asc',
      },
    })

    return NextResponse.json({ tables })
  } catch (error) {
    console.error('Get restaurant tables error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 }
    )
  }
}

// POST /api/industries/restaurant/tables - Create a new table
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createTableSchema.parse(body)

    // Check if table number already exists for this tenant
    const existing = await prisma.restaurantTable.findUnique({
      where: {
        tenantId_tableNumber: {
          tenantId: user.tenantId,
          tableNumber: validated.tableNumber,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Table ${validated.tableNumber} already exists` },
        { status: 400 }
      )
    }

    const table = await prisma.restaurantTable.create({
      data: {
        tenantId: user.tenantId,
        tableNumber: validated.tableNumber,
        name: validated.name,
        capacity: validated.capacity,
        location: validated.location,
        notes: validated.notes,
        status: 'AVAILABLE',
      },
      include: {
        _count: {
          select: {
            orders: true,
            reservations: true,
          },
        },
      },
    })

    return NextResponse.json({ table }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Create restaurant table error:', error)
    return NextResponse.json(
      { error: 'Failed to create table' },
      { status: 500 }
    )
  }
}

