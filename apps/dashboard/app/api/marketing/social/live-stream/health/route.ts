import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

function isSet(v?: string | null) {
  return !!v && v.trim().length > 0
}

// GET /api/marketing/social/live-stream/health
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const socialActivity = (prisma as any).socialActivityEvent

    const env = {
      socialWebhookIngestSecret: isSet(process.env.SOCIAL_WEBHOOK_INGEST_SECRET),
      socialWebhookVerifyToken: isSet(process.env.SOCIAL_WEBHOOK_VERIFY_TOKEN),
      metaWebhookVerifyToken: isSet(process.env.META_WEBHOOK_VERIFY_TOKEN),
    }

    let dbReady = false
    let activityCount30d = 0
    let dbError: string | null = null
    try {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      activityCount30d = await socialActivity.count({
        where: { tenantId, eventAt: { gte: since } },
      })
      dbReady = true
    } catch (e) {
      dbError = e instanceof Error ? e.message : 'Unknown DB error'
    }

    const adapters = {
      meta: { routeReady: true, verifyHandshakeSupported: true },
      linkedin: { routeReady: true, verifyHandshakeSupported: false },
    }

    const warnings: string[] = []
    if (!env.socialWebhookIngestSecret) {
      warnings.push('SOCIAL_WEBHOOK_INGEST_SECRET is not set; webhook endpoints are not protected by shared secret.')
    }
    if (!env.metaWebhookVerifyToken && !env.socialWebhookVerifyToken) {
      warnings.push('Meta webhook verify token is not set; GET verification may fail.')
    }
    if (!dbReady) {
      warnings.push('SocialActivityEvent DB access failed; check Prisma client/schema sync.')
    }

    return NextResponse.json({
      ok: dbReady && adapters.meta.routeReady && adapters.linkedin.routeReady,
      env,
      adapters,
      db: {
        ready: dbReady,
        activityCount30d,
        error: dbError,
      },
      warnings,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Live stream health error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to compute live stream health' },
      { status: 500 }
    )
  }
}

