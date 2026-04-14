import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'

const M2_FEATURE_FLAGS = [
  'm2_voice',
  'm2_sdr',
  'm2_cpq',
  'm2_marketplace',
  'm1_revenue_intelligence',
  'm3_governance',
]

/**
 * GET /api/v1/admin/tenants
 *
 * SUPER_ADMIN only. Lists all tenants with summary counts and active feature flags.
 *
 * Query params:
 *   ?status=active|suspended|all  (default: all)
 *   ?plan=free|starter|pro|enterprise
 *   ?search=  name or slug
 *   ?limit=50 (max 200)
 *   ?page=1
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const url = new URL(request.url)
    const status = url.searchParams.get('status') ?? undefined
    const plan = url.searchParams.get('plan') ?? undefined
    const search = url.searchParams.get('search') ?? undefined
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 200)
    const page = Math.max(parseInt(url.searchParams.get('page') ?? '1', 10), 1)
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (status && status !== 'all') where.status = status
    if (plan) where.plan = plan
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          status: true,
          industry: true,
          licensedModules: true,
          billingStatus: true,
          trialEndsAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { users: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tenant.count({ where }),
    ])

    // For each tenant, fetch M2/M3 feature toggles in a single query
    const tenantIds = tenants.map((t) => t.id)
    const toggles = await prisma.featureToggle.findMany({
      where: {
        tenantId: { in: tenantIds },
        featureName: { in: M2_FEATURE_FLAGS },
      },
      select: { tenantId: true, featureName: true, isEnabled: true },
    })

    const togglesByTenant: Record<string, Record<string, boolean>> = {}
    for (const t of toggles) {
      if (!t.tenantId) continue
      if (!togglesByTenant[t.tenantId]) togglesByTenant[t.tenantId] = {}
      togglesByTenant[t.tenantId][t.featureName] = t.isEnabled
    }

    const rows = tenants.map((t) => ({
      ...t,
      user_count: t._count.users,
      feature_flags: togglesByTenant[t.id] ?? {},
    }))

    return NextResponse.json({
      tenants: rows,
      pagination: { total, limit, page, total_pages: Math.ceil(total / limit) },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal error'
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (msg === 'Forbidden') return NextResponse.json({ error: 'Forbidden — SUPER_ADMIN required' }, { status: 403 })
    console.error('Admin tenants list error:', e)
    return NextResponse.json({ error: 'Failed to list tenants' }, { status: 500 })
  }
}
