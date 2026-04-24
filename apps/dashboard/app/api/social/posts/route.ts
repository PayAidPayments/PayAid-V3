import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { mediumPriorityQueue } from '@/lib/queue/bull'

const CHANNELS = ['EMAIL', 'WHATSAPP', 'SMS', 'FACEBOOK', 'INSTAGRAM', 'TWITTER', 'LINKEDIN', 'YOUTUBE'] as const

const createPostsSchema = z.object({
  tenantId: z.string().min(1),
  segmentId: z.string().nullable().optional(),
  goal: z.string().optional(),
  channels: z.array(z.enum(CHANNELS)).min(1),
  contentByChannel: z.record(z.string(), z.string()),
  mediaIdsByChannel: z.record(z.string(), z.array(z.string())).optional(),
  sendNow: z.boolean(),
  scheduledFor: z.string().nullable().optional(),
})

const CHANNEL_TEXT_LIMITS: Record<(typeof CHANNELS)[number], number> = {
  EMAIL: 10000,
  WHATSAPP: 4096,
  SMS: 160,
  FACEBOOK: 63206,
  INSTAGRAM: 2200,
  TWITTER: 280,
  LINKEDIN: 3000,
  YOUTUBE: 5000,
}

const CHANNEL_IMAGE_RULES: Partial<
  Record<
    (typeof CHANNELS)[number],
    { minWidth: number; minHeight: number; maxWidth: number; maxHeight: number }
  >
> = {
  FACEBOOK: { minWidth: 200, minHeight: 200, maxWidth: 8192, maxHeight: 8192 },
  INSTAGRAM: { minWidth: 320, minHeight: 320, maxWidth: 4096, maxHeight: 4096 },
  LINKEDIN: { minWidth: 552, minHeight: 276, maxWidth: 7680, maxHeight: 4320 },
  EMAIL: { minWidth: 320, minHeight: 180, maxWidth: 3000, maxHeight: 3000 },
}

/**
 * GET /api/social/posts
 * Returns recent MarketingPost rows for dispatch audit workflows.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const { searchParams } = new URL(request.url)
    const limitRaw = Number(searchParams.get('limit') || 20)
    const offsetRaw = Number(searchParams.get('offset') || 0)
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(Math.trunc(limitRaw), 1), 100)
      : 20
    const offset = Number.isFinite(offsetRaw)
      ? Math.max(Math.trunc(offsetRaw), 0)
      : 0
    const channel = (searchParams.get('channel') || '').trim().toUpperCase()
    const status = (searchParams.get('status') || '').trim().toUpperCase()
    const from = (searchParams.get('from') || '').trim()
    const to = (searchParams.get('to') || '').trim()
    const sort = (searchParams.get('sort') || 'created_desc').trim().toLowerCase()

    const where: Record<string, unknown> = { tenantId }
    if (channel && (CHANNELS as readonly string[]).includes(channel)) where.channel = channel
    if (status) where.status = status
    if (from || to) {
      const createdAt: Record<string, Date> = {}
      if (from) {
        const fromDate = new Date(`${from}T00:00:00.000Z`)
        if (!Number.isNaN(fromDate.getTime())) createdAt.gte = fromDate
      }
      if (to) {
        const toDate = new Date(`${to}T23:59:59.999Z`)
        if (!Number.isNaN(toDate.getTime())) createdAt.lte = toDate
      }
      if (Object.keys(createdAt).length > 0) where.createdAt = createdAt
    }

    const orderBy =
      sort === 'created_asc'
        ? ({ createdAt: 'asc' } as const)
        : ({ createdAt: 'desc' } as const)

    const total = await prisma.marketingPost.count({ where })
    const posts = await prisma.marketingPost.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      select: {
        id: true,
        channel: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        scheduledFor: true,
      },
    })

    return NextResponse.json({
      posts: posts.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        scheduledFor: p.scheduledFor ? p.scheduledFor.toISOString() : null,
      })),
      count: posts.length,
      total,
      limit,
      offset,
      sort: sort === 'created_asc' ? 'created_asc' : 'created_desc',
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get social posts error:', error)
    return NextResponse.json({ error: 'Failed to load social posts' }, { status: 500 })
  }
}

/**
 * POST /api/social/posts
 * Creates MarketingPost rows per channel and enqueues social-post-dispatch jobs.
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const body = await request.json()
    const validated = createPostsSchema.parse(body)

    if (validated.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Tenant mismatch' }, { status: 403 })
    }

    // API-level compliance enforcement (do not rely on UI-only checks).
    const allMediaIds = Array.from(
      new Set(
        Object.values(validated.mediaIdsByChannel ?? {})
          .flat()
          .filter(Boolean)
      )
    )
    const mediaMap = new Map<
      string,
      { id: string; mimeType: string; width: number | null; height: number | null }
    >()
    if (allMediaIds.length > 0) {
      const media = await prisma.mediaLibrary.findMany({
        where: { tenantId, id: { in: allMediaIds } },
        select: { id: true, mimeType: true, width: true, height: true },
      })
      for (const m of media) mediaMap.set(m.id, m)
    }

    const complianceErrors: string[] = []
    for (const channel of validated.channels) {
      const content = (validated.contentByChannel[channel] ?? '').trim()
      if (!content) {
        complianceErrors.push(`${channel}: content is required.`)
        continue
      }

      const limit = CHANNEL_TEXT_LIMITS[channel]
      if (content.length > limit) {
        complianceErrors.push(
          `${channel}: text length ${content.length} exceeds max ${limit}.`
        )
      }

      const channelMedia = (validated.mediaIdsByChannel?.[channel] ?? [])
        .map((id) => mediaMap.get(id))
        .filter(Boolean) as Array<{
        id: string
        mimeType: string
        width: number | null
        height: number | null
      }>

      if (channel === 'YOUTUBE') {
        const hasVideo = channelMedia.some((m) =>
          String(m.mimeType || '').toLowerCase().startsWith('video/')
        )
        if (!hasVideo) {
          complianceErrors.push(
            'YOUTUBE: at least one video asset is required. Generate or upload a video before posting.'
          )
        }
      }

      const imageRule = CHANNEL_IMAGE_RULES[channel]
      if (imageRule) {
        const imageAssets = channelMedia.filter((m) =>
          String(m.mimeType || '').toLowerCase().startsWith('image/')
        )
        for (const img of imageAssets) {
          if (img.width == null || img.height == null) continue
          if (
            img.width < imageRule.minWidth ||
            img.height < imageRule.minHeight ||
            img.width > imageRule.maxWidth ||
            img.height > imageRule.maxHeight
          ) {
            complianceErrors.push(
              `${channel}: image ${img.width}x${img.height} is outside allowed range ${imageRule.minWidth}x${imageRule.minHeight} to ${imageRule.maxWidth}x${imageRule.maxHeight}.`
            )
          }
        }
      }
    }

    if (complianceErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Channel compliance validation failed',
          details: complianceErrors,
        },
        { status: 400 }
      )
    }

    // Connector preflight checks to fail early with actionable guidance.
    const preflightErrors: string[] = []
    const selected = new Set(validated.channels)

    if (selected.has('EMAIL')) {
      const sender = await prisma.emailAccount.findFirst({
        where: { tenantId, isActive: true },
        select: { id: true },
      })
      if (!sender) {
        preflightErrors.push('EMAIL: no active email sender account configured.')
      }
    }

    if (selected.has('WHATSAPP')) {
      const waha = await (prisma as any).tenantWahaSettings.findUnique({
        where: { tenantId },
        select: { isConfigured: true, baseUrl: true, apiKeyEnc: true },
      })
      if (!waha?.isConfigured || !waha?.baseUrl || !waha?.apiKeyEnc) {
        preflightErrors.push('WHATSAPP: WAHA settings are not configured.')
      }
    }

    if (selected.has('SMS')) {
      const telephony = await (prisma as any).tenantTelephonySettings.findUnique({
        where: { tenantId },
        select: {
          isConfigured: true,
          provider: true,
          accountSid: true,
          authTokenEnc: true,
          fromNumber: true,
        },
      })
      if (
        !telephony?.isConfigured ||
        !telephony?.provider ||
        telephony.provider === 'none' ||
        !telephony.accountSid ||
        !telephony.authTokenEnc ||
        !telephony.fromNumber
      ) {
        preflightErrors.push('SMS: telephony provider (Twilio/Exotel) is not fully configured.')
      }
    }

    const socialProviders: Array<{
      channel: (typeof CHANNELS)[number]
      provider: 'linkedin' | 'facebook' | 'instagram' | 'twitter'
      scopeHint?: string
    }> = [
      { channel: 'LINKEDIN', provider: 'linkedin', scopeHint: 'w_member_social' },
      { channel: 'FACEBOOK', provider: 'facebook' },
      { channel: 'INSTAGRAM', provider: 'instagram' },
      { channel: 'TWITTER', provider: 'twitter', scopeHint: 'tweet.write' },
    ]
    for (const item of socialProviders) {
      if (!selected.has(item.channel)) continue
      const integ = await prisma.oAuthIntegration.findFirst({
        where: { tenantId, provider: item.provider, isActive: true },
        select: { id: true, accessToken: true, expiresAt: true, scope: true },
      })
      if (!integ?.accessToken) {
        preflightErrors.push(`${item.channel}: ${item.provider} is not connected.`)
        continue
      }
      if (integ.expiresAt && integ.expiresAt.getTime() <= Date.now()) {
        preflightErrors.push(`${item.channel}: ${item.provider} token is expired. Reconnect.`)
      }
      if (
        item.scopeHint &&
        integ.scope &&
        !String(integ.scope).toLowerCase().includes(item.scopeHint.toLowerCase())
      ) {
        preflightErrors.push(
          `${item.channel}: token is missing required scope ${item.scopeHint}. Reconnect with posting permissions.`
        )
      }
    }

    if (selected.has('TWITTER')) {
      const twitterMediaIds = validated.mediaIdsByChannel?.TWITTER ?? []
      if (twitterMediaIds.length > 0) {
        const media = await prisma.mediaLibrary.findMany({
          where: { tenantId, id: { in: twitterMediaIds } },
          select: { id: true, mimeType: true },
        })
        const nonSupported = media.filter((m) => {
          const mime = String(m.mimeType || '').toLowerCase()
          return !mime.startsWith('image/') && !mime.startsWith('video/')
        })
        if (nonSupported.length > 0) {
          preflightErrors.push(
            'TWITTER: only image/video assets are supported. Remove unsupported media types.'
          )
        }
        const videoCount = media.filter((m) =>
          String(m.mimeType || '').toLowerCase().startsWith('video/')
        ).length
        if (videoCount > 1) {
          preflightErrors.push(
            'TWITTER: only one video is supported per post. Keep a single video asset.'
          )
        }
        const hasAnySupported = media.some((m) => {
          const mime = String(m.mimeType || '').toLowerCase()
          return mime.startsWith('image/') || mime.startsWith('video/')
        })
        if (!hasAnySupported) {
          preflightErrors.push(
            'TWITTER: add at least one image or one video asset, or remove media.'
          )
        }
        const mixedImagesAndVideo =
          videoCount > 0 &&
          media.some((m) => String(m.mimeType || '').toLowerCase().startsWith('image/'))
        if (mixedImagesAndVideo) {
          preflightErrors.push(
            'TWITTER: do not mix image and video in one post. Use either one video or up to four images.'
          )
        }
      }
    }

    if (selected.has('INSTAGRAM')) {
      const igAccount = await prisma.socialMediaAccount.findFirst({
        where: {
          tenantId,
          platform: { equals: 'instagram', mode: 'insensitive' },
          isConnected: true,
          accountId: { not: null },
        },
        select: { id: true },
      })
      if (!igAccount) {
        preflightErrors.push(
          'INSTAGRAM: connected Instagram business account/page mapping is missing.'
        )
      }
    }

    if (selected.has('YOUTUBE')) {
      const youtubeIntegration = await prisma.oAuthIntegration.findFirst({
        where: {
          tenantId,
          provider: { in: ['youtube', 'google'] },
          isActive: true,
        },
        orderBy: { updatedAt: 'desc' },
        select: { accessToken: true, expiresAt: true, scope: true },
      })
      if (!youtubeIntegration?.accessToken) {
        preflightErrors.push('YOUTUBE: account is not connected.')
      } else {
        if (youtubeIntegration.expiresAt && youtubeIntegration.expiresAt.getTime() <= Date.now()) {
          preflightErrors.push('YOUTUBE: access token is expired. Reconnect.')
        }
        const scope = String(youtubeIntegration.scope || '')
        if (
          scope &&
          !scope.toLowerCase().includes('youtube.upload') &&
          !scope.toLowerCase().includes('youtube.force-ssl')
        ) {
          preflightErrors.push(
            'YOUTUBE: token is missing upload scope (youtube.upload). Reconnect with publishing permissions.'
          )
        }
      }
    }

    if (preflightErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Connector preflight failed',
          details: preflightErrors,
        },
        { status: 400 }
      )
    }

    const scheduledFor = validated.sendNow ? null : (validated.scheduledFor ?? null)
    const status = validated.sendNow ? 'SCHEDULED' : (scheduledFor ? 'SCHEDULED' : 'DRAFT')

    const created: { id: string; channel: string }[] = []

    for (const channel of validated.channels) {
      const content = validated.contentByChannel[channel] ?? ''
      const mediaIds = validated.mediaIdsByChannel?.[channel] ?? []

      const post = await prisma.marketingPost.create({
        data: {
          tenantId: validated.tenantId,
          channel,
          content,
          mediaIds,
          scheduledFor,
          status,
          segmentId: validated.segmentId ?? undefined,
          metadata: validated.goal ? { goal: validated.goal } : undefined,
        },
      })
      created.push({ id: post.id, channel })

      if (status === 'SCHEDULED') {
        const delayMs = validated.sendNow ? 0 : (scheduledFor ? Math.max(0, new Date(scheduledFor).getTime() - Date.now()) : 0)
        await (mediumPriorityQueue as any).add({ marketingPostId: post.id }, { delay: delayMs })
      }
    }

    return NextResponse.json({ created, count: created.length }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Create social posts error:', error)
    return NextResponse.json({ error: 'Failed to create posts' }, { status: 500 })
  }
}
