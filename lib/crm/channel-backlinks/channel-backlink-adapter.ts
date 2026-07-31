/**
 * P1-D4: Channel backlink adapter.
 *
 * Normalises outcomes from any channel (voice, WhatsApp/SMS, email reply,
 * marketing engagement, support ticket) into a `processInboundLead` call so
 * that every inbound signal — regardless of origin — flows through the same
 * capture → enrich → qualify → assign → SLA pipeline.
 *
 * Design rules:
 * - Always uses `dedupePolicy: 'merge_existing'` + `mergeExistingFields: 'fill_empty_only'`
 *   so repeat-channel touches never clobber existing rep assignments or data.
 * - Soft-fail by default: returns `{ ok: false }` rather than throwing, so callers
 *   (voice post-call, webhook handlers) are not disrupted.
 * - skipPilotLoopArtifacts: true for purely "touch" signals that don't need a new SLA stamp.
 * - skipLeadRouting: true when a rep is already assigned from the channel context.
 */

import {
  processInboundLead,
  INBOUND_ORCHESTRATION_SYSTEM_USER_ID,
} from '@/lib/crm/inbound-orchestration'
import type { ProcessInboundLeadResult } from '@/lib/crm/inbound-orchestration/types'
import { createHash } from 'crypto'

/**
 * Stable fingerprint for channel signals (dedupe / replay safety).
 * Prefer channelRef when present; otherwise hash identity + channel.
 */
export function channelSignalFingerprint(input: {
  channel: string
  channelRef?: string | null
  phone?: string | null
  email?: string | null
  name?: string | null
}): string {
  if (input.channelRef?.trim()) {
    return `${input.channel}:${input.channelRef.trim()}`
  }
  const identity = [input.phone, input.email, input.name]
    .map((v) => (v || '').trim().toLowerCase())
    .filter(Boolean)
    .join('|')
  const digest = createHash('sha256').update(`${input.channel}|${identity}`).digest('hex').slice(0, 24)
  return `${input.channel}:fp:${digest}`
}

export type ChannelType =
  | 'voice_call'
  | 'whatsapp_inbound'
  | 'sms_inbound'
  | 'email_reply'
  | 'marketing_engagement'
  | 'support_ticket'
  | 'chatbot'

export type ChannelBacklinkInput = {
  tenantId: string
  /** The channel that produced this outcome */
  channel: ChannelType
  /** Contact identification — at least one required */
  phone?: string | null
  email?: string | null
  name?: string | null
  /** External reference — e.g. callSid, messageId, ticketId */
  channelRef?: string
  /** Campaign / broadcast ID if applicable */
  campaignId?: string
  /** Rep/agent already assigned from the channel side — skip routing when set */
  assignedToId?: string | null
  /** Extra context stored in sourceData.rawMetadata */
  metadata?: Record<string, unknown>
  /** Touch lastContactedAt (default true for channel backlinks) */
  touchLastContactedAt?: boolean
  /**
   * When true, skips SLA deadline stamping (use for repeat touches on already-assigned leads).
   * Default: false — new assignment may trigger SLA stamp.
   */
  skipPilotArtifacts?: boolean
}

export type ChannelBacklinkResult =
  | { ok: true; contactId: string; created: boolean; dedupeAction: string }
  | { ok: false; reason: string; error?: unknown }

/**
 * Single entry point for all channel outcome → CRM backlinks.
 * Returns a simplified result; never throws.
 */
export async function channelOutcomeToInbound(
  input: ChannelBacklinkInput
): Promise<ChannelBacklinkResult> {
  const { tenantId, channel, phone, email, name, assignedToId, metadata, campaignId, channelRef } =
    input

  if (!phone && !email && !name) {
    return { ok: false, reason: 'no_identity: phone/email/name all absent' }
  }

  try {
    const fingerprint = channelSignalFingerprint({
      channel,
      channelRef,
      phone,
      email,
      name,
    })

    const result: ProcessInboundLeadResult = await processInboundLead({
      tenantId,
      actorUserId: INBOUND_ORCHESTRATION_SYSTEM_USER_ID,
      dedupePolicy: 'merge_existing',
      mergeExistingFields: 'fill_empty_only',
      skipLeadRouting: Boolean(assignedToId),
      skipExecutionLogWrite: false,
      skipPilotLoopArtifacts: input.skipPilotArtifacts ?? false,
      touchLastContactedAt: input.touchLastContactedAt ?? true,
      source: {
        sourceChannel: channel,
        sourceCampaign: campaignId,
        sourceRef: channelRef ?? fingerprint,
        capturedBy: INBOUND_ORCHESTRATION_SYSTEM_USER_ID,
        rawMetadata: {
          channel,
          channelRef,
          campaignId,
          channelSignalFingerprint: fingerprint,
          ...metadata,
        },
      },
      legacySourceLabel: channel,
      contact: {
        name: name ?? 'Unknown',
        phone: phone ?? null,
        email: email ?? null,
        type: 'lead',
        stage: 'prospect',
        status: 'active',
        assignedToId: assignedToId ?? null,
      },
    })

    if (!result.ok && result.error?.code === 'CONTACT_LIMIT') {
      return { ok: false, reason: 'contact_limit', error: result.error }
    }

    return {
      ok: true,
      contactId: result.contact.id,
      created: result.created,
      dedupeAction: result.dedupeAction,
    }
  } catch (err) {
    console.error('[channel-backlink-adapter] channelOutcomeToInbound failed', { channel, tenantId }, err)
    return { ok: false, reason: 'exception', error: err }
  }
}
