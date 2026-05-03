/**
 * GET /api/agents/workflows — list workflows for tenant
 * POST /api/agents/workflows — create workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const list = await prisma.agentWorkflow.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { runs: true } } },
    })
    return NextResponse.json(list)
  } catch (e) {
    console.error('Workflows list error:', e)
    return NextResponse.json({ error: 'Failed to list workflows' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const { name, description, trigger, steps } = body as {
      name: string
      description?: string
      trigger?: { type: string; config?: Record<string, unknown> }
      steps?: Array<{ id: string; type: string; config?: Record<string, unknown> }>
    }
    if (!name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    const workflow = await prisma.agentWorkflow.create({
      data: {
        tenantId,
        name: name.trim(),
        description: description?.trim() || null,
        trigger: (trigger ?? { type: 'manual', config: {} }) as object,
        steps: (steps ?? []) as object,
        isActive: true,
      },
    })
    return NextResponse.json(workflow)
  } catch (e) {
    console.error('Workflow create error:', e)
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 })
  }
}
