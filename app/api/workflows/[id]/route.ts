import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import type { WorkflowStep } from '@/lib/workflow/types'

/** GET /api/workflows/[id] */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params

    const workflow = await prisma.workflow.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { executions: true } } },
    })
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    return NextResponse.json({
      workflow: {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        triggerType: workflow.triggerType,
        triggerEvent: workflow.triggerEvent,
        triggerSchedule: workflow.triggerSchedule,
        isActive: workflow.isActive,
        steps: (workflow.steps as unknown as WorkflowStep[]) || [],
        executionsCount: workflow._count.executions,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
      },
    })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    console.error('[API] workflows/[id] GET', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to get workflow' },
      { status: 500 }
    )
  }
}

/** PUT /api/workflows/[id] */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.workflow.findFirst({
      where: { id, tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    const update: Record<string, unknown> = {}
    if (body.name !== undefined) update.name = String(body.name).trim()
    if (body.description !== undefined) update.description = body.description ? String(body.description).trim() : null
    if (body.triggerType !== undefined) update.triggerType = String(body.triggerType)
    if (body.triggerEvent !== undefined) update.triggerEvent = body.triggerEvent ? String(body.triggerEvent) : null
    if (body.triggerSchedule !== undefined) update.triggerSchedule = body.triggerSchedule ? String(body.triggerSchedule) : null
    if (body.isActive !== undefined) update.isActive = Boolean(body.isActive)
    if (body.steps !== undefined) update.steps = Array.isArray(body.steps) ? body.steps : existing.steps

    const workflow = await prisma.workflow.update({
      where: { id },
      data: update as any,
    })

    return NextResponse.json({ workflow })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    console.error('[API] workflows/[id] PUT', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to update workflow' },
      { status: 500 }
    )
  }
}

/** DELETE /api/workflows/[id] */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params

    const existing = await prisma.workflow.findFirst({
      where: { id, tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    await prisma.workflow.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    console.error('[API] workflows/[id] DELETE', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to delete workflow' },
      { status: 500 }
    )
  }
}
