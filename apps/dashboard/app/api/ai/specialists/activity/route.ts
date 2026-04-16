import { NextRequest, NextResponse } from 'next/server'
import { handleLicenseError, requireCanonicalAiGatewayAccess, requireModuleAccess } from '@/lib/middleware/auth'
import { listSpecialistAuditEvents } from '@/lib/ai/specialists/audit'

const RUNBOOK_PATH = 'docs/ai/specialist-activity-migration-runbook.md'

function getRecommendedCommands(fallbackReason: string | null, migrationReady: boolean): string[] {
  if (migrationReady) return []
  if (fallbackReason === 'specialist_activity_column_missing') {
    return ['npm run db:generate', 'npm run db:migrate', 'npm run db:generate']
  }
  if (fallbackReason === 'specialist_activity_table_missing') {
    return ['npm run db:migrate', 'npm run db:generate']
  }
  return ['npm run db:generate', 'npm run db:migrate', 'npm run db:migrate:deploy']
}

/** GET /api/ai/specialists/activity - Specialist activity feed for admins */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    const authPayload = await requireCanonicalAiGatewayAccess(request)
    const roles = authPayload.roles || []
    const permissions = authPayload.permissions || []

    const isAdmin = roles.some((role) => ['admin', 'owner', 'super_admin'].includes(role.toLowerCase()))
    const canReadAudit = permissions.includes('ai:audit:read')

    if (!isAdmin && !canReadAudit) {
      return NextResponse.json(
        { error: 'Insufficient permission to view specialist activity' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const specialistId = searchParams.get('specialistId') || undefined
    const moduleFilter = searchParams.get('module') || undefined
    const actionLevel = searchParams.get('actionLevel') || undefined
    const result = searchParams.get('result') || undefined
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = Math.min(Number(searchParams.get('limit') || 50), 200)

    const activityResult = await listSpecialistAuditEvents({
      tenantId,
      specialistId,
      module: moduleFilter,
      actionLevel,
      result,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
    })

    return NextResponse.json({
      activity: activityResult.rows.map((entry) => ({
        id: entry.id,
        timestamp: entry.timestamp,
        changedBy: entry.changedBy,
        event: entry.event,
      })),
      count: activityResult.rows.length,
      source: activityResult.source,
      migrationReady: activityResult.migrationReady,
      fallbackReason: activityResult.fallbackReason,
      runbookPath: RUNBOOK_PATH,
      recommendedCommands: getRecommendedCommands(activityResult.fallbackReason, activityResult.migrationReady),
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load specialist activity' },
      { status: 500 }
    )
  }
}

