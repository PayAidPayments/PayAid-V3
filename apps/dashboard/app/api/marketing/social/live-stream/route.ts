import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

const eventSchema = z.object({
  source: z.string().optional(),
  platform: z.string().min(1),
  providerEventId: z.string().optional(),
  accountId: z.string().optional(),
  socialPostId: z.string().optional(),
  actorName: z.string().optional(),
  actorHandle: z.string().optional(),
  actorAvatar: z.string().optional(),
  action: z.string().min(1),
  objectType: z.string().optional(),
  objectId: z.string().optional(),
  objectText: z.string().optional(),
  eventAt: z.string().datetime().optional(),
  metadata: z.unknown().optional(),
})

const ingestSchema = z.object({
  events: z.array(eventSchema).min(1).max(100),
})

// GET /api/marketing/social/live-stream
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('limit') || '30')))
    const socialActivity = (prisma as any).socialActivityEvent

    const rows = await socialActivity.findMany({
      where: { tenantId },
      orderBy: { eventAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ events: rows })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) return handleLicenseError(error)
    console.error('Live stream GET error:', error)
    return NextResponse.json({ error: 'Failed to load live stream' }, { status: 500 })
  }
}

// POST /api/marketing/social/live-stream
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const body = await request.json()
    const { events } = ingestSchema.parse(body)
    const socialActivity = (prisma as any).socialActivityEvent

    let createdCount = 0
    for (const e of events) {
      const providerEventId = e.providerEventId?.trim() || undefined
      if (providerEventId) {
        const existing = await socialActivity.findFirst({
          where: { tenantId, platform: e.platform.toLowerCase(), providerEventId },
          select: { id: true },
        })
        if (existing) continue
      }
      await socialActivity.create({
        data: {
          tenantId,
          source: e.source || 'api',
          platform: e.platform.toLowerCase(),
          providerEventId,
          accountId: e.accountId,
          socialPostId: e.socialPostId,
          actorName: e.actorName,
          actorHandle: e.actorHandle,
          actorAvatar: e.actorAvatar,
          action: e.action,
          objectType: e.objectType,
          objectId: e.objectId,
          objectText: e.objectText,
          eventAt: e.eventAt ? new Date(e.eventAt) : new Date(),
          metadata: e.metadata,
        },
      })
      createdCount += 1
    }

    return NextResponse.json({ created: createdCount }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) return handleLicenseError(error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Live stream POST error:', error)
    return NextResponse.json({ error: 'Failed to ingest live stream events' }, { status: 500 })
  }
}

