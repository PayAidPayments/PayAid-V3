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

const bodySchema = z.object({
  flags: z
    .record(z.string(), z.boolean())
    .refine((obj) => Object.keys(obj).every((k) => ALLOWED_FLAGS.has(k)), {
      message: 'One or more unknown feature flag names',
    })
    .refine((obj) => Object.keys(obj).length >= 1, {
      message: 'At least one flag must be provided',
    }),
})

type Severity = 'high' | 'medium' | 'low'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireSuperAdmin()
    const tenantId = params.id

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation error', details: parsed.error.errors }, { status: 400 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, _count: { select: { users: true, deals: true, contacts: true } } },
    })
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found', id: tenantId }, { status: 404 })
    }

    const currentRows = await prisma.featureToggle.findMany({
      where: { tenantId, featureName: { in: Array.from(ALLOWED_FLAGS) } },
      select: { featureName: true, isEnabled: true },
    })

    const current: Record<string, boolean> = {}
    for (const flag of ALLOWED_FLAGS) current[flag] = true // default-on behavior
    for (const row of currentRows) current[row.featureName] = row.isEnabled

    const proposed = { ...current, ...parsed.data.flags }
    const changed = Object.keys(parsed.data.flags).map((key) => ({
      flag: key,
      from: current[key],
      to: proposed[key],
    }))

    const impacts: Array<{ severity: Severity; title: string; detail: string }> = []
    const disabledNow = changed.filter((c) => c.from === true && c.to === false)
    const enabledNow = changed.filter((c) => c.from === false && c.to === true)

    if (disabledNow.some((c) => c.flag === 'm1_revenue_intelligence')) {
      impacts.push({
        severity: 'high',
        title: 'Revenue intelligence features will be hidden',
        detail: 'Disabling m1_revenue_intelligence impacts forecast/insight surfaces used by sales leadership.',
      })
    }
    if (disabledNow.some((c) => c.flag === 'm2_cpq')) {
      impacts.push({
        severity: 'high',
        title: 'CPQ flows may stop for active sellers',
        detail: `${tenant._count.deals} deals exist for this tenant; quote creation/conversion paths will be gated.`,
      })
    }
    if (disabledNow.some((c) => c.flag === 'm2_sdr')) {
      impacts.push({
        severity: 'medium',
        title: 'SDR automation will be gated',
        detail: 'Playbook runs/start actions will be blocked while the flag is disabled.',
      })
    }
    if (disabledNow.some((c) => c.flag === 'm2_voice')) {
      impacts.push({
        severity: 'medium',
        title: 'Voice operations will be gated',
        detail: 'AI call start/log/end/transcript API surfaces will return FEATURE_DISABLED.',
      })
    }
    if (enabledNow.length > 0) {
      impacts.push({
        severity: 'low',
        title: 'New features will become available',
        detail: `Enabling ${enabledNow.length} flag(s) may increase usage and support volume for ${tenant._count.users} user(s).`,
      })
    }
    if (impacts.length === 0) {
      impacts.push({
        severity: 'low',
        title: 'No significant behavior change detected',
        detail: 'The proposed flag values do not materially change currently effective access.',
      })
    }

    const sevWeight: Record<Severity, number> = { high: 3, medium: 2, low: 1 }
    impacts.sort((a, b) => sevWeight[b.severity] - sevWeight[a.severity])

    return NextResponse.json({
      tenant: { id: tenant.id, name: tenant.name },
      changed_flags: changed,
      summary: {
        total_changes: changed.length,
        disabled_count: disabledNow.length,
        enabled_count: enabledNow.length,
      },
      impacts,
      simulated_at: new Date().toISOString(),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal error'
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (msg === 'Forbidden') return NextResponse.json({ error: 'Forbidden — SUPER_ADMIN required' }, { status: 403 })
    console.error('Feature flag simulation error:', e)
    return NextResponse.json({ error: 'Failed to simulate feature flag impact' }, { status: 500 })
  }
}

