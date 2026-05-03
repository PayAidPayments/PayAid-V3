import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { resolveTenantFromParam } from '@/lib/tenant/resolve-tenant'

/**
 * GET /api/tenant/resolve?param=
 * Resolve tenant from slug or id. Returns id, slug, and whether to redirect to slug URL.
 * Used by client layouts to redirect when user has internal id in URL and tenant has slug.
 * Requires auth.
 */
export async function GET(request: NextRequest) {
  const payload = await authenticateRequest(request)
  if (!payload?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const param = request.nextUrl.searchParams.get('param')?.trim()
  const resolved = await resolveTenantFromParam(param ?? undefined)
  if (!resolved) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }
  return NextResponse.json({
    id: resolved.id,
    slug: resolved.slug,
    shouldRedirectToSlug: resolved.shouldRedirectToSlug,
    publicId: resolved.publicId,
  })
}
