import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { z } from 'zod'

const ALLOWED_FLAGS = new Set([
  'm0_ai_native_core',
  'm1_unibox_ingest',
  'm1_revenue_intelligence',
  'm2_voice',
  'm2_sdr',
  'm2_cpq',
  'm2_marketplace',
  'm3_governance',
])

const patchBodySchema = z.object({
  flags: z
    .record(z.string(), z.boolean())
    .refine(
      (obj) => Object.keys(obj).every((k) => ALLOWED_FLAGS.has(k)),
      { message: 'One or more unknown feature flag names' }
    )
    .refine(
      (obj) => Object.keys(obj).length >= 1,
      { message: 'At least one flag must be provided' }
    ),
})

/**
 * PATCH /api/v1/admin/tenants/[id]/feature-flags
 *
 * SUPER_ADMIN only. Upsert feature flag values for a specific tenant.
 *
 * Body: { flags: { m2_voice: true, m2_sdr: false, ... } }
 * Returns: updated flag map.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin()

    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id },
      select: { id: true, name: true },
    })
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found', id: params.id }, { status: 404 })
    }

    const body = await request.json()
    const parsed = patchBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.errors },
        { status: 400 }
      )
    }

    const { flags } = parsed.data

    // Upsert each flag
    const upsertOps = Object.entries(flags).map(([featureName, isEnabled]) =>
      prisma.featureToggle.upsert({
        where: { tenantId_featureName: { tenantId: params.id, featureName } },
        create: { tenantId: params.id, featureName, isEnabled },
        update: { isEnabled },
        select: { featureName: true, isEnabled: true, updatedAt: true },
      })
    )

    const updated = await Promise.all(upsertOps)

    // Emit audit log (non-fatal)
    prisma.auditLog
      .create({
        data: {
          tenantId: params.id,
          entityType: 'feature_flag_update',
          entityId: params.id,
          changedBy: 'super_admin',
          changeSummary: `Feature flags updated: ${Object.entries(flags)
            .map(([k, v]) => `${k}=${v}`)
            .join(', ')}`,
        },
      })
      .catch(() => {})

    const flagMap: Record<string, boolean> = {}
    for (const row of updated) {
      flagMap[row.featureName] = row.isEnabled
    }

    return NextResponse.json({
      tenant_id: params.id,
      updated_flags: flagMap,
      updated_at: new Date().toISOString(),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal error'
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (msg === 'Forbidden') return NextResponse.json({ error: 'Forbidden — SUPER_ADMIN required' }, { status: 403 })
    console.error('Admin feature-flags patch error:', e)
    return NextResponse.json({ error: 'Failed to update feature flags' }, { status: 500 })
  }
}
