import { isProjectsTimeAdminRole } from '@/lib/api/projects/time-approval-permissions'

/**
 * Saving time without linking a **`task`** is treated as privileged (ad hoc lane).
 * Normal contributors must select a task; owner / PM / admin-like roles may omit it (§10.1).
 */
export function mayCreateTaskOptionalTimeEntry(input: {
  hasTaskId: boolean
  userId: string
  projectOwnerId: string | null
  roles: string[]
  isProjectManagerOnProject: boolean
}): boolean {
  if (input.hasTaskId) return true
  if (isProjectsTimeAdminRole(input.roles)) return true
  if (input.projectOwnerId && input.projectOwnerId === input.userId) return true
  if (input.isProjectManagerOnProject) return true
  return false
}
