import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { trackEvent, type AnalyticsEventName } from '@/lib/analytics/track'
import { z } from 'zod'

const bodySchema = z.object({
  event: z.string().min(1),
  entity_id: z.string().optional(),
  properties: z.record(z.unknown()).optional(),
})

/**
 * POST /api/v1/analytics/event
 *
 * Client-side product analytics ingestion.
 * Call from UI pages to track user interactions (page views, feature usage).
 * Events are stored via the trackEvent utility (currently → AuditLog;
 * can be routed to PostHog/Segment via PAYAID_ANALYTICS_PROVIDER env var).
 *
 * Body: { event: string, entity_id?: string, properties?: Record<string, unknown> }
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = bodySchema.parse(body)

    // Accept any event string; cast to the typed union for tracking
    trackEvent(validated.event as AnalyticsEventName, {
      tenantId,
      userId,
      entityId: validated.entity_id,
      properties: { ...validated.properties, source: 'client' },
    })

    return NextResponse.json({ accepted: true, event: validated.event }, { status: 202 })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    // Never surface internal errors on analytics path — always succeed
    return NextResponse.json({ accepted: true, event: 'unknown' }, { status: 202 })
  }
}
