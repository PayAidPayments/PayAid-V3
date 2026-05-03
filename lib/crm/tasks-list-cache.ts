import { multiLayerCache } from '@/lib/cache/multi-layer'

/** TTL seconds for CRM task list payloads (L2 default; L1 uses multi-layer rules). */
export const TASKS_LIST_CACHE_TTL_SEC = 180

/**
 * Cache key for GET /api/tasks and GET /api/crm/tasks when filters are cache-safe.
 * Omit search queries (same pattern as contacts list).
 */
export function buildTasksListCacheKey(
  tenantId: string,
  sp: URLSearchParams,
  page: number,
  limit: number,
  wantStats: boolean
): string | null {
  const search = sp.get('search')
  if (search?.trim()) return null

  const module = sp.get('module') || 'all'
  const priority = sp.get('priority') || 'all'
  const contactId = sp.get('contactId') || 'all'
  const assignedToId = sp.get('assignedToId') || 'all'
  const dueDateFrom = sp.get('dueDateFrom') || 'x'
  const dueDateTo = sp.get('dueDateTo') || 'x'
  const status = sp.get('status') || 'all'
  const stats = wantStats ? '1' : '0'

  return `tasks:${tenantId}:${page}:${limit}:${stats}:${module}:${priority}:${contactId}:${assignedToId}:${dueDateFrom}:${dueDateTo}:${status}`
}

export async function invalidateTasksListCache(tenantId: string): Promise<void> {
  await multiLayerCache.deletePattern(`tasks:${tenantId}:*`).catch(() => {})
}
