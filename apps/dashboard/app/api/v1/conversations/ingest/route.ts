import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { conversationIngestSchema } from '@/lib/ai-native/m1-conversations'
import { hasConversationIngestBeenRecorded, recordConversationIngest } from '@/lib/ai-native/m1-conversation-service'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'

/**
 * POST /api/v1/conversations/ingest — Unibox / omnichannel message ingestion (M1).
 * CRM-scoped: ties conversation threads to tenant customer data.
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm1_unibox_ingest')

    const body = await request.json()
    const event = conversationIngestSchema.parse(body)

    if (event.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'tenant_id does not match authenticated tenant' }, { status: 403 })
    }

    const idempotencyHeader = request.headers.get('x-idempotency-key')?.trim()
    const idempotencyKey = idempotencyHeader || ''
    if (!idempotencyKey) {
      return NextResponse.json({ error: 'Missing x-idempotency-key header' }, { status: 400 })
    }

    const existing = await hasConversationIngestBeenRecorded(tenantId, idempotencyKey)
    if (existing) {
      return NextResponse.json({
        accepted: true,
        deduplicated: true,
        idempotency_key: idempotencyKey,
        ingested_at: existing.timestamp.toISOString(),
      })
    }

    const audit = await recordConversationIngest(tenantId, userId, idempotencyKey, event)

    return NextResponse.json(
      {
        accepted: true,
        deduplicated: false,
        idempotency_key: idempotencyKey,
        ingested_at: audit.timestamp.toISOString(),
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
    const message = error instanceof Error ? error.message : 'Failed to ingest conversation'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
