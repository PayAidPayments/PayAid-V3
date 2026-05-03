/**
 * Resolve tenant from URL segment (slug or internal id).
 * See docs/TENANT_SLUG_DESIGN.md.
 */

import { prisma } from '@/lib/db/prisma'
import { isValidSlugFormat } from '@/lib/utils/generate-tenant-slug'

export interface ResolvedTenant {
  id: string
  slug: string | null
  /** When true, caller should 301 redirect to the same path with slug in place of id. */
  shouldRedirectToSlug: boolean
  /** Use when building links (prefer slug when available). */
  publicId: string
}

/**
 * Resolve tenant by slug or id. Returns null if not found.
 * If the request used internal id and tenant has a slug, shouldRedirectToSlug is true and redirectUrl can be built.
 */
export async function resolveTenantFromParam(param: string | undefined): Promise<ResolvedTenant | null> {
  if (!param || typeof param !== 'string' || !param.trim()) return null

  const bySlug = isValidSlugFormat(param)
  const tenant = await prisma.tenant.findFirst({
    where: bySlug ? { slug: param } : { id: param },
    select: { id: true, slug: true },
  })

  if (!tenant) return null

  const publicId = tenant.slug ?? tenant.id
  const shouldRedirectToSlug = !bySlug && !!tenant.slug

  return {
    id: tenant.id,
    slug: tenant.slug,
    shouldRedirectToSlug,
    publicId,
  }
}

/**
 * Build the path with tenant segment replaced by publicId (slug or id).
 * Example: buildTenantPath('/hr/abc123/Home', 'xyz-slug-4821') => '/hr/xyz-slug-4821/Home'
 */
export function buildTenantPath(currentPath: string, publicId: string): string {
  const segments = currentPath.split('/').filter(Boolean)
  if (segments.length < 2) return currentPath
  // Assume pattern /module/tenantId/... so index 1 is tenantId
  segments[1] = publicId
  return '/' + segments.join('/')
}
