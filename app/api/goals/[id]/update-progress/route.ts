/**
 * Update Goal Progress API Route
 * POST /api/goals/[id]/update-progress - Update goal progress
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const updateProgressSchema = z.object({
  value: z.number().min(0),
  source: z.string().optional(), // What triggered this update
  sourceId: z.string().optional(), // ID of source entity
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const validated = updateProgressSchema.parse(body)

    const goal = await prisma.goal.findFirst({
      where: { id: params.id, tenantId },
    })

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    const previousValue = goal.currentValue
    const newValue = validated.value
    const change = newValue - previousValue
    const progress = Math.min(100, (newValue / goal.targetValue) * 100)

    // Update goal
    const updated = await prisma.goal.update({
      where: { id: params.id },
      data: {
        currentValue: newValue,
        progress,
        status: progress >= 100 ? 'completed' : goal.status,
        completedAt: progress >= 100 && !goal.completedAt ? new Date() : goal.completedAt,
      },
    })

    // Record progress history
    await prisma.goalProgress.create({
      data: {
        goalId: params.id,
        tenantId,
        value: newValue,
        previousValue,
        change,
        percentage: progress,
        source: validated.source,
        sourceId: validated.sourceId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Goal progress updated',
      data: updated,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update progress', message: error.message }, { status: 500 })
  }
}
