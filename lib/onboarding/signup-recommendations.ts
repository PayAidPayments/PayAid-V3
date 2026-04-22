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

/** Backbone modules (non–industry-specific) shown first for every industry. */
const SIGNUP_BACKBONE: readonly string[] = [
  'crm',
  'finance',
  'projects',
  'analytics',
  'workflow',
]

/**
 * Industry-specific overlays (module ids must exist in modules.config as active, non-industry).
 * Ordered by importance; merged after backbone up to maxPick.
 */
const INDUSTRY_OVERLAYS: Record<string, readonly string[]> = {
  restaurant: ['inventory', 'appointments', 'communication', 'marketing', 'sales'],
  retail: ['inventory', 'sales', 'marketing', 'communication'],
  manufacturing: ['inventory', 'contracts', 'communication', 'hr'],
  healthcare: ['appointments', 'hr', 'communication', 'compliance'],
  education: ['lms', 'appointments', 'communication', 'marketing'],
  'real-estate': ['contracts', 'communication', 'sales', 'marketing'],
  freelancer: ['sales', 'productivity', 'communication', 'marketing'],
  'service-business': ['appointments', 'communication', 'marketing', 'sales'],
  ecommerce: ['inventory', 'sales', 'marketing', 'communication'],
  'professional-services': ['contracts', 'productivity', 'communication', 'compliance'],
  logistics: ['inventory', 'communication', 'projects', 'contracts'],
  agriculture: ['inventory', 'communication', 'marketing', 'sales'],
  construction: ['inventory', 'contracts', 'communication', 'hr'],
  beauty: ['appointments', 'marketing', 'communication', 'sales'],
  automotive: ['inventory', 'appointments', 'communication', 'sales'],
  hospitality: ['appointments', 'hr', 'communication', 'marketing'],
  legal: ['contracts', 'productivity', 'compliance', 'communication'],
  'financial-services': ['compliance', 'contracts', 'communication', 'projects'],
  events: ['appointments', 'marketing', 'communication', 'projects'],
  wholesale: ['inventory', 'sales', 'communication', 'contracts'],
  others: ['productivity', 'communication', 'contracts', 'marketing'],
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
