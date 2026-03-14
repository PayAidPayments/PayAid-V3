/**
 * Cache Invalidation Strategy for PayAid V3
 * Implements tag-based cache invalidation for efficient cache management
 * Phase 1: Uses single Redis singleton (Upstash or no-op).
 */

// Cache tags for different entity types
export enum CacheTag {
  // Core entities
  TENANT = 'tenant',
  USER = 'user',
  CONTACT = 'contact',
  DEAL = 'deal',
  TASK = 'task',
  INVOICE = 'invoice',
  ORDER = 'order',
  
  // Aggregations
  DASHBOARD = 'dashboard',
  METRICS = 'metrics',
  STATS = 'stats',
  
  // Lists
  CONTACT_LIST = 'contact:list',
  DEAL_LIST = 'deal:list',
  INVOICE_LIST = 'invoice:list',
  
  // Search
  SEARCH = 'search',
}

/**
 * Cache key patterns
 */
export const CacheKey = {
  // Entity by ID
  entity: (tag: CacheTag, id: string, tenantId?: string) => 
    tenantId ? `${tag}:${tenantId}:${id}` : `${tag}:${id}`,
  
  // List
  list: (tag: CacheTag, tenantId: string, filters?: string) =>
    filters ? `${tag}:list:${tenantId}:${filters}` : `${tag}:list:${tenantId}`,
  
  // Dashboard
  dashboard: (tenantId: string, userId?: string) =>
    userId ? `dashboard:${tenantId}:${userId}` : `dashboard:${tenantId}`,
  
  // Metrics
  metrics: (tenantId: string, type: string) => `metrics:${tenantId}:${type}`,
  
  // Search
  search: (tenantId: string, query: string, type: string) =>
    `search:${tenantId}:${type}:${query}`,
}

import { getRedisSingleton } from '@/lib/redis/singleton'

function getRedis() {
  return getRedisSingleton()
}

/**
 * Invalidate cache by tag
 * When an entity is updated, invalidate all related caches
 */
export async function invalidateByTag(
  tag: CacheTag,
  tenantId?: string,
  entityId?: string
): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  try {
    const pattern = tenantId
      ? entityId
        ? `${tag}:${tenantId}:${entityId}*`
        : `${tag}:${tenantId}:*`
      : `${tag}:*`

    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
      console.log(`Invalidated ${keys.length} cache keys for tag: ${tag}`)
    }

    if (tenantId) {
      await invalidateRelatedCaches(tag, tenantId)
    }
  } catch (error) {
    console.error(`Failed to invalidate cache for tag ${tag}:`, error)
  }
}

/**
 * Invalidate related caches when an entity changes
 */
async function invalidateRelatedCaches(
  tag: CacheTag,
  tenantId: string
): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  try {
    const relatedTags: CacheTag[] = []
    switch (tag) {
      case CacheTag.CONTACT:
      case CacheTag.DEAL:
      case CacheTag.TASK:
      case CacheTag.INVOICE:
      case CacheTag.ORDER:
        relatedTags.push(CacheTag.DASHBOARD, CacheTag.METRICS, CacheTag.STATS)
        relatedTags.push(
          CacheTag.CONTACT_LIST,
          CacheTag.DEAL_LIST,
          CacheTag.INVOICE_LIST
        )
        break
      case CacheTag.USER:
        relatedTags.push(CacheTag.TENANT)
        break
    }

    for (const relatedTag of relatedTags) {
      const pattern = `${relatedTag}:${tenantId}*`
      const keys = await redis.keys(pattern)
      if (keys.length > 0) await redis.del(...keys)
    }
  } catch (error) {
    console.error('Failed to invalidate related caches:', error)
  }
}

/**
 * Invalidate multiple tags at once
 */
export async function invalidateTags(
  tags: CacheTag[],
  tenantId?: string,
  entityId?: string
): Promise<void> {
  await Promise.all(tags.map((tag) => invalidateByTag(tag, tenantId, entityId)))
}

/**
 * Clear all cache for a tenant
 */
export async function clearTenantCache(tenantId: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  try {
    const pattern = `*:${tenantId}:*`
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
      console.log(`Cleared ${keys.length} cache keys for tenant: ${tenantId}`)
    }
  } catch (error) {
    console.error(`Failed to clear cache for tenant ${tenantId}:`, error)
  }
}

/**
 * Set cache with TTL (uses singleton)
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = 3600
): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value))
  } catch (error) {
    console.error(`Failed to set cache for key ${key}:`, error)
  }
}

/**
 * Get cache value (uses singleton)
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedis()
  if (!redis) return null
  try {
    const value = await redis.get(key)
    if (value == null) return null
    return JSON.parse(value) as T
  } catch (error) {
    console.error(`Failed to get cache for key ${key}:`, error)
    return null
  }
}

/**
 * Delete cache by key (uses singleton)
 */
export async function deleteCache(key: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  try {
    await redis.del(key)
  } catch (error) {
    console.error(`Failed to delete cache for key ${key}:`, error)
  }
}
