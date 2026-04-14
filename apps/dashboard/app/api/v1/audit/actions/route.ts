import { NextRequest, NextResponse } from 'next/server'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { listActionAudit } from '@/lib/ai-native/m0-service'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'
import { redactPII } from '@/lib/privacy/redaction'
import { resolveCrmRequestTenantId } from '@/lib/crm/resolve-crm-request-tenant'

export async function GET(request: NextRequest) {
  try {
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveCrmRequestTenantId(request, jwtTenantId, userId)
    const searchParams = request.nextUrl.searchParams
    const entityType = searchParams.get('entityType') || undefined
    const entityId = searchParams.get('entityId') || undefined
    const isScopedRecordAudit = Boolean(entityType && entityId)

    // Record pages (contact/deal detail) only need CRM module access — same bar as viewing the record.
    // Unscoped / governance-style listing still requires M0 feature + explicit audit permission.
    if (!isScopedRecordAudit) {
      await assertTenantFeatureEnabled(tenantId, 'm0_ai_native_core')
      await assertAnyPermission(request, ['crm:audit:read', 'crm:admin'])
    }

    const limit = Math.min(Number(searchParams.get('limit') || 100), 500)

    const rows = await listActionAudit({
      tenantId,
      entityType,
      entityId,
      limit,
    })

    return NextResponse.json({
      actions: rows.map((row) => ({
        id: row.id,
        entity_type: row.entityType,
        entity_id: row.entityId,
        changed_by: row.changedBy,
        summary: row.changeSummary,
        before: redactPII(row.beforeSnapshot),
        after: redactPII(row.afterSnapshot),
        timestamp: row.timestamp,
      })),
      count: rows.length,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: error.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    if (error instanceof PermissionDeniedError) {
      return NextResponse.json({ error: error.message, code: 'PERMISSION_DENIED' }, { status: 403 })
    }
    const message = error instanceof Error ? error.message : 'Failed to fetch audit actions'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
