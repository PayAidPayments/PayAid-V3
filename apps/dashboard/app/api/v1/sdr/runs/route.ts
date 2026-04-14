import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'

const VALID_STATUSES = new Set(['RUNNING', 'PAUSED', 'CANCELLED', 'COMPLETED'])

/**
 * GET /api/v1/sdr/runs
 * List SDR runs for the tenant. Optionally filtered by playbook_id and/or status.
 * Invalid status values are silently ignored (no status filter applied).
 *
 * Query params:
 *   playbook_id  — filter to a specific playbook/workflow ID
 *   status       — filter by execution status (RUNNING | PAUSED | CANCELLED | COMPLETED)
 *   limit        — default 20, max 100
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm2_sdr')

    const url = new URL(request.url)
    const playbookId = url.searchParams.get('playbook_id') ?? undefined
    const statusParam = url.searchParams.get('status')?.toUpperCase()
    const statusFilter = statusParam && VALID_STATUSES.has(statusParam) ? statusParam : undefined
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 100)

    const where = {
      tenantId,
      ...(playbookId ? { workflowId: playbookId } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    }

    const [runs, total] = await Promise.all([
      prisma.workflowExecution.findMany({
        where,
        include: {
          workflow: { select: { id: true, name: true, description: true } },
        },
        orderBy: { startedAt: 'desc' },
        take: limit,
      }),
      prisma.workflowExecution.count({ where }),
    ])

    return NextResponse.json({
      runs: runs.map((r) => {
        const td = (r.triggerData as Record<string, unknown> | null) ?? {}
        const result = (r.result as Record<string, unknown> | null) ?? {}
        return {
          id: r.id,
          playbook_id: r.workflowId,
          playbook_name: r.workflow?.name,
          status: r.status.toLowerCase(),
          contact_count: (td.contact_ids as string[] | undefined)?.length ?? 0,
          guardrails: td.guardrails ?? {},
          started_at: r.startedAt,
          paused_at: (td.paused_at ?? result.paused_at) as string | undefined,
          stopped_at: (td.stopped_at ?? result.stopped_at) as string | undefined,
          stop_reason: (td.stop_reason ?? result.stop_reason) as string | undefined,
          completed_at: r.completedAt,
          schema_version: '1.0',
        }
      }),
      pagination: { total, limit },
    })
  } catch (error) {
    if (error instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: error.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    const err = handleLicenseError(error)
    if (err) return err
    console.error('List SDR runs error:', error)
    return NextResponse.json({ error: 'Failed to list SDR runs' }, { status: 500 })
  }
}
