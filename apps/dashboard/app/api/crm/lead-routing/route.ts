import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { resolveCrmRequestTenantId } from '@/lib/crm/resolve-crm-request-tenant'
import {
  DEFAULT_LEAD_ROUTING_CONFIG_V1,
  LeadRoutingConfigV1Schema,
  loadLeadRoutingConfig,
} from '@/lib/crm/lead-routing'
import { ZodError } from 'zod'

/**
 * GET /api/crm/lead-routing — tenant routing config + sales reps for UI.
 * PATCH — upsert CRMConfig.leadRouting JSON.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveCrmRequestTenantId(request, jwtTenantId, userId)

    const parsed = (await loadLeadRoutingConfig(tenantId)) ?? DEFAULT_LEAD_ROUTING_CONFIG_V1

    const salesReps = await prisma.salesRep.findMany({
      where: { tenantId, isOnLeave: false },
      select: {
        id: true,
        userId: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { user: { name: 'asc' } },
    })

    return NextResponse.json({
      config: parsed,
      salesReps: salesReps.map((r) => ({
        id: r.id,
        userId: r.userId,
        name: r.user?.name ?? r.user?.email ?? r.id,
        email: r.user?.email ?? null,
      })),
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('GET lead-routing error:', error)
    return NextResponse.json({ error: 'Failed to load lead routing' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveCrmRequestTenantId(request, jwtTenantId, userId)

    const body = await request.json()
    const validated = LeadRoutingConfigV1Schema.parse(body)

    if (validated.fallbackSalesRepId) {
      const ok = await prisma.salesRep.findFirst({
        where: { id: validated.fallbackSalesRepId, tenantId },
        select: { id: true },
      })
      if (!ok) {
        return NextResponse.json({ error: 'Fallback sales rep not found for this tenant' }, { status: 400 })
      }
    }

    const map = validated.sourceChannelToSalesRepId ?? {}
    for (const repId of Object.values(map)) {
      const ok = await prisma.salesRep.findFirst({
        where: { id: repId, tenantId },
        select: { id: true },
      })
      if (!ok) {
        return NextResponse.json(
          { error: `Invalid sales rep id in source map: ${repId}` },
          { status: 400 }
        )
      }
    }

    await prisma.crmConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        leadRouting: validated as object,
      },
      update: {
        leadRouting: validated as object,
      },
    })

    const saved = await loadLeadRoutingConfig(tenantId)
    return NextResponse.json({ config: saved ?? validated })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.flatten() }, { status: 400 })
    }
    console.error('PATCH lead-routing error:', error)
    return NextResponse.json({ error: 'Failed to save lead routing' }, { status: 500 })
  }
}
