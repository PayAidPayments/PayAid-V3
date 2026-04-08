/**
 * Phase 17: Entitlement middleware – tenant_modules gate.
 * Use checkModuleAccess in API/server; use createModuleMiddleware in Next.js middleware (Edge: call API to check).
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { hasModule } from '../moduleRegistry'
import type { ModuleId } from '../moduleRegistry'

const MODULE_IDS = ['marketing', 'crm', 'finance', 'hr', 'productivity', 'inventory'] as const

/** Extract first path segment as module id (e.g. /marketing/studio -> marketing). */
export function getModuleIdFromPath(pathname: string): string | null {
  const segments = pathname.replace(/^\/+/, '').split('/')
  const first = segments[0]?.toLowerCase()
  if (first && MODULE_IDS.includes(first as (typeof MODULE_IDS)[number])) return first
  return null
}

/** Server-side: check if tenant has access to module (use in API routes / Server Components). */
export async function checkModuleAccess(tenantId: string, moduleId: string): Promise<boolean> {
  return hasModule(tenantId, moduleId)
}

export type GetTenantIdFromRequest = (req: NextRequest) => string | null

/**
 * Returns a Next.js middleware that redirects to /upgrade?for=<moduleId> when tenant lacks the module.
 * On Edge, Prisma is not available – pass checkUrl to call your API (e.g. /api/auth/check-module) that uses checkModuleAccess.
 * In Node (e.g. custom server), you can pass no checkUrl and use getTenantId only for paths that are then checked in layout/API.
 */
export function createModuleMiddleware(options: {
  getTenantId: GetTenantIdFromRequest
  /** Optional: API URL to call for check on Edge (e.g. /api/auth/check-module). If not set, redirect is skipped in middleware (check in layout/API). */
  checkUrl?: string
}) {
  const { getTenantId, checkUrl } = options
  return async function moduleMiddleware(req: NextRequest): Promise<NextResponse | null> {
    const tenantId = getTenantId(req)
    const moduleId = getModuleIdFromPath(req.nextUrl.pathname)
    if (!tenantId || !moduleId) return null

    if (checkUrl) {
      const url = new URL(checkUrl, req.url)
      url.searchParams.set('tenantId', tenantId)
      url.searchParams.set('moduleId', moduleId)
      const res = await fetch(url.toString(), { headers: req.headers })
      if (res.status === 403) {
        return NextResponse.redirect(new URL(`/upgrade?for=${moduleId}`, req.url))
      }
      return null
    }

    const hasAccess = await hasModule(tenantId, moduleId as ModuleId)
    if (!hasAccess) {
      return NextResponse.redirect(new URL(`/upgrade?for=${moduleId}`, req.url))
    }
    return null
  }
}
