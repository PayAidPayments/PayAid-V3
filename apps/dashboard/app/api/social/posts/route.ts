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
