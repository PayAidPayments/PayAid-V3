/**
 * Phase A4: Render email or WhatsApp template with contact/deal variable substitution.
 * POST /api/crm/templates/render
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { z } from 'zod'
import { substituteVariables } from '@/lib/crm/template-variables'

const bodySchema = z.object({
  channel: z.enum(['email', 'whatsapp']),
  templateId: z.string().min(1),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const { channel, templateId, contactId, dealId } = bodySchema.parse(body)

    let contact: { name?: string; company?: string; email?: string; phone?: string } | null = null
    let deal: { name?: string; value?: number; stage?: string } | null = null

    if (contactId) {
      const c = await prisma.contact.findFirst({
        where: { id: contactId, tenantId },
        select: { name: true, company: true, email: true, phone: true },
      })
      contact = c
        ? {
            name: c.name,
            company: c.company ?? undefined,
            email: c.email ?? undefined,
            phone: c.phone ?? undefined,
          }
        : null
    }

    if (dealId) {
      const d = await prisma.deal.findFirst({
        where: { id: dealId, tenantId },
        select: { name: true, value: true, stage: true },
      })
      deal = d
        ? {
            name: d.name,
            value: d.value ?? undefined,
            stage: d.stage ?? undefined,
          }
        : null
    }

    const ctx = { contact, deal }

    if (channel === 'email') {
      const template = await prisma.emailTemplate.findFirst({
        where: { id: templateId, tenantId, isActive: true },
      })
      if (!template) {
        return NextResponse.json({ error: 'Email template not found' }, { status: 404 })
      }
      const subject = substituteVariables(template.subject, ctx)
      const bodyText = substituteVariables(
        template.textContent || template.htmlContent.replace(/<[^>]*>/g, ' ').trim(),
        ctx
      )
      return NextResponse.json({ subject, body: bodyText })
    }

    if (channel === 'whatsapp') {
      const template = await prisma.crmWhatsappTemplate.findFirst({
        where: { id: templateId, tenantId, isActive: true },
      })
      if (!template) {
        return NextResponse.json({ error: 'WhatsApp template not found' }, { status: 404 })
      }
      const bodyText = substituteVariables(template.body, ctx)
      return NextResponse.json({ body: bodyText })
    }

    return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    console.error('Render template error:', e)
    return NextResponse.json({ error: 'Failed to render template' }, { status: 500 })
  }
}
