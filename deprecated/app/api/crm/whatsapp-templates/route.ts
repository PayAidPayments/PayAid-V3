/**
 * Phase A4: CRM WhatsApp message templates (tenant-scoped).
 * GET /api/crm/whatsapp-templates - List
 * POST /api/crm/whatsapp-templates - Create
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { z } from 'zod'

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
    console.error('List CRM WhatsApp templates error:', e)
    return NextResponse.json({ error: 'Failed to list templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const { name, category, body: templateBody } = createSchema.parse(body)
    const template = await prisma.crmWhatsappTemplate.create({
      data: { tenantId, name, category: category || null, body: templateBody },
    })
    return NextResponse.json(template, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    console.error('Create CRM WhatsApp template error:', e)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
