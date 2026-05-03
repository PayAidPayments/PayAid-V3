/**
 * Cache Warming Utilities
 * 
 * Preload frequently accessed data into cache to improve response times.
 * Run on tenant login, scheduled jobs, or after data updates.
 */

import { multiLayerCache } from './multi-layer'
import { prismaRead } from '@/lib/db/prisma-read'
import { prisma } from '@/lib/db/prisma'

/**
 * Warm cache for a specific tenant
 * Preloads dashboard stats, recent contacts, active deals, etc.
 */
export async function warmTenantCache(tenantId: string): Promise<void> {
  try {
    console.log(`[Cache Warmer] Warming cache for tenant: ${tenantId}`)

    // Warm cache in parallel for better performance
    await Promise.all([
      warmDashboardStats(tenantId),
      warmRecentContacts(tenantId),
      warmActiveDeals(tenantId),
      warmRecentInvoices(tenantId),
      warmPendingTasks(tenantId),
    ])

    console.log(`[Cache Warmer] Cache warmed for tenant: ${tenantId}`)
  } catch (error) {
    console.error(`[Cache Warmer] Error warming cache for tenant ${tenantId}:`, error)
  }
}

/**
 * Warm dashboard statistics
 */
async function warmDashboardStats(tenantId: string): Promise<void> {
  try {
    const cacheKey = `dashboard:stats:${tenantId}`
    
    // Check if already cached
    const cached = await multiLayerCache.get(cacheKey)
    if (cached) {
      return // Already cached
    }

    // Fetch dashboard stats
    const [contacts, deals, invoices, orders, tasks] = await Promise.all([
      prismaRead.contact.count({ where: { tenantId } }),
      prismaRead.deal.count({ where: { tenantId } }),
      prismaRead.invoice.count({ where: { tenantId } }),
      prismaRead.order.count({ where: { tenantId } }),
      prismaRead.task.count({ where: { tenantId } }),
    ])

    const stats = {
      contacts,
      deals,
      invoices,
      orders,
      tasks,
      timestamp: Date.now(),
    }

    // Cache for 2 minutes
    await multiLayerCache.set(cacheKey, stats, 120)
  } catch (error) {
    console.error(`[Cache Warmer] Error warming dashboard stats:`, error)
  }
}

/**
 * Warm recent contacts
 */
async function warmRecentContacts(tenantId: string): Promise<void> {
  try {
    const cacheKey = `contacts:recent:${tenantId}`
    
    const cached = await multiLayerCache.get(cacheKey)
    if (cached) {
      return
    }

    const contacts = await prismaRead.contact.findMany({
      where: { tenantId },
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    })

    // Cache for 3 minutes
    await multiLayerCache.set(cacheKey, contacts, 180)
  } catch (error) {
    console.error(`[Cache Warmer] Error warming recent contacts:`, error)
  }
}

/**
 * Warm active deals
 */
async function warmActiveDeals(tenantId: string): Promise<void> {
  try {
    const cacheKey = `deals:active:${tenantId}`
    
    const cached = await multiLayerCache.get(cacheKey)
    if (cached) {
      return
    }

    const deals = await prismaRead.deal.findMany({
      where: {
        tenantId,
        stage: { not: 'lost' },
      },
      take: 20,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        value: true,
        stage: true,
        probability: true,
        expectedCloseDate: true,
        updatedAt: true,
      },
    })

    // Cache for 3 minutes
    await multiLayerCache.set(cacheKey, deals, 180)
  } catch (error) {
    console.error(`[Cache Warmer] Error warming active deals:`, error)
  }
}

/**
 * Warm recent invoices
 */
async function warmRecentInvoices(tenantId: string): Promise<void> {
  try {
    const cacheKey = `invoices:recent:${tenantId}`
    
    const cached = await multiLayerCache.get(cacheKey)
    if (cached) {
      return
    }

    const invoices = await prismaRead.invoice.findMany({
      where: { tenantId },
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        status: true,
        dueDate: true,
        createdAt: true,
      },
    })

    // Cache for 3 minutes
    await multiLayerCache.set(cacheKey, invoices, 180)
  } catch (error) {
    console.error(`[Cache Warmer] Error warming recent invoices:`, error)
  }
}

/**
 * Warm pending tasks
 */
async function warmPendingTasks(tenantId: string): Promise<void> {
  try {
    const cacheKey = `tasks:pending:${tenantId}`
    
    const cached = await multiLayerCache.get(cacheKey)
    if (cached) {
      return
    }

    const tasks = await prismaRead.task.findMany({
      where: {
        tenantId,
        status: { not: 'completed' },
      },
      take: 50,
      orderBy: { dueDate: 'asc' },
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        priority: true,
        createdAt: true,
      },
    })

    // Cache for 2 minutes
    await multiLayerCache.set(cacheKey, tasks, 120)
  } catch (error) {
    console.error(`[Cache Warmer] Error warming pending tasks:`, error)
  }
}

/**
 * Invalidate tenant cache (call after data updates)
 */
export async function invalidateTenantCache(tenantId: string): Promise<void> {
  try {
    const patterns = [
      `dashboard:stats:${tenantId}`,
      `contacts:*:${tenantId}*`,
      `deals:*:${tenantId}*`,
      `invoices:*:${tenantId}*`,
      `tasks:*:${tenantId}*`,
    ]

    await Promise.all(
      patterns.map((pattern) => multiLayerCache.deletePattern(pattern))
    )

    console.log(`[Cache Warmer] Cache invalidated for tenant: ${tenantId}`)
  } catch (error) {
    console.error(`[Cache Warmer] Error invalidating cache:`, error)
  }
}

/**
 * Warm cache for multiple tenants (batch operation)
 */
export async function warmMultipleTenantsCache(tenantIds: string[]): Promise<void> {
  // Process in batches to avoid overwhelming the system
  const BATCH_SIZE = 10
  
  for (let i = 0; i < tenantIds.length; i += BATCH_SIZE) {
    const batch = tenantIds.slice(i, i + BATCH_SIZE)
    await Promise.all(batch.map((tenantId) => warmTenantCache(tenantId)))
  }
}
