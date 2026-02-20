import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import type { WorkflowStep } from '@/lib/workflow/types'

/** GET /api/workflows - List workflows for tenant */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('active') === 'true'

    const workflows = await prisma.workflow.findMany({
      where: {
        tenantId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { executions: true } },
      },
    })

    const list = workflows.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      triggerType: w.triggerType,
      triggerEvent: w.triggerEvent,
      triggerSchedule: w.triggerSchedule,
      isActive: w.isActive,
      stepsCount: Array.isArray(w.steps) ? (w.steps as unknown as WorkflowStep[]).length : 0,
      executionsCount: w._count.executions,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    }))

    return NextResponse.json({ workflows: list })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    console.error('[API] workflows GET', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to list workflows' },
      { status: 500 }
    )
  }
}

/** POST /api/workflows - Create workflow */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const {
      name,
      description,
      triggerType,
      triggerEvent,
      triggerSchedule,
      isActive = true,
      steps = [],
    } = body

    if (!name || !triggerType) {
      return NextResponse.json(
        { error: 'name and triggerType are required' },
        { status: 400 }
      )
    }

    const workflow = await prisma.workflow.create({
      data: {
        tenantId,
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        triggerType: String(triggerType),
        triggerEvent: triggerEvent ? String(triggerEvent) : null,
        triggerSchedule: triggerSchedule ? String(triggerSchedule) : null,
        isActive: Boolean(isActive),
        steps: Array.isArray(steps) ? steps : [],
      },
    })

    return NextResponse.json({ workflow })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    console.error('[API] workflows POST', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to create workflow' },
      { status: 500 }
    )
  }
}
