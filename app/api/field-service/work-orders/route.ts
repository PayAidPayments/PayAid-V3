import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createWorkOrderSchema = z.object({
  workOrderNumber: z.string().optional(),
  contactId: z.string().optional(),
  serviceType: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  scheduledDate: z.string().datetime(),
  scheduledTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  estimatedDuration: z.number().int().positive().optional(),
  technicianId: z.string().optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  customerNotes: z.string().optional(),
})

// GET /api/field-service/work-orders - List work orders
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const technicianId = searchParams.get('technicianId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = { tenantId }
    if (status) where.status = status
    if (technicianId) where.technicianId = technicianId
    if (startDate || endDate) {
      where.scheduledDate = {}
      if (startDate) where.scheduledDate.gte = new Date(startDate)
      if (endDate) where.scheduledDate.lte = new Date(endDate)
    }

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            serviceHistoryRecords: true,
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    })

    return NextResponse.json({ workOrders })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get work orders error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work orders' },
      { status: 500 }
    )
  }
}

// POST /api/field-service/work-orders - Create work order
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = createWorkOrderSchema.parse(body)

    // Generate work order number if not provided
    let workOrderNumber = validated.workOrderNumber
    if (!workOrderNumber) {
      const count = await prisma.workOrder.count({ where: { tenantId } })
      workOrderNumber = `WO-${tenantId.substring(0, 8).toUpperCase()}-${String(count + 1).padStart(6, '0')}`
    }

    // Check uniqueness
    const existing = await prisma.workOrder.findUnique({
      where: {
        tenantId_workOrderNumber: {
          tenantId,
          workOrderNumber,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Work order number already exists' },
        { status: 400 }
      )
    }

    const workOrder = await prisma.workOrder.create({
      data: {
        tenantId,
        workOrderNumber,
        contactId: validated.contactId,
        serviceType: validated.serviceType,
        priority: validated.priority,
        scheduledDate: new Date(validated.scheduledDate),
        scheduledTime: validated.scheduledTime,
        estimatedDuration: validated.estimatedDuration,
        technicianId: validated.technicianId,
        location: validated.location,
        latitude: validated.latitude ? new Decimal(validated.latitude) : null,
        longitude: validated.longitude ? new Decimal(validated.longitude) : null,
        customerNotes: validated.customerNotes,
        createdById: userId,
      },
      include: {
        contact: true,
        technician: true,
      },
    })

    return NextResponse.json({ workOrder }, { status: 201 })
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

    console.error('Create work order error:', error)
    return NextResponse.json(
      { error: 'Failed to create work order' },
      { status: 500 }
    )
  }
}

