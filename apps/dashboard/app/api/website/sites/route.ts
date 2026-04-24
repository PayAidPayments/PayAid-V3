import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { createWebsiteSite, findSiteBySlug, listWebsiteSites } from '@/lib/website-builder/repository'

const createWebsiteSiteSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  goalType: z
    .enum([
      'lead_generation',
      'appointment_booking',
      'local_presence',
      'campaign_microsite',
      'service_showcase',
    ])
    .default('lead_generation'),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  schemaJson: z.record(z.any()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'sales')
    const status = request.nextUrl.searchParams.get('status')
    const goalType = request.nextUrl.searchParams.get('goalType')
    const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') ?? '1') || 1)
    const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('limit') ?? '25') || 25))
    const skip = (page - 1) * limit

    const result = await listWebsiteSites({ tenantId, status, goalType, page, limit })

    return NextResponse.json({
      sites: result.rows,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / limit)),
      },
      compatibility: {
        mode: result.mode,
        note:
          result.mode === 'canonical'
            ? 'Backed by canonical website_* tables.'
            : 'Backed by LandingPage until canonical website_* tables are live.',
      },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) return handleLicenseError(error)
    console.error('Get website sites error:', error)
    return NextResponse.json({ error: 'Failed to get website sites' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'sales')
    const body = await request.json()
    const validated = createWebsiteSiteSchema.parse(body)

    const existing = await findSiteBySlug(validated.slug)
    if (existing) return NextResponse.json({ error: 'Slug already taken' }, { status: 400 })

    const created = await createWebsiteSite({
      tenantId,
      name: validated.name,
      slug: validated.slug,
      goalType: validated.goalType,
      metaTitle: validated.metaTitle,
      metaDescription: validated.metaDescription,
      schemaJson: validated.schemaJson,
    })

    return NextResponse.json(
      {
        id: created.record.id,
        name: created.record.name,
        slug: created.record.slug,
        status: created.record.status,
        goalType: validated.goalType,
        createdAt: created.record.createdAt,
        compatibility: { mode: created.mode },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    if (error && typeof error === 'object' && 'moduleId' in error) return handleLicenseError(error)
    console.error('Create website site error:', error)
    return NextResponse.json({ error: 'Failed to create website site' }, { status: 500 })
  }
}
