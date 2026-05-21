export function isProjectsAdminLike(roles: string[]): boolean {
  const r = roles.map((x) => String(x).toLowerCase())
  return r.some((x) => ['owner', 'admin', 'super_admin', 'business_admin'].includes(x))
}

export function canApproveMilestoneBilling(
  userId: string,
  roles: string[],
  projectOwnerId: string | null,
  isProjectManager: boolean,
): boolean {
  if (isProjectsAdminLike(roles)) return true
  if (projectOwnerId && projectOwnerId === userId) return true
  if (isProjectManager) return true
  return false
}
