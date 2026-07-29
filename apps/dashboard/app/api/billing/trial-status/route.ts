import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { createServerTiming, withCachedJson } from '@/lib/performance/api-server-timing'

export async function GET(request: NextRequest) {
  const timing = createServerTiming()
  
  try {
    timing.start('auth')
    const auth = await requireAuth(request)
    timing.end('auth')
    
    const tenantId = auth.tenantId || auth.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 })
    }

    const cacheKey = `billing:trial-status:${tenantId}`
    
    const status = await withCachedJson(cacheKey, 120, async () => {
      timing.start('db')
      
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
        timing.end('db')
        return { error: 'Tenant not found', trialActive: false, degraded: true }
    }

    const now = Date.now()
    const trialEndsAt = tenant.trialEndsAt ? tenant.trialEndsAt.getTime() : null
    const isTrialActive = tenant.billingStatus === 'trialing' && !!trialEndsAt && trialEndsAt > now
    const daysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24))) : null
    const modules = tenant.moduleLicenses.length
      ? tenant.moduleLicenses.map((m) => m.moduleId)
      : tenant.licensedModules

      timing.end('db')
      
      return {
      tenantId: tenant.id,
      billingStatus: tenant.billingStatus || 'active',
      trialStartAt: tenant.trialStartAt,
      trialEndsAt: tenant.trialEndsAt,
      isTrialActive,
      daysLeft,
      modules,
      }
    }, timing)

    // If error in cached result, return with proper status
    if (status.error) {
      return NextResponse.json(status, { status: status.error === 'Tenant not found' ? 404 : 200 })
    }

    return NextResponse.json(status, {
      headers: {
        'Server-Timing': timing.toHeaders(),
      },
    })
  } catch (error) {
    console.error('Trial status error:', error, timing.toLogMeta())
    
    // Soft-fail: return safe default with 200 instead of 500 (keep auth 401)
    if ((error as any)?.status === 401 || (error as any)?.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json(
      {
        error: 'Failed to fetch trial status',
        trialActive: false,
        degraded: true,
      },
      { status: 200 }
    )
  }
}

