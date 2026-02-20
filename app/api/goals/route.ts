/**
 * Goals API Route
 * GET /api/goals - List goals
 * POST /api/goals - Create goal
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createGoalSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['revenue', 'deals', 'contacts', 'tasks', 'custom']).default('revenue'),
  targetValue: z.number().min(0),
  unit: z.string().default('INR'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  assignedToId: z.string().optional(),
  teamId: z.string().optional(),
  milestones: z.array(z.object({
    name: z.string(),
    targetValue: z.number(),
    date: z.string().datetime(),
  })).optional(),
  trackingSource: z.object({
    entityType: z.enum(['deals', 'invoices', 'contacts', 'tasks']),
    filters: z.any().optional(), // Additional filters
  }).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const assignedToId = searchParams.get('assignedToId')

    const where: any = { tenantId }
    if (status) where.status = status
    if (type) where.type = type
    if (assignedToId) where.assignedToId = assignedToId

    const goals = await prisma.goal.findMany({
      where,
      include: {
        _count: {
          select: { progressHistory: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: goals })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to list goals', message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const validated = createGoalSchema.parse(body)

    const startDate = new Date(validated.startDate)
    const endDate = new Date(validated.endDate)

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    const goal = await prisma.goal.create({
      data: {
        tenantId,
        name: validated.name,
        description: validated.description,
        type: validated.type,
        targetValue: validated.targetValue,
        unit: validated.unit,
        startDate,
        endDate,
        assignedToId: validated.assignedToId,
        teamId: validated.teamId,
        milestones: validated.milestones || [],
        trackingSource: validated.trackingSource,
        currentValue: 0,
        progress: 0,
      },
    })

    return NextResponse.json({ success: true, data: goal })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create goal', message: error.message }, { status: 500 })
  }
}
