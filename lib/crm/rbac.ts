export class CrmRoleError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'CrmRoleError'
  }
}

function normalizeRoles(roles: string[] | undefined): string[] {
  return (roles ?? []).map((r) => String(r).trim().toLowerCase()).filter(Boolean)
}

/**
 * Throws 403 when caller role is not in allowedRoles.
 * Use for high-risk CRM mutations (bulk, delete, settings writes).
 */
export function assertCrmRoleAllowed(
  roles: string[] | undefined,
  allowedRoles: string[],
  actionLabel: string
): void {
  const userRoles = normalizeRoles(roles)
  const allowed = normalizeRoles(allowedRoles)
  const ok = userRoles.some((r) => allowed.includes(r))
  if (!ok) {
    throw new CrmRoleError(
      'CRM_ROLE_FORBIDDEN',
      403,
      `Insufficient role for ${actionLabel}. Required role: ${allowed.join(' or ')}.`
    )
  }
}
