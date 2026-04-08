import { NextRequest, NextResponse } from 'next/server'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { assertAnyPermission, PermissionDeniedError } from '@/lib/middleware/permissions'
import { z } from 'zod'
import { getTenantUniboxSlaSettings, updateTenantUniboxSlaSettings } from '@/lib/ai-native/m1-conversation-service'

const bodySchema = z.object({
  first_response_sla_minutes: z.number().int().min(1).max(1440),
  enforce: z.boolean().default(true),
})

/** GET/PUT /api/v1/conversations/settings — tenant-level Unibox SLA defaults. */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm1_unibox_ingest')
    await assertAnyPermission(request, ['crm:admin', 'crm:audit:read'])
    const settings = await getTenantUniboxSlaSettings(tenantId)
    return NextResponse.json({ ok: true, settings })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) return handleLicenseError(error)
    if (error instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: error.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    if (error instanceof PermissionDeniedError) {
      return NextResponse.json({ error: error.message, code: 'PERMISSION_DENIED' }, { status: 403 })
    }
    const message = error instanceof Error ? error.message : 'Failed to load conversation settings'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm1_unibox_ingest')
    await assertAnyPermission(request, ['crm:admin'])
    const body = await request.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation error', details: parsed.error.flatten() }, { status: 400 })
    }
    const { first_response_sla_minutes, enforce = true } = parsed.data
    const settings = await updateTenantUniboxSlaSettings(tenantId, { first_response_sla_minutes, enforce })
    return NextResponse.json({ ok: true, settings })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) return handleLicenseError(error)
    if (error instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: error.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    if (error instanceof PermissionDeniedError) {
      return NextResponse.json({ error: error.message, code: 'PERMISSION_DENIED' }, { status: 403 })
    }
    const message = error instanceof Error ? error.message : 'Failed to update conversation settings'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

