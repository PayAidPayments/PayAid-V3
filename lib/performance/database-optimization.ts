import { prisma } from '@/lib/db/prisma'
import { Redis } from 'ioredis'

// Initialize Redis for caching
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

/**
 * Cache key generators
 */
export function getCacheKey(prefix: string, ...parts: string[]): string {
  return `${prefix}:${parts.join(':')}`
}

/**
 * Get cached data
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key)
    if (cached) {
      return JSON.parse(cached) as T
    }
    return null
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

/**
 * Set cached data with TTL
 */
export async function setCached(
  key: string,
  data: any,
  ttlSeconds: number = 300
): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(data))
  } catch (error) {
    console.error('Cache set error:', error)
  }
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('Cache invalidation error:', error)
  }
}

/**
 * Optimized contact query with caching
 */
export async function getContactsOptimized(
  tenantId: string,
  options?: {
    limit?: number
    offset?: number
    search?: string
    useCache?: boolean
  }
) {
  const cacheKey = getCacheKey('contacts', tenantId, JSON.stringify(options || {}))

  if (options?.useCache !== false) {
    const cached = await getCached<any>(cacheKey)
    if (cached) {
      return cached
    }
  }

  const contacts = await prisma.contact.findMany({
    where: {
      tenantId,
      ...(options?.search && {
        OR: [
          { name: { contains: options.search, mode: 'insensitive' } },
          { email: { contains: options.search, mode: 'insensitive' } },
        ],
      }),
    },
    take: options?.limit || 50,
    skip: options?.offset || 0,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      company: true,
      status: true,
      createdAt: true,
      // Only select needed fields
    },
    orderBy: { createdAt: 'desc' },
  })

  if (options?.useCache !== false) {
    await setCached(cacheKey, contacts, 60) // Cache for 1 minute
  }

  return contacts
}

/**
 * Optimized deal query with caching
 */
export async function getDealsOptimized(
  tenantId: string,
  options?: {
    limit?: number
    offset?: number
    stage?: string
    useCache?: boolean
  }
) {
  const cacheKey = getCacheKey('deals', tenantId, JSON.stringify(options || {}))

  if (options?.useCache !== false) {
    const cached = await getCached<any>(cacheKey)
    if (cached) {
      return cached
    }
  }

  const deals = await prisma.deal.findMany({
    where: {
      tenantId,
      ...(options?.stage && { stage: options.stage }),
    },
    take: options?.limit || 50,
    skip: options?.offset || 0,
    select: {
      id: true,
      name: true,
      value: true,
      stage: true,
      status: true,
      expectedCloseDate: true,
      createdAt: true,
      // Only select needed fields, avoid heavy relations
    },
    orderBy: { createdAt: 'desc' },
  })

  if (options?.useCache !== false) {
    await setCached(cacheKey, deals, 60) // Cache for 1 minute
  }

  return deals
}

/**
 * Batch operations for better performance
 */
export async function batchUpdateContacts(
  updates: Array<{ id: string; data: any }>,
  tenantId: string
): Promise<void> {
  // Use transaction for batch updates
  await prisma.$transaction(
    updates.map((update) =>
      prisma.contact.update({
        where: { id: update.id, tenantId },
        data: update.data,
      })
    )
  )

  // Invalidate cache
  await invalidateCache(`contacts:${tenantId}:*`)
}

/**
 * Optimize database queries with proper indexes
 * This should be run as a migration
 */
export const databaseIndexes = `
-- Performance optimization indexes (Phase 6)

-- Contact indexes
CREATE INDEX IF NOT EXISTS "Contact_tenantId_createdAt_idx" ON "Contact"("tenantId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Contact_tenantId_status_idx" ON "Contact"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "Contact_email_idx" ON "Contact"("email") WHERE "email" IS NOT NULL;

-- Deal indexes
CREATE INDEX IF NOT EXISTS "Deal_tenantId_stage_idx" ON "Deal"("tenantId", "stage");
CREATE INDEX IF NOT EXISTS "Deal_tenantId_expectedCloseDate_idx" ON "Deal"("tenantId", "expectedCloseDate") WHERE "expectedCloseDate" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Deal_tenantId_status_idx" ON "Deal"("tenantId", "status");

-- Interaction indexes
CREATE INDEX IF NOT EXISTS "Interaction_tenantId_contactId_createdAt_idx" ON "Interaction"("tenantId", "contactId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Interaction_tenantId_type_idx" ON "Interaction"("tenantId", "type");

-- Task indexes
CREATE INDEX IF NOT EXISTS "Task_tenantId_status_dueDate_idx" ON "Task"("tenantId", "status", "dueDate");
CREATE INDEX IF NOT EXISTS "Task_tenantId_assignedTo_idx" ON "Task"("tenantId", "assignedTo") WHERE "assignedTo" IS NOT NULL;

-- Email indexes
CREATE INDEX IF NOT EXISTS "EmailMessage_tenantId_createdAt_idx" ON "EmailMessage"("tenantId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "EmailMessage_contactId_idx" ON "EmailMessage"("contactId") WHERE "contactId" IS NOT NULL;
`
