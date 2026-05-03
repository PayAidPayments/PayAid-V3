/**
 * Campaign logs – contact-level call feed for monitoring
 * GET /api/v1/voice-agents/campaigns/[id]/logs
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: campaignId } = await params
    const campaign = await prisma.voiceAgentCampaign.findFirst({
      where: { id: campaignId, tenantId: user.tenantId },
      select: { id: true, status: true },
    })
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 200)
    const offset = Number(searchParams.get('offset')) || 0

    const contacts = await prisma.voiceAgentCampaignContact.findMany({
      where: { campaignId },
      orderBy: [{ attemptedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      skip: offset,
      select: {
        id: true,
        phone: true,
        name: true,
        status: true,
        attemptedAt: true,
        completedAt: true,
        callId: true,
        metadata: true,
      },
    })

    const callIds = contacts.map((c) => c.callId).filter(Boolean) as string[]
    const calls =
      callIds.length > 0
        ? await prisma.voiceAgentCall.findMany({
            where: { id: { in: callIds } },
            select: {
              id: true,
              durationSeconds: true,
              transcript: true,
              status: true,
            },
          })
        : []
    const callMap = new Map(calls.map((c) => [c.id, c]))

    const logs = contacts.map((c) => {
      const call = c.callId ? callMap.get(c.callId) : null
      const duration = call?.durationSeconds ?? null
      const transcript = call?.transcript ?? null
      const outcome =
        c.status === 'completed'
          ? transcript
            ? transcript.slice(0, 120) + (transcript.length > 120 ? '…' : '')
            : 'Completed'
          : c.status === 'dnd_skipped'
            ? 'DND – Skipped'
            : c.status === 'failed'
              ? 'Failed'
              : c.status === 'calling'
                ? 'Ringing…'
                : 'Pending'
      return {
        id: c.id,
        phone: c.phone,
        name: c.name,
        status: c.status,
        attemptedAt: c.attemptedAt,
        completedAt: c.completedAt,
        durationSeconds: duration,
        outcome,
      }
    })

    const stats = await prisma.voiceAgentCampaignContact.groupBy({
      by: ['status'],
      where: { campaignId },
      _count: true,
    })
    const total = stats.reduce((s, r) => s + r._count, 0)
    const completed = stats.find((r) => r.status === 'completed')?._count ?? 0
    const attempted = total - (stats.find((r) => r.status === 'pending')?._count ?? 0)
    const connectedPct = attempted > 0 ? Math.round((completed / attempted) * 100) : 0
    const conversionPct = total > 0 ? Math.round((completed / total) * 100) : 0

    const allContactCallIds = await prisma.voiceAgentCampaignContact.findMany({
      where: { campaignId, callId: { not: null } },
      select: { callId: true },
    })
    const allCallIds = allContactCallIds.map((c) => c.callId).filter(Boolean) as string[]
    const avgDurationSeconds =
      allCallIds.length > 0
        ? await prisma.voiceAgentCall
            .aggregate({
              where: { id: { in: allCallIds } },
              _avg: { durationSeconds: true },
            })
            .then((a) => (a._avg.durationSeconds ? Math.round(Number(a._avg.durationSeconds)) : null))
        : null

    return NextResponse.json({
      logs,
      metrics: {
        totalCalls: total,
        connectedPct,
        conversionPct,
        avgDurationSeconds,
      },
      campaignStatus: campaign.status,
    })
  } catch (error) {
    console.error('[Campaigns] GET logs error:', error)
    return NextResponse.json({ error: 'Failed to get campaign logs' }, { status: 500 })
  }
}
