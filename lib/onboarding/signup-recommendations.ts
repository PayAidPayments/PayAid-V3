/**
 * Signup / trial onboarding: module defaults and plan tier hints.
 * Industry suggests a small core bundle + overlay; team size suggests Starter vs Professional.
 *
 * Future: replace fixed overlays with a weighted score (+industry fit, +size/complexity, −rare)
 * and pick defaults from score thresholds (e.g. ≥4 pre-check, 2–3 “popular”).
 */

export type TeamSizeBracket = '1-5' | '6-plus'

export function tierFromTeamSizeBracket(bracket: TeamSizeBracket): 'starter' | 'professional' {
  return bracket === '1-5' ? 'starter' : 'professional'
}

/** Backbone modules (non-industry-specific) shown first for every industry. */
const SIGNUP_BACKBONE: readonly string[] = [
  'crm',
  'finance',
  'inventory',
  'projects',
  'analytics',
  'sales',
]

/**
 * Industry-specific overlays (module ids must exist in modules.config as active, non-industry).
 * Ordered by importance; merged after backbone up to maxPick.
 */
const INDUSTRY_OVERLAYS: Record<string, readonly string[]> = {
  restaurant: ['marketing', 'hr', 'communication'],
  retail: ['marketing', 'communication', 'hr'],
  manufacturing: ['hr', 'communication'],
  healthcare: ['hr', 'communication', 'marketing'],
  education: ['hr', 'marketing', 'communication'],
  'real-estate': ['marketing', 'communication'],
  freelancer: ['marketing', 'communication'],
  'service-business': ['marketing', 'communication', 'hr'],
  ecommerce: ['marketing', 'communication'],
  'professional-services': ['marketing', 'communication', 'hr'],
  logistics: ['communication', 'hr'],
  agriculture: ['marketing', 'communication'],
  construction: ['hr', 'communication'],
  beauty: ['marketing', 'communication'],
  automotive: ['communication', 'marketing'],
  hospitality: ['hr', 'marketing', 'communication'],
  legal: ['communication', 'marketing'],
  'financial-services': ['communication', 'marketing'],
  events: ['marketing', 'communication', 'hr'],
  wholesale: ['communication', 'marketing'],
  others: ['marketing', 'communication', 'hr'],
}

const DEFAULT_OVERLAY = INDUSTRY_OVERLAYS.others

/**
 * Returns 5–8 recommended module ids (excluding ai-studio). Caller should always add ai-studio for trial UX.
 */
export function getSignupDefaultModuleIds(
  industryId: string,
  allowedModuleIds: ReadonlySet<string>,
  options?: { maxPick?: number }
): string[] {
  const maxPick = options?.maxPick ?? 7
  const overlay = INDUSTRY_OVERLAYS[industryId] ?? DEFAULT_OVERLAY

  const pick: string[] = []
  const pushIf = (id: string) => {
    if (pick.length >= maxPick) return
    if (!allowedModuleIds.has(id) || pick.includes(id)) return
    pick.push(id)
  }

  for (const id of SIGNUP_BACKBONE) pushIf(id)
  for (const id of overlay) pushIf(id)

  return pick
}
