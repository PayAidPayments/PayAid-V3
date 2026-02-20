import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const updateWebhookSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

/** DELETE /api/developer/webhooks/[id] - Delete webhook */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params

    const existing = await prisma.webhook.findFirst({
      where: { id, tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    await prisma.webhook.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to delete webhook' },
      { status: 500 }
    )
  }
}

/** PUT /api/developer/webhooks/[id] - Update webhook */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params
    const body = await request.json()
    const validated = updateWebhookSchema.parse(body)

    const existing = await prisma.webhook.findFirst({
      where: { id, tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    const update: Record<string, unknown> = {}
    if (validated.url !== undefined) update.url = validated.url
    if (validated.events !== undefined) update.events = validated.events
    if (validated.description !== undefined) update.description = validated.description
    if (validated.isActive !== undefined) update.isActive = validated.isActive

    const webhook = await prisma.webhook.update({
      where: { id },
      data: update as any,
    })

    return NextResponse.json({ webhook })
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
      { error: e instanceof Error ? e.message : 'Failed to update webhook' },
      { status: 500 }
    )
  }
}
