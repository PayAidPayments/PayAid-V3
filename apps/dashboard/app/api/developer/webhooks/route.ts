import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { randomBytes } from 'crypto'
import { z } from 'zod'

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  description: z.string().optional(),
})

const AVAILABLE_EVENTS = [
  'contact.created',
  'contact.updated',
  'deal.created',
  'deal.updated',
  'deal.stage_changed',
  'invoice.created',
  'invoice.paid',
  'invoice.overdue',
  'workflow.executed',
] as const

/** GET /api/developer/webhooks - List webhooks */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    
    const webhooks = await prisma.webhook.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ webhooks })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to list webhooks' },
      { status: 500 }
    )
  }
}

/** POST /api/developer/webhooks - Create webhook */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const validated = createWebhookSchema.parse(body)

    // Validate events
    const invalidEvents = validated.events.filter(e => !AVAILABLE_EVENTS.includes(e as any))
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: `Invalid events: ${invalidEvents.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate webhook secret
    const secret = randomBytes(32).toString('hex')

    const webhook = await prisma.webhook.create({
      data: {
        tenantId,
        url: validated.url,
        events: validated.events,
        secret,
        description: validated.description || null,
        isActive: true,
      },
    })

    return NextResponse.json({
      webhook: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        secret, // Show once
        description: webhook.description,
        isActive: webhook.isActive,
        createdAt: webhook.createdAt,
      },
      warning: 'Save the webhook secret. You will not be able to view it again.',
    }, { status: 201 })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: e.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to create webhook' },
      { status: 500 }
    )
  }
}
