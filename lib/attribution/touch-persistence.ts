import type { InboundSourceAttribution } from '@/lib/crm/inbound-orchestration/types'

import {
  deriveAttributionChannel,
  hasUtmSignal,
  type TouchAttribution,
  type UtmAttribution,
  UtmAttributionSchema,
} from './utm-contract'

export function utmToInboundSource(
  utm: UtmAttribution,
  overrides?: Partial<InboundSourceAttribution>
): InboundSourceAttribution {
  const channel = overrides?.sourceChannel ?? deriveAttributionChannel(utm)
  return {
    sourceChannel: channel,
    sourceSubchannel: overrides?.sourceSubchannel ?? utm.utm_source,
    sourceCampaign: overrides?.sourceCampaign ?? utm.utm_campaign,
    sourceAsset: overrides?.sourceAsset,
    sourceRef: overrides?.sourceRef,
    capturedAt: utm.capturedAt ?? new Date().toISOString(),
    capturedBy: overrides?.capturedBy,
    rawMetadata: {
      ...(overrides?.rawMetadata ?? {}),
      utm: UtmAttributionSchema.parse(utm),
      referrer: utm.referrer,
      landingPageUrl: utm.landingPageUrl,
    },
  }
}

export function touchFromUtm(utm: UtmAttribution, touchType: 'first' | 'last'): TouchAttribution {
  return {
    ...UtmAttributionSchema.parse(utm),
    touchType,
    sourceChannel: deriveAttributionChannel(utm),
    sourceCampaign: utm.utm_campaign,
  }
}

export type TouchPersistenceResult = {
  firstTouchAttribution: TouchAttribution | null
  lastTouchAttribution: TouchAttribution
  sourceData: Record<string, unknown>
}

/**
 * Apply first/last-touch rules on Contact.sourceData + column payloads.
 * First touch is preserved once set; last touch always updates on new signal.
 */
export function applyFirstLastTouch(params: {
  utm: UtmAttribution | null | undefined
  previousSourceData?: unknown
  previousFirstTouch?: unknown
  normalizedSource: InboundSourceAttribution
  buildSourceData: (prev?: unknown) => Record<string, unknown>
}): TouchPersistenceResult {
  const sourceData = params.buildSourceData(params.previousSourceData)
  const existingFirst =
    params.previousFirstTouch != null
      ? (params.previousFirstTouch as TouchAttribution)
      : (sourceData.firstTouchAttribution as TouchAttribution | undefined) ?? null

  const hasSignal = hasUtmSignal(params.utm)
  const lastTouch = hasSignal
    ? touchFromUtm(params.utm!, 'last')
    : touchFromUtm(
        {
          utm_source: params.normalizedSource.sourceSubchannel,
          utm_medium: params.normalizedSource.sourceChannel,
          utm_campaign: params.normalizedSource.sourceCampaign,
          capturedAt: params.normalizedSource.capturedAt,
        },
        'last'
      )

  const firstTouch =
    existingFirst ??
    (hasSignal ? touchFromUtm(params.utm!, 'first') : touchFromUtm(lastTouch, 'first'))

  return {
    firstTouchAttribution: firstTouch,
    lastTouchAttribution: lastTouch,
    sourceData: {
      ...sourceData,
      firstTouchAttribution: firstTouch,
      lastTouchAttribution: lastTouch,
    },
  }
}
