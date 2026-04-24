import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

const updateSalesPageSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  pageType: z
    .enum([
      'lead_capture',
      'offer',
      'appointment_booking',
      'proposal_acceptance',
      'payment_cta',
      'event_registration',
      'gated_download',
    ])
    .optional(),
  goalType: z.enum(['form_submit', 'booking', 'payment', 'whatsapp', 'call', 'download']).optional(),
  schemaJson: z.record(z.any()).optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'sales')
    const { id } = await params
    const pageItem = await prisma.landingPage.findFirst({ where: { id, tenantId } })

    if (!pageItem) {
      return NextResponse.json({ error: 'Sales page not found' }, { status: 404 })
    }

    const content = (pageItem.contentJson as Record<string, any> | null) ?? {}
    return NextResponse.json({
      id: pageItem.id,
      name: pageItem.name,
      slug: pageItem.slug,
      status: pageItem.status,
      pageType: content.pageType ?? 'lead_capture',
      goalType: content.goalType ?? 'form_submit',
      schemaJson: content.schema ?? {},
      metaTitle: pageItem.metaTitle,
      metaDescription: pageItem.metaDescription,
      views: pageItem.views,
      conversions: pageItem.conversions,
      conversionRate: pageItem.conversionRate,
      createdAt: pageItem.createdAt,
      updatedAt: pageItem.updatedAt,
      compatibility: { mode: 'landing-page-bridge' },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get sales page error:', error)
    return NextResponse.json({ error: 'Failed to get sales page' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'sales')
    const { id } = await params
    const body = await request.json()
    const validated = updateSalesPageSchema.parse(body)

    const existing = await prisma.landingPage.findFirst({ where: { id, tenantId } })
    if (!existing) {
      return NextResponse.json({ error: 'Sales page not found' }, { status: 404 })
    }

    if (validated.slug && validated.slug !== existing.slug) {
      const slugExists = await prisma.landingPage.findUnique({ where: { slug: validated.slug } })
      if (slugExists && slugExists.id !== id) {
        return NextResponse.json({ error: 'Slug already taken' }, { status: 400 })
      }
    }

    const prevContent = (existing.contentJson as Record<string, any> | null) ?? {}
    const nextContent = {
      ...prevContent,
      ...(validated.pageType ? { pageType: validated.pageType } : {}),
      ...(validated.goalType ? { goalType: validated.goalType } : {}),
      ...(validated.schemaJson ? { schema: validated.schemaJson } : {}),
    }

    const updated = await prisma.landingPage.update({
      where: { id },
      data: {
        name: validated.name,
        slug: validated.slug,
        status: validated.status,
        metaTitle: validated.metaTitle,
        metaDescription: validated.metaDescription,
        contentJson: nextContent,
      },
    })

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      status: updated.status,
      pageType: nextContent.pageType ?? 'lead_capture',
      goalType: nextContent.goalType ?? 'form_submit',
      updatedAt: updated.updatedAt,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Update sales page error:', error)
    return NextResponse.json({ error: 'Failed to update sales page' }, { status: 500 })
  }
}
