import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { conversationIngestSchema } from '@/lib/ai-native/m1-conversations'
import { hasConversationIngestBeenRecorded, recordConversationIngest } from '@/lib/ai-native/m1-conversation-service'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import {
  verifyWebhookSignature,
  parseWebhookTimestamp,
  DEFAULT_REPLAY_WINDOW_MS,
} from '@/lib/ai-native/m1-connector-signature'

/** Read the webhook secret at request time so env overrides work in tests. */
function getWebhookSecret(): string {
  return process.env.PAYAID_WEBHOOK_SECRET ?? ''
}

/**
 * POST /api/v1/conversations/webhook
 *
 * Provider-facing connector webhook — receives conversation events from external
 * channel adapters (email, WhatsApp, telephony, etc.).
 *
 * Security layers:
 * 1. HMAC-SHA256 signature verification (X-Webhook-Signature + X-Webhook-Timestamp)
 * 2. Replay-window check (default 5 min, configurable via X-Webhook-Replay-Window-Ms)
 * 3. Idempotency via x-idempotency-key (deduplicates provider retries)
 * 4. Tenant-feature gate (m1_unibox_ingest)
 * 5. Module-access JWT gate (crm)
 */
export async function POST(request: NextRequest) {
  // ── 1. Read raw body for signature verification (before JSON parsing) ──
  const rawBody = await request.text()

  // ── 2. Signature verification ──────────────────────────────────────────
  const sigHeader = request.headers.get('x-webhook-signature')
  const tsHeader = request.headers.get('x-webhook-timestamp')
  const WEBHOOK_SECRET = getWebhookSecret()

  if (WEBHOOK_SECRET) {
    if (!sigHeader || !tsHeader) {
      return NextResponse.json(
        { error: 'Missing webhook signature headers', code: 'MISSING_SIGNATURE' },
        { status: 401 }
      )
    }

    const timestamp = parseWebhookTimestamp(tsHeader)
    if (timestamp === null) {
      return NextResponse.json(
        { error: 'Invalid X-Webhook-Timestamp header', code: 'INVALID_TIMESTAMP' },
        { status: 401 }
      )
    }

    const replayWindowMs = Number(request.headers.get('x-webhook-replay-window-ms')) || DEFAULT_REPLAY_WINDOW_MS
    const sigResult = verifyWebhookSignature(WEBHOOK_SECRET, timestamp, rawBody, sigHeader, replayWindowMs)

    if (!sigResult.valid) {
      const statusCode = sigResult.reason === 'stale_timestamp' ? 401 : 403
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${sigResult.reason}`, code: 'SIGNATURE_INVALID' },
        { status: statusCode }
      )
    }
  }

  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm1_unibox_ingest')

    // ── 3. Parse body ──────────────────────────────────────────────────
    let body: unknown
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const event = conversationIngestSchema.parse(body)

    if (event.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'tenant_id does not match authenticated tenant' }, { status: 403 })
    }

    // ── 4. Idempotency / deduplication ────────────────────────────────
    const idempotencyKey =
      request.headers.get('x-idempotency-key')?.trim() ||
      request.headers.get('x-delivery-id')?.trim() ||
      ''

    if (!idempotencyKey) {
      return NextResponse.json({ error: 'Missing x-idempotency-key or x-delivery-id header' }, { status: 400 })
    }

    const existing = await hasConversationIngestBeenRecorded(tenantId, idempotencyKey)
    if (existing) {
      return NextResponse.json({
        accepted: true,
        deduplicated: true,
        idempotency_key: idempotencyKey,
        ingested_at: existing.timestamp.toISOString(),
        schema_version: '1.0',
      })
    }

    const audit = await recordConversationIngest(tenantId, userId, idempotencyKey, event)

    return NextResponse.json(
      {
        accepted: true,
        deduplicated: false,
        idempotency_key: idempotencyKey,
        ingested_at: audit.timestamp.toISOString(),
        schema_version: '1.0',
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
    const message = error instanceof Error ? error.message : 'Failed to process webhook'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
