/**
 * Map API-key scopes (and optional JWT roles) to synthetic roles for tool policy.
 * Phase C4 — replaces blanket `['manager']` for API-key execute paths.
 */

export function rolesFromApiKeyScopes(scopes?: string[] | null): string[] {
  if (!scopes?.length) return ['viewer']
  const lower = scopes.map((s) => s.toLowerCase().trim())

  if (lower.some((s) => s === '*' || s === 'admin' || s.startsWith('admin:') || s.includes(':admin'))) {
    return ['admin']
  }
  if (lower.some((s) => s.startsWith('write:') || s === 'write' || s.includes('write'))) {
    return ['manager']
  }
  if (lower.some((s) => s.startsWith('read:') || s === 'read' || s.includes('read'))) {
    return ['user']
  }
  return ['viewer']
}

/**
 * Prefer explicit JWT roles; otherwise derive from API-key scopes.
 */
export function resolveAuthRoles(input: {
  roles?: string[] | null
  scopes?: string[] | null
  authType?: 'jwt' | 'api_key'
}): string[] {
  const fromJwt = (input.roles || []).map((r) => r.trim()).filter(Boolean)
  if (fromJwt.length) return fromJwt
  if (input.authType === 'api_key' || (input.scopes && input.scopes.length)) {
    return rolesFromApiKeyScopes(input.scopes)
  }
  return ['viewer']
}
