/**
 * PayAid product analytics — lightweight server-side event emitter.
 *
 * Writes analytics events to AuditLog with entityType='analytics_event'.
 * No external service dependency — events are stored in the DB and can be
 * forwarded to a third-party analytics sink (Segment, PostHog, Mixpanel)
 * via an async background job in a future session.
 */
import { prisma } from '@/lib/db/prisma'

export type AnalyticsEventName =
  // M2 Call events
  | 'call_started'
  | 'call_ended'
  | 'call_logged'
  | 'call_transcript_ingested'
  // M2 CPQ events
  | 'quote_created'
  | 'quote_updated'
  | 'quote_approved'
  | 'quote_rejected'
  | 'quote_sent'
  | 'quote_approval_requested'
  | 'quote_converted_to_invoice'
  // M2 Marketplace events
  | 'marketplace_app_installed'
  | 'marketplace_app_configured'
  // M2 SDR events
  | 'sdr_playbook_created'
  | 'sdr_run_started'
  | 'sdr_run_paused'
  | 'sdr_run_stopped'
  // M1 Unibox events
  | 'conversation_ingested'
  | 'webhook_delivery_accepted'
  // M0 Workflow events
  | 'workflow_published'
  | 'workflow_test_run_triggered'
  | 'sequence_created'
  | 'sequence_paused'
  | 'sequence_enrollment_created'
  | 'sequence_reply_recorded'
  // KPI
  | 'kpi_scorecard_viewed'

export interface AnalyticsEventProps {
  tenantId: string
  userId?: string | null
  entityId?: string
  properties?: Record<string, unknown>
}

/**
 * Track a product analytics event.
 * Fire-and-forget: errors are silently swallowed so this never breaks the
 * primary request path.
 */
export function trackEvent(event: AnalyticsEventName, props: AnalyticsEventProps): void {
  prisma.auditLog.create({
    data: {
      tenantId: props.tenantId,
      entityType: 'analytics_event',
      entityId: props.entityId ?? event,
      changedBy: props.userId ?? 'system',
      changeSummary: event,
      afterSnapshot: {
        event,
        properties: props.properties ?? {},
        recorded_at: new Date().toISOString(),
      } as any,
    },
  }).catch(() => { /* non-fatal */ })
}
