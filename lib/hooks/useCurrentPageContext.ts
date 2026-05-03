'use client'

import { useParams, usePathname } from 'next/navigation'

export interface CurrentPageContext {
  module: string
  page: string
  tenantId: string
  filters?: Record<string, unknown>
}

/**
 * Derives module, page, and tenantId from the current route.
 * Used by PageAIAssistant to scope AI to this page and tenant.
 */
export function useCurrentPageContext(): CurrentPageContext {
  const pathname = usePathname() ?? ''
  const params = useParams()
  const tenantId = (params?.tenantId as string) ?? ''

  // First segment after tenantId is often the "page" (Home, Leads, Invoices, etc.)
  const segments = pathname.split('/').filter(Boolean)
  const tenantIndex = segments.findIndex((s) => s === tenantId || s.length > 10)
  const moduleSegment = tenantIndex > 0 ? segments[tenantIndex - 1] : segments[0]
  const pageSegment = tenantIndex >= 0 && segments[tenantIndex + 1] ? segments[tenantIndex + 1] : 'Home'

  const module = moduleSegment ?? 'general'
  const page = pageSegment ?? 'Home'

  return {
    module,
    page,
    tenantId,
  }
}
