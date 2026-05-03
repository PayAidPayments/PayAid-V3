import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

const createSalesPageSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
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
    .default('lead_capture'),
  goalType: z
    .enum(['form_submit', 'booking', 'payment', 'whatsapp', 'call', 'download'])
    .default('form_submit'),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  schemaJson: z.record(z.any()).optional(),
})

// Canonical sales-pages API (bridge implementation on top of LandingPage).
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'sales')
    const status = request.nextUrl.searchParams.get('status')
    const pageType = request.nextUrl.searchParams.get('pageType')
    const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') ?? '1') || 1)
    const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('limit') ?? '25') || 25))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { tenantId }
    if (status) where.status = status

    const [pages, total] = await Promise.all([
      prisma.landingPage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.landingPage.count({ where }),
    ])

    const canonicalPages = pages
      .map((pageItem) => {
        const content = (pageItem.contentJson as Record<string, any> | null) ?? {}
        const canonicalPageType = content.pageType ?? 'lead_capture'
        if (pageType && canonicalPageType !== pageType) {
          return null
        }
        return {
          id: pageItem.id,
          name: pageItem.name,
          slug: pageItem.slug,
          status: pageItem.status,
          pageType: canonicalPageType,
          goalType: content.goalType ?? 'form_submit',
          views: pageItem.views,
          conversions: pageItem.conversions,
          conversionRate: pageItem.conversionRate,
          createdAt: pageItem.createdAt,
          updatedAt: pageItem.updatedAt,
        }
      })
      .filter(Boolean)

    return NextResponse.json({
      pages: canonicalPages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      compatibility: {
        mode: 'landing-page-bridge',
        note: 'Backed by LandingPage until canonical sales_* tables are live.',
      },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get sales pages error:', error)
    return NextResponse.json({ error: 'Failed to get sales pages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'sales')
    const body = await request.json()
    const validated = createSalesPageSchema.parse(body)

    const existing = await prisma.landingPage.findUnique({ where: { slug: validated.slug } })
    if (existing) {
      return NextResponse.json({ error: 'Slug already taken' }, { status: 400 })
    }

    const created = await prisma.landingPage.create({
      data: {
        tenantId,
        name: validated.name,
        slug: validated.slug,
        status: 'DRAFT',
        metaTitle: validated.metaTitle,
        metaDescription: validated.metaDescription,
        contentJson: {
          pageType: validated.pageType,
          goalType: validated.goalType,
          schema: validated.schemaJson ?? {},
        },
      },
    })

    return NextResponse.json(
      {
        id: created.id,
        name: created.name,
        slug: created.slug,
        status: created.status,
        pageType: validated.pageType,
        goalType: validated.goalType,
        createdAt: created.createdAt,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Create sales page error:', error)
    return NextResponse.json({ error: 'Failed to create sales page' }, { status: 500 })
  }
}
