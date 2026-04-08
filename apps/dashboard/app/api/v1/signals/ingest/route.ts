import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { signalEventSchema } from '@/lib/ai-native/m0-contracts'
import { hasSignalBeenIngested, persistSignalAudit } from '@/lib/ai-native/m0-service'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'

export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm0_ai_native_core')
    const body = await request.json()
    const signal = signalEventSchema.parse(body)

    if (signal.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'tenant_id does not match authenticated tenant' }, { status: 403 })
    }

    const idempotencyHeader = request.headers.get('x-idempotency-key')
    const idempotencyKey = (idempotencyHeader || signal.event_id || '').trim()

    if (!idempotencyKey) {
      return NextResponse.json({ error: 'Missing idempotency key or event_id' }, { status: 400 })
    }

    const existing = await hasSignalBeenIngested(tenantId, idempotencyKey)
    if (existing) {
      return NextResponse.json({
        accepted: true,
        deduplicated: true,
        idempotency_key: idempotencyKey,
        ingested_at: existing.timestamp,
      })
    }

    const audit = await persistSignalAudit(tenantId, userId, idempotencyKey, signal)

    return NextResponse.json(
      {
        accepted: true,
        deduplicated: false,
        idempotency_key: idempotencyKey,
        ingested_at: audit.timestamp,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    if (error instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: error.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }

    const message = error instanceof Error ? error.message : 'Failed to ingest signal'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
