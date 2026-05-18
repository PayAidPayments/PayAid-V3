/** Roles that may approve/mark invoiced Projects time entries without being entry author (§10.2). */
export function isProjectsTimeAdminRole(roles: string[]): boolean {
  const r = roles.map((x) => String(x).toLowerCase())
  return r.some((x) => ['owner', 'admin', 'super_admin', 'business_admin'].includes(x))
}

/**
 * Whether `actorId` may approve/reject invoicing updates for someone else's entry,
 * or (when admin-like) including their own.
 */
export function canApproveOrRejectProjectsTimeEntry(
  actorId: string,
  roles: string[],
  entryUserId: string,
  projectOwnerId: string | null,
  isProjectManager: boolean
): boolean {
  if (isProjectsTimeAdminRole(roles)) return true
  if (entryUserId === actorId) return false
  if (projectOwnerId && projectOwnerId === actorId) return true
  if (isProjectManager) return true
  return false
}
