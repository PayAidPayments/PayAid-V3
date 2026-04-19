import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'
import { prismaRead } from '@/lib/db/prisma-read'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { resolveCrmRequestTenantId } from '@/lib/crm/resolve-crm-request-tenant'
import {
  DEFAULT_LEAD_ROUTING_CONFIG_V1,
  LeadRoutingConfigV1Schema,
  loadLeadRoutingConfig,
} from '@/lib/crm/lead-routing'
import { ZodError } from 'zod'

function leadRoutingErrorResponse(error: unknown): NextResponse {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2022') {
      return NextResponse.json(
        {
          error:
            'Lead routing needs the latest database schema. Apply migrations on this database (e.g. prisma migrate deploy), including 20260419120000_crm_config_lead_routing.',
          code: 'LEAD_ROUTING_SCHEMA_MISSING',
          prismaCode: error.code,
        },
        { status: 503 }
      )
    }
  }
  const message = error instanceof Error ? error.message : String(error)
  const hint =
    /leadRouting|CRMConfig/i.test(message) && /column|does not exist/i.test(message)
      ? ' If this is production, run prisma migrate deploy on the database used by this deployment.'
      : ''
  console.error('lead-routing error:', error)
  return NextResponse.json(
    {
      error: `Failed to load lead routing.${hint}`,
      ...(process.env.NODE_ENV !== 'production' ? { debugMessage: message } : {}),
    },
    { status: 500 }
  )
}

/**
 * GET /api/crm/lead-routing — tenant routing config + sales reps for UI.
 * PATCH — upsert CRMConfig.leadRouting JSON.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveCrmRequestTenantId(request, jwtTenantId, userId)

    const parsed = (await loadLeadRoutingConfig(tenantId)) ?? DEFAULT_LEAD_ROUTING_CONFIG_V1

    // Avoid orderBy on nested `user` — some Postgres/Prisma builds error on relation sort;
    // list size is small, so sort in memory after fetch.
    let salesRepsPayload: Array<{ id: string; userId: string; name: string; email: string | null }> = []
    try {
      const rows = await prismaRead.salesRep.findMany({
        where: { tenantId, isOnLeave: false },
        select: {
          id: true,
          userId: true,
          user: { select: { name: true, email: true } },
        },
      })
      const mapped = rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        name: (r.user?.name ?? r.user?.email ?? r.id).trim() || r.id,
        email: r.user?.email ?? null,
      }))
      mapped.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      )
      salesRepsPayload = mapped
    } catch (repErr) {
      console.error('[lead-routing] salesRep list failed (returning empty reps):', repErr)
      salesRepsPayload = []
    }

    return NextResponse.json({
      config: parsed,
      salesReps: salesRepsPayload,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    return leadRoutingErrorResponse(error)
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2022') {
      return leadRoutingErrorResponse(error)
    }
    console.error('PATCH lead-routing error:', error)
    return NextResponse.json({ error: 'Failed to save lead routing' }, { status: 500 })
  }
}
