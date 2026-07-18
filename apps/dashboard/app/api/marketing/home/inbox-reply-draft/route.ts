import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import {
  buildInboxReplyQuote,
  buildInboxReplyStudioHref,
  parseUnifiedInboxItemId,
  studioChannelForInboxItem,
} from '@/lib/marketing/inbox-reply'
import type { UnifiedInboxItem } from '@/lib/marketing/unified-inbox'

const bodySchema = z.object({
  inboxItemId: z.string().min(1),
  source: z.enum(['social', 'whatsapp', 'email']),
  channel: z.string().min(1),
  entityId: z.string().min(1),
  actorName: z.string().nullable().optional(),
  preview: z.string().nullable().optional(),
  action: z.string().optional(),
})

function marketingChannelLabel(source: z.infer<typeof bodySchema>['source'], channel: string) {
  if (source === 'whatsapp') return 'WHATSAPP'
  if (source === 'email') return 'EMAIL'
  const p = channel.toLowerCase()
  if (p.includes('instagram')) return 'INSTAGRAM'
  if (p.includes('facebook')) return 'FACEBOOK'
  if (p.includes('linkedin')) return 'LINKEDIN'
  if (p.includes('youtube')) return 'YOUTUBE'
  return channel.toUpperCase()
}

/** POST /api/marketing/home/inbox-reply-draft — draft-first reply (MarketingPost DRAFT) */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const body = bodySchema.parse(await request.json())

    const parsed = parseUnifiedInboxItemId(body.inboxItemId)
    if (parsed.entityId !== body.entityId || parsed.source !== body.source) {
      return NextResponse.json({ error: 'Inbox item identity mismatch' }, { status: 400 })
    }

    const quote = buildInboxReplyQuote(body.actorName, body.preview)
    const studioChannel = studioChannelForInboxItem({ source: body.source, channel: body.channel })

    const draft = await prisma.marketingPost.create({
      data: {
        tenantId,
        channel: marketingChannelLabel(body.source, body.channel),
        content: quote.slice(0, 10000),
        status: 'DRAFT',
        metadata: {
          kind: 'inbox_reply_draft',
          replySource: body.source,
          replyToEntityId: body.entityId,
          inboxItemId: body.inboxItemId,
          actorName: body.actorName ?? null,
          originalPreview: body.preview?.slice(0, 500) ?? null,
          originalAction: body.action ?? null,
          studioChannel,
          createdFrom: 'marketing_command_center',
        },
      },
      select: { id: true, channel: true, status: true, createdAt: true },
    })

    const stubItem: UnifiedInboxItem = {
      id: body.inboxItemId,
      source: body.source,
      channel: body.channel,
      action: body.action || 'reply',
      actorName: body.actorName ?? null,
      preview: body.preview ?? null,
      at: new Date().toISOString(),
      requiresResponse: true,
      replyHref: '',
    }

    const studioHref = buildInboxReplyStudioHref(tenantId, stubItem, { draftId: draft.id })

    return NextResponse.json({
      success: true,
      draft,
      studioHref,
    })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Inbox reply draft error:', error)
    return NextResponse.json({ error: 'Failed to create reply draft' }, { status: 500 })
  }
}
