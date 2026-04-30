export interface TenantRouteKeySource {
  id?: string | null
  slug?: string | null
}

/**
 * Returns canonical route key for tenant URLs.
 * Prefer slug for human-readable URLs; fallback to id for compatibility.
 */
export function getTenantRouteKey(tenant?: TenantRouteKeySource | null): string | null {
  if (!tenant) return null

  const slug = typeof tenant.slug === 'string' ? tenant.slug.trim() : ''
  if (slug) return slug

  const id = typeof tenant.id === 'string' ? tenant.id.trim() : ''
  return id || null
}
