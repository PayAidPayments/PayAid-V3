import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

/** GET /api/workflows/[id]/executions - List recent executions for a workflow */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id: workflowId } = await params
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)

    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, tenantId },
    })
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    const executions = await prisma.workflowExecution.findMany({
      where: { workflowId, tenantId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      executions: executions.map((e) => ({
        id: e.id,
        status: e.status,
        error: e.error,
        startedAt: e.startedAt,
        completedAt: e.completedAt,
        result: e.result,
      })),
    })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    console.error('[API] workflows/[id]/executions GET', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to list executions' },
      { status: 500 }
    )
  }
}
