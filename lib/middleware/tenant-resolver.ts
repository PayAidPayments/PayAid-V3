import { NextRequest } from 'next/server'
import { prisma } from '../db/prisma'
import { cache } from '../redis/client'
import type { Tenant } from '@prisma/client'

/**
 * Phase 1: Tenant Context Resolution
 * Extracts tenant identifier from subdomain or URL path
 * Based on PayAid V3 Architecture Document
 */

export interface TenantContext {
  tenant: Tenant
  tenantId: string
  tenantSlug: string
}

/**
 * Extract tenant slug from request
 * Supports:
 * - Subdomain-based: https://acme-corp.payaid.store
 * - Path-based: https://payaid.store/tenant/acme-corp/
 */
export function extractTenantSlug(request: NextRequest): string | null {
  const host = request.headers.get('host') || ''
  const url = request.nextUrl.pathname

  // Method 1: Subdomain-based routing (RECOMMENDED)
  // Format: https://[tenant-slug].payaid.store
  if (host.includes('payaid.store') || host.includes('localhost')) {
    const parts = host.split('.')
    
    // For localhost:3000 or localhost, check if subdomain is in path
    if (host.startsWith('localhost')) {
      // Check path-based: /tenant/[slug]/
      const pathMatch = url.match(/^\/tenant\/([^\/]+)/)
      if (pathMatch) {
        return pathMatch[1]
      }
      
      // For development, check query param or header
      const tenantSlug = request.nextUrl.searchParams.get('tenant') || 
                         request.headers.get('x-tenant-slug')
      if (tenantSlug) {
        return tenantSlug
      }
      
      // Default dev tenant
      return process.env.DEV_TENANT_SLUG || 'dev-tenant'
    }
    
    // Production: Extract from subdomain
    // e.g., 'acme-corp.payaid.store' -> 'acme-corp'
    if (parts.length >= 2) {
      const subdomain = parts[0]
      // Skip 'www', 'api', 'admin' subdomains
      if (!['www', 'api', 'admin'].includes(subdomain)) {
        return subdomain
      }
    }
  }

  // Method 2: Path-based routing (FALLBACK)
  // Format: https://payaid.store/tenant/[tenant-slug]/
  const pathMatch = url.match(/^\/tenant\/([^\/]+)/)
  if (pathMatch) {
    return pathMatch[1]
  }

  // Method 3: Short path format
  // Format: https://payaid.store/t/[tenant-slug]/
  const shortPathMatch = url.match(/^\/t\/([^\/]+)/)
  if (shortPathMatch) {
    return shortPathMatch[1]
  }

  return null
}

/**
 * Resolve tenant from request
 * Returns tenant context with caching
 */
export async function resolveTenant(request: NextRequest): Promise<TenantContext | null> {
  const tenantSlug = extractTenantSlug(request)
  
  if (!tenantSlug) {
    return null
  }

  // Try cache first
  const cacheKey = `tenant:slug:${tenantSlug}`
  const cached = await cache.get(cacheKey) as Tenant | null
  if (cached) {
    return {
      tenant: cached,
      tenantId: cached.id,
      tenantSlug: cached.subdomain || tenantSlug,
    }
  }

  // Fetch from database
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: tenantSlug },
  })

  if (!tenant) {
    return null
  }

  // Cache for 5 minutes
  await cache.set(cacheKey, tenant, 300)

  return {
    tenant,
    tenantId: tenant.id,
    tenantSlug: tenant.subdomain || tenantSlug,
  }
}

/**
 * Resolve tenant by ID (for API routes with tenantId in token)
 */
export async function resolveTenantById(tenantId: string): Promise<TenantContext | null> {
  // Try cache first
  const cacheKey = `tenant:id:${tenantId}`
  const cached = await cache.get(cacheKey) as Tenant | null
  if (cached) {
    return {
      tenant: cached,
      tenantId: cached.id,
      tenantSlug: cached.subdomain || tenantId,
    }
  }

  // Fetch from database
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  })

  if (!tenant) {
    return null
  }

  // Cache for 5 minutes
  await cache.set(cacheKey, tenant, 300)

  return {
    tenant,
    tenantId: tenant.id,
    tenantSlug: tenant.subdomain || tenantId,
  }
}

/**
 * Middleware wrapper to inject tenant context into request
 * Usage in Next.js middleware or API routes
 */
export async function withTenantContext<T>(
  request: NextRequest,
  handler: (context: TenantContext, request: NextRequest) => Promise<T>
): Promise<T> {
  const context = await resolveTenant(request)
  
  if (!context) {
    throw new Error('Tenant not found or invalid tenant context')
  }

  return handler(context, request)
}

/**
 * Validate tenant is active and not paused
 */
export function validateTenantStatus(tenant: Tenant): void {
  if (tenant.status !== 'active') {
    throw new Error(`Tenant is ${tenant.status}`)
  }
  
  // Additional checks can be added here
  // e.g., subscription expiry, payment status, etc.
}
