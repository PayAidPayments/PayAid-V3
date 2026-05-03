import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    const tenantId = auth.tenantId || auth.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        billingStatus: true,
        trialStartAt: true,
        trialEndsAt: true,
        licensedModules: true,
        moduleLicenses: {
          where: { isActive: true },
          select: { moduleId: true },
        },
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const now = Date.now()
    const trialEndsAt = tenant.trialEndsAt ? tenant.trialEndsAt.getTime() : null
    const isTrialActive = tenant.billingStatus === 'trialing' && !!trialEndsAt && trialEndsAt > now
    const daysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24))) : null
    const modules = tenant.moduleLicenses.length
      ? tenant.moduleLicenses.map((m) => m.moduleId)
      : tenant.licensedModules

    return NextResponse.json({
      tenantId: tenant.id,
      billingStatus: tenant.billingStatus || 'active',
      trialStartAt: tenant.trialStartAt,
      trialEndsAt: tenant.trialEndsAt,
      isTrialActive,
      daysLeft,
      modules,
    })
  } catch (error) {
    console.error('Trial status error:', error)
    return NextResponse.json({ error: 'Failed to fetch trial status' }, { status: 500 })
  }
}

