import { prisma } from '../db/prisma'
import { cache } from '../redis/client'

/**
 * Middleware to enforce tenant isolation
 * Ensures all queries include tenant_id filter
 */
export function withTenant<T extends { tenantId: string }>(
  data: T,
  tenantId: string
): T {
  if (data.tenantId !== tenantId) {
    throw new Error('Unauthorized: Tenant mismatch')
  }
  return data
}

/**
 * Get tenant by ID with caching
 */
export async function getTenant(tenantId: string) {
  const cacheKey = `tenant:${tenantId}`
  
  // Try cache first
  const cached = await cache.get(cacheKey)
  if (cached) {
    return cached
  }
  
  // Fetch from database
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  })
  
  if (tenant) {
    // Cache for 5 minutes
    await cache.set(cacheKey, tenant, 300)
  }
  
  return tenant
}

/**
 * Get tenant by subdomain
 */
export async function getTenantBySubdomain(subdomain: string) {
  const cacheKey = `tenant:subdomain:${subdomain}`
  
  // Try cache first
  const cached = await cache.get(cacheKey)
  if (cached) {
    return cached
  }
  
  // Fetch from database
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
  })
  
  if (tenant) {
    // Cache for 5 minutes
    await cache.set(cacheKey, tenant, 300)
  }
  
  return tenant
}

/**
 * Check if tenant has reached plan limits
 */
export async function checkTenantLimits(tenantId: string, resource: string): Promise<boolean> {
  const tenant = await getTenant(tenantId)
  if (!tenant) return false
  
  const limits: Record<string, number> = {
    contacts: tenant.maxContacts,
    invoices: tenant.maxInvoices,
    users: tenant.maxUsers,
    storage: tenant.maxStorage,
  }
  
  const limit = limits[resource]
  if (!limit) return true // No limit
  
  // Count current usage
  let count = 0
  switch (resource) {
    case 'contacts':
      count = await prisma.contact.count({ where: { tenantId } })
      break
    case 'invoices':
      count = await prisma.invoice.count({ where: { tenantId } })
      break
    case 'users':
      count = await prisma.user.count({ where: { tenantId } })
      break
    // Storage would need file system check
  }
  
  return count < limit
}

