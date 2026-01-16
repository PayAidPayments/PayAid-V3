/**
 * Cache Invalidation Strategy for PayAid V3
 * Implements tag-based cache invalidation for efficient cache management
 */

import { Redis } from 'ioredis'

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

/**
 * Get Redis client (singleton)
 */
let redisClient: Redis | null = null

function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient
  }

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    console.warn('Redis URL not configured, cache invalidation disabled')
    return null
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
    })
    return redisClient
  } catch (error) {
    console.error('Failed to create Redis client:', error)
    return null
  }
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
  const client = getRedisClient()
  if (!client) {
    return
  }

  try {
    // Pattern to match all keys with this tag
    const pattern = tenantId
      ? entityId
        ? `${tag}:${tenantId}:${entityId}*`
        : `${tag}:${tenantId}:*`
      : `${tag}:*`

    // Find all matching keys
    const keys: string[] = []
    let cursor = '0'

    do {
      const result = await client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      )
      cursor = result[0]
      keys.push(...result[1])
    } while (cursor !== '0')

    // Delete all matching keys
    if (keys.length > 0) {
      await client.del(...keys)
      console.log(`Invalidated ${keys.length} cache keys for tag: ${tag}`)
    }

    // Also invalidate related aggregations
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
  const client = getRedisClient()
  if (!client) {
    return
  }

  try {
    const relatedTags: CacheTag[] = []

    // Map entity tags to related cache tags
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

    // Invalidate related tags
    for (const relatedTag of relatedTags) {
      const pattern = `${relatedTag}:${tenantId}*`
      const keys: string[] = []
      let cursor = '0'

      do {
        const result = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
        cursor = result[0]
        keys.push(...result[1])
      } while (cursor !== '0')

      if (keys.length > 0) {
        await client.del(...keys)
      }
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
  const client = getRedisClient()
  if (!client) {
    return
  }

  try {
    const pattern = `*:${tenantId}:*`
    const keys: string[] = []
    let cursor = '0'

    do {
      const result = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
      cursor = result[0]
      keys.push(...result[1])
    } while (cursor !== '0')

    if (keys.length > 0) {
      await client.del(...keys)
      console.log(`Cleared ${keys.length} cache keys for tenant: ${tenantId}`)
    }
  } catch (error) {
    console.error(`Failed to clear cache for tenant ${tenantId}:`, error)
  }
}

/**
 * Set cache with TTL
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = 3600
): Promise<void> {
  const client = getRedisClient()
  if (!client) {
    return
  }

  try {
    await client.setex(key, ttlSeconds, JSON.stringify(value))
  } catch (error) {
    console.error(`Failed to set cache for key ${key}:`, error)
  }
}

/**
 * Get cache value
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedisClient()
  if (!client) {
    return null
  }

  try {
    const value = await client.get(key)
    if (!value) {
      return null
    }
    return JSON.parse(value) as T
  } catch (error) {
    console.error(`Failed to get cache for key ${key}:`, error)
    return null
  }
}

/**
 * Delete cache by key
 */
export async function deleteCache(key: string): Promise<void> {
  const client = getRedisClient()
  if (!client) {
    return
  }

  try {
    await client.del(key)
  } catch (error) {
    console.error(`Failed to delete cache for key ${key}:`, error)
  }
}
