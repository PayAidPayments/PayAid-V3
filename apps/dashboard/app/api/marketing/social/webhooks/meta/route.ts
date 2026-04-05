import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { normalizeMetaPayload } from '@/lib/marketing/social-activity-normalizer'

function getVerifyToken() {
  return process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.SOCIAL_WEBHOOK_VERIFY_TOKEN || ''
}

function getIngestSecret() {
  return process.env.SOCIAL_WEBHOOK_INGEST_SECRET || ''
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode')
  const token = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')
  if (mode === 'subscribe' && challenge && token && token === getVerifyToken()) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

export async function POST(request: NextRequest) {
  try {
    const configuredSecret = getIngestSecret()
    if (configuredSecret) {
      const got = request.headers.get('x-payaid-webhook-secret') || ''
      if (got !== configuredSecret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await request.json()
    const events = normalizeMetaPayload(payload)
    if (events.length === 0) return NextResponse.json({ created: 0 })
    const socialActivity = (prisma as any).socialActivityEvent

    const accountIds = [...new Set(events.map((e) => e.accountExternalId).filter(Boolean) as string[])]
    const accounts = accountIds.length
      ? await prisma.socialMediaAccount.findMany({
          where: {
            platform: { in: ['facebook', 'instagram'] },
            accountId: { in: accountIds },
            isConnected: true,
          },
          select: { id: true, tenantId: true, accountId: true },
        })
      : []
    const byExternal = new Map(accounts.map((a) => [a.accountId || '', a]))

    const queryTenantId = request.nextUrl.searchParams.get('tenantId') || undefined
    let created = 0
    for (const ev of events) {
      const matched = ev.accountExternalId ? byExternal.get(ev.accountExternalId) : undefined
      const tenantId = matched?.tenantId || queryTenantId
      if (!tenantId) continue
      const providerEventId = ev.providerEventId?.trim() || undefined
      if (providerEventId) {
        const duplicate = await socialActivity.findFirst({
          where: { tenantId, platform: ev.platform, providerEventId },
          select: { id: true },
        })
        if (duplicate) continue
      }
      await socialActivity.create({
        data: {
          tenantId,
          source: ev.source || 'meta-webhook',
          platform: ev.platform,
          providerEventId,
          accountId: matched?.id,
          action: ev.action,
          actorName: ev.actorName,
          actorHandle: ev.actorHandle,
          actorAvatar: ev.actorAvatar,
          objectType: ev.objectType,
          objectId: ev.objectId,
          objectText: ev.objectText,
          eventAt: ev.eventAt || new Date(),
          metadata: ev.metadata,
        },
      })
      created += 1
    }

    return NextResponse.json({ created })
  } catch (error) {
    console.error('Meta social webhook error:', error)
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 })
  }
}

