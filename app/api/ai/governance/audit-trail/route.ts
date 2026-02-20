import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

/** GET /api/ai/governance/audit-trail - Get AI audit trail logs */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'all'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: any = {
      tenantId,
    }

    if (startDate) {
      where.startedAt = { ...where.startedAt, gte: new Date(startDate) }
    }
    if (endDate) {
      where.startedAt = { ...where.startedAt, lte: new Date(endDate) }
    }

    // Get workflow executions (AI-driven workflows)
    const workflowExecutions = await prisma.workflowExecution.findMany({
      where: {
        ...where,
        workflow: {
          tenantId,
          name: { contains: 'AI', mode: 'insensitive' },
        },
      },
      include: {
        workflow: {
          select: {
            name: true,
            description: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 100,
    })

    // Transform to audit log format
    const logs = workflowExecutions.map((exec) => ({
      id: exec.id,
      type: 'workflow',
      action: exec.workflow?.name || 'Workflow Execution',
      metadata: {
        workflowId: exec.workflowId,
        status: exec.status,
        error: exec.error,
      },
      createdAt: exec.startedAt.toISOString(),
      userId: undefined, // WorkflowExecution doesn't have triggeredBy field
    }))

    // Filter by type if specified
    const filteredLogs = type === 'all' 
      ? logs 
      : logs.filter(log => log.type === type)

    return NextResponse.json({
      logs: filteredLogs,
      total: filteredLogs.length,
      filters: {
        type,
        startDate,
        endDate,
      },
    })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to get audit trail' },
      { status: 500 }
    )
  }
}
