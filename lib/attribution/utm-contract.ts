import { z } from 'zod'

/** P1-D1: canonical UTM + page attribution capture contract. */
export const UTM_ATTRIBUTION_SCHEMA_VERSION = 1 as const

export const UtmAttributionSchema = z.object({
  schemaVersion: z.literal(UTM_ATTRIBUTION_SCHEMA_VERSION).default(UTM_ATTRIBUTION_SCHEMA_VERSION),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
  referrer: z.string().optional(),
  landingPageUrl: z.string().optional(),
  capturedAt: z.string().datetime().optional(),
})

export type UtmAttribution = z.infer<typeof UtmAttributionSchema>

/** Stored on Contact — first touch is immutable after set. */
export const TouchAttributionSchema = UtmAttributionSchema.extend({
  touchType: z.enum(['first', 'last']),
  sourceChannel: z.string().optional(),
  sourceCampaign: z.string().optional(),
})

export type TouchAttribution = z.infer<typeof TouchAttributionSchema>

/** Alias keys accepted from sales-page / legacy payloads. */
export const UtmAttributionAliasesSchema = z.object({
  source: z.string().optional(),
  medium: z.string().optional(),
  campaign: z.string().optional(),
  content: z.string().optional(),
  term: z.string().optional(),
  referrer: z.string().optional(),
  landingPageUrl: z.string().optional(),
})

export function parseUtmAttribution(input: unknown): UtmAttribution | null {
  const direct = UtmAttributionSchema.safeParse(input)
  if (direct.success) return direct.data

  const alias = UtmAttributionAliasesSchema.safeParse(input)
  if (!alias.success) return null

  return UtmAttributionSchema.parse({
    utm_source: alias.data.source,
    utm_medium: alias.data.medium,
    utm_campaign: alias.data.campaign,
    utm_content: alias.data.content,
    utm_term: alias.data.term,
    referrer: alias.data.referrer,
    landingPageUrl: alias.data.landingPageUrl,
    capturedAt: new Date().toISOString(),
  })
}

export function hasUtmSignal(utm: UtmAttribution | null | undefined): boolean {
  if (!utm) return false
  return Boolean(
    utm.utm_source ||
      utm.utm_medium ||
      utm.utm_campaign ||
      utm.utm_content ||
      utm.utm_term ||
      utm.referrer ||
      utm.landingPageUrl
  )
}

/** Parse UTM params from a URL search string (browser or server). */
export function utmFromSearchParams(search: string): UtmAttribution {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  return UtmAttributionSchema.parse({
    utm_source: params.get('utm_source') ?? undefined,
    utm_medium: params.get('utm_medium') ?? undefined,
    utm_campaign: params.get('utm_campaign') ?? undefined,
    utm_content: params.get('utm_content') ?? undefined,
    utm_term: params.get('utm_term') ?? undefined,
    capturedAt: new Date().toISOString(),
  })
}

/** Client-safe: capture from window when available. */
export function captureUtmFromBrowser(): UtmAttribution {
  if (typeof window === 'undefined') {
    return UtmAttributionSchema.parse({ capturedAt: new Date().toISOString() })
  }
  const fromQuery = utmFromSearchParams(window.location.search)
  return UtmAttributionSchema.parse({
    ...fromQuery,
    referrer: document.referrer || undefined,
    landingPageUrl: window.location.href,
    capturedAt: new Date().toISOString(),
  })
}

export function deriveAttributionChannel(utm: UtmAttribution): string {
  if (utm.utm_medium) return utm.utm_medium
  if (utm.utm_source) return utm.utm_source
  if (utm.referrer) {
    try {
      return new URL(utm.referrer).hostname
    } catch {
      return 'referral'
    }
  }
  return 'direct'
}
