/**
 * Goal Detail API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const goal = await prisma.goal.findFirst({
      where: { id: params.id, tenantId },
      include: {
        progressHistory: {
          orderBy: { recordedAt: 'desc' },
          take: 50,
        },
      },
    })

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: goal })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to get goal', message: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const updateData: any = {}

    if (body.name) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.targetValue) updateData.targetValue = body.targetValue
    if (body.status) updateData.status = body.status
    if (body.currentValue !== undefined) {
      updateData.currentValue = body.currentValue
      // Recalculate progress
      const goal = await prisma.goal.findFirst({ where: { id: params.id, tenantId } })
      if (goal) {
        updateData.progress = Math.min(100, (body.currentValue / goal.targetValue) * 100)
        if (updateData.progress >= 100 && body.status !== 'completed') {
          updateData.status = 'completed'
          updateData.completedAt = new Date()
        }
      }
    }

    const goal = await prisma.goal.update({
      where: { id: params.id, tenantId },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: goal })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update goal', message: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await prisma.goal.delete({ where: { id: params.id, tenantId } })
    return NextResponse.json({ success: true, message: 'Goal deleted' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete goal', message: error.message }, { status: 500 })
  }
}
