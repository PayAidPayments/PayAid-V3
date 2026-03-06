/**
 * Generate a URL-safe, human-readable tenant slug for PayAid V3.
 * Format: {slugified-business-name}-{4-random-digits}
 *
 * Use for public URLs; keep UUID (id) for internal DB/RLS.
 * See docs/TENANT_SLUG_DESIGN.md for schema and middleware.
 */

const STRIP_SUFFIXES = [
  'pvt',
  'ltd',
  'llp',
  'inc',
  'co',
  'corp',
  'private',
  'limited',
  'solutions',
  'services',
]

/**
 * Generate a unique-ish slug from a business name.
 * Max 3 meaningful words + 4 random digits.
 */
export function generateTenantSlug(businessName: string): string {
  const words = businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STRIP_SUFFIXES.includes(w))
    .slice(0, 3)

  const base = words.length ? words.join('-') : 'workspace'
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${base}-${suffix}`
}

/**
 * Check if a string looks like a valid slug (lowercase, digits at end).
 */
export function isValidSlugFormat(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*-\d{4}$/.test(slug)
}

const MAX_SLUG_ATTEMPTS = 5

/**
 * Generate a slug that is not in the given set of existing slugs.
 * Retries with new random suffix on collision.
 */
export function generateUniqueTenantSlug(
  businessName: string,
  existingSlugs: Set<string>
): string {
  for (let i = 0; i < MAX_SLUG_ATTEMPTS; i++) {
    const slug = generateTenantSlug(businessName)
    if (!existingSlugs.has(slug)) return slug
  }
  // Fallback: append extra random digits
  const base = generateTenantSlug(businessName).replace(/\d{4}$/, '')
  return `${base}${Math.floor(1000 + Math.random() * 9000)}`
}
