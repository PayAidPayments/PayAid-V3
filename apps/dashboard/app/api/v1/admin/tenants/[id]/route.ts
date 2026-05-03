import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'

const ALL_FEATURE_FLAGS = [
  'm0_ai_native_core',
  'm1_unibox_ingest',
  'm1_revenue_intelligence',
  'm2_voice',
  'm2_sdr',
  'm2_cpq',
  'm2_marketplace',
  'm3_governance',
]

/**
 * GET /api/v1/admin/tenants/[id]
 *
 * SUPER_ADMIN only. Returns full tenant detail including all feature flags.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin()

    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        status: true,
        industry: true,
        email: true,
        phone: true,
        country: true,
        licensedModules: true,
        billingStatus: true,
        trialEndsAt: true,
        maxUsers: true,
        maxContacts: true,
        subscriptionTier: true,
        onboardingCompleted: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { users: true, deals: true, contacts: true },
        },
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found', id: params.id }, { status: 404 })
    }

    const toggles = await prisma.featureToggle.findMany({
      where: { tenantId: params.id, featureName: { in: ALL_FEATURE_FLAGS } },
      select: { featureName: true, isEnabled: true, updatedAt: true },
    })

    const flagMap: Record<string, { enabled: boolean; updated_at: string }> = {}
    for (const t of toggles) {
      flagMap[t.featureName] = {
        enabled: t.isEnabled,
        updated_at: t.updatedAt ? t.updatedAt.toISOString() : '',
      }
    }
    // Fill missing flags as default-on (matches assertTenantFeatureEnabled behavior)
    for (const f of ALL_FEATURE_FLAGS) {
      if (!flagMap[f]) flagMap[f] = { enabled: true, updated_at: '' }
    }

    return NextResponse.json({
      tenant: {
        ...tenant,
        user_count: tenant._count.users,
        deal_count: tenant._count.deals,
        contact_count: tenant._count.contacts,
      },
      feature_flags: flagMap,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal error'
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (msg === 'Forbidden') return NextResponse.json({ error: 'Forbidden — SUPER_ADMIN required' }, { status: 403 })
    console.error('Admin tenant detail error:', e)
    return NextResponse.json({ error: 'Failed to get tenant' }, { status: 500 })
  }
}
