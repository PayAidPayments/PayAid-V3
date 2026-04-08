/**
 * Phase A4: CRM WhatsApp message templates (tenant-scoped).
 * GET /api/crm/whatsapp-templates - List
 * POST /api/crm/whatsapp-templates - Create
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { findIdempotentRequest, markIdempotentRequest } from '@/lib/ai-native/m0-service'

const createSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  body: z.string().min(1),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const templates = await prisma.crmWhatsappTemplate.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ templates })
  } catch (e) {
    if (e && typeof e === 'object' && 'moduleId' in e) {
      return handleLicenseError(e)
    }
    console.error('List CRM WhatsApp templates error:', e)
    return NextResponse.json({ error: 'Failed to list templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const idempotencyKey = request.headers.get('x-idempotency-key')?.trim()
    if (idempotencyKey) {
      const existing = await findIdempotentRequest(tenantId, `crm:whatsapp_template:create:${idempotencyKey}`)
      const existingTemplateId = (existing?.afterSnapshot as { template_id?: string } | null)?.template_id
      if (existing && existingTemplateId) {
        return NextResponse.json({ id: existingTemplateId, deduplicated: true }, { status: 200 })
      }
    }

    const body = await request.json()
    const { name, category, body: templateBody } = createSchema.parse(body)
    const template = await prisma.crmWhatsappTemplate.create({
      data: { tenantId, name, category: category || null, body: templateBody },
    })

    if (idempotencyKey) {
      await markIdempotentRequest(tenantId, userId, `crm:whatsapp_template:create:${idempotencyKey}`, {
        template_id: template.id,
      })
    }

    return NextResponse.json(template, { status: 201 })
  } catch (e) {
    if (e && typeof e === 'object' && 'moduleId' in e) {
      return handleLicenseError(e)
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    console.error('Create CRM WhatsApp template error:', e)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
