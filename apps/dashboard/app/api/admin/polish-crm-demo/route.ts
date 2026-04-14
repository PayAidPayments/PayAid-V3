import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { polishCrmDashboardForDemoTenant } from '@/lib/demo/polish-crm-dashboard'
import { ensureMinimalContactDetails, shouldBackfillContactDetails } from '@/lib/crm/ensure-contact-details'

/**
 * GET /api/admin/polish-crm-demo?tenantId=
 * Idempotent demo-only CRM KPI polish (lead sources, churn flags, won deal for current month).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request).catch(() => null)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = request.nextUrl.searchParams.get('tenantId') || (user as { tenantId?: string }).tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 })
    }

    const jwtTenantId = (user as { tenantId?: string }).tenantId
    if (jwtTenantId && jwtTenantId !== tenantId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: (user as { userId?: string }).userId },
        select: { tenantId: true },
      })
      if (dbUser?.tenantId !== tenantId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const result = await polishCrmDashboardForDemoTenant(tenantId)

    let contactDetailsUpdated = 0
    const tenantMeta = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, subdomain: true },
    })
    if (shouldBackfillContactDetails(tenantMeta)) {
      try {
        const r = await ensureMinimalContactDetails(tenantId)
        contactDetailsUpdated = r.updated
      } catch (e) {
        console.warn('[polish-crm-demo] ensureMinimalContactDetails:', (e as Error)?.message)
      }
    }

    return NextResponse.json({ ok: true, ...result, contactDetailsUpdated })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[polish-crm-demo]', message)
    return NextResponse.json({ error: 'Failed to polish demo CRM data', message }, { status: 500 })
  }
}
