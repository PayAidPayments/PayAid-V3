/**
 * GET /api/agents/workflows/[id] — get one workflow
 * PATCH /api/agents/workflows/[id] — update workflow
 * DELETE /api/agents/workflows/[id] — delete workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(_request, 'crm')
    const { id } = await params
    const workflow = await prisma.agentWorkflow.findFirst({
      where: { id, tenantId },
      include: { runs: { orderBy: { startedAt: 'desc' }, take: 10 } },
    })
    if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(workflow)
  } catch (e) {
    console.error('Workflow get error:', e)
    return NextResponse.json({ error: 'Failed to get workflow' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params
    const body = await request.json()
    const workflow = await prisma.agentWorkflow.findFirst({ where: { id, tenantId } })
    if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const updated = await prisma.agentWorkflow.update({
      where: { id },
      data: {
        ...(body.name != null && { name: String(body.name).trim() }),
        ...(body.description !== undefined && { description: body.description ? String(body.description).trim() : null }),
        ...(body.trigger != null && { trigger: body.trigger as object }),
        ...(body.steps != null && { steps: body.steps as object }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
      },
    })
    return NextResponse.json(updated)
  } catch (e) {
    console.error('Workflow update error:', e)
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(_request, 'crm')
    const { id } = await params
    const workflow = await prisma.agentWorkflow.findFirst({ where: { id, tenantId } })
    if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.agentWorkflow.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Workflow delete error:', e)
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 })
  }
}
