import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/license'
import { getLeadIntelligenceTelemetryTotals } from '@/lib/lead-intelligence/telemetry'

/**
 * Entitlement probe for Lead Intelligence API routes plus lightweight data-plane signal.
 * Discovery handlers use tenant `Account` rows (M1); external provider health can extend this object later.
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireModuleAccess(request, 'lead-intelligence')
    const started = Date.now()
    let dataPlane: { prisma: 'ok' | 'error'; latencyMs: number }
    try {
      await prisma.$queryRaw`SELECT 1`
      dataPlane = { prisma: 'ok', latencyMs: Date.now() - started }
    } catch {
      dataPlane = { prisma: 'error', latencyMs: Date.now() - started }
    }

    const body: Record<string, unknown> = {
      ok: true,
      moduleId: 'lead-intelligence',
      tenantId: ctx.tenantId,
      subscriptionTier: ctx.subscriptionTier,
      discovery: {
        mode: 'tenant_account_index',
        status: dataPlane.prisma === 'ok' ? 'ready' : 'degraded',
      },
      dataPlane,
    }
    if (process.env.LEAD_INTELLIGENCE_TELEMETRY_IN_HEALTH === '1') {
      body.telemetry = {
        countersSinceProcessStart: getLeadIntelligenceTelemetryTotals(),
      }
    }

    return NextResponse.json(body)
  } catch (error) {
    return handleLicenseError(error)
  }
}
