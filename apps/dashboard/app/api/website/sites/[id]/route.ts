import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { getWebsiteSiteById, updateWebsiteSiteById, findSiteBySlug } from '@/lib/website-builder/repository'
import { validateWebsitePageTree } from '@/lib/website-builder/page-tree-validation'

const updateWebsiteSiteSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  goalType: z
    .enum([
      'lead_generation',
      'appointment_booking',
      'local_presence',
      'campaign_microsite',
      'service_showcase',
    ])
    .optional(),
  schemaJson: z.record(z.any()).optional(),
  pageTree: z.array(z.record(z.any())).optional(),
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
    const result = await getWebsiteSiteById(tenantId, id)
    if (!result.site) return NextResponse.json({ error: 'Website site not found' }, { status: 404 })
    return NextResponse.json({ ...result.site, compatibility: { mode: result.mode } })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) return handleLicenseError(error)
    console.error('Get website site error:', error)
    return NextResponse.json({ error: 'Failed to get website site' }, { status: 500 })
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
    const validated = updateWebsiteSiteSchema.parse(body)
    if (validated.pageTree) {
      const pageTreeErrors = validateWebsitePageTree(validated.pageTree)
      if (pageTreeErrors.length > 0) {
        return NextResponse.json(
          {
            error: 'Invalid page tree payload',
            details: pageTreeErrors,
          },
          { status: 400 }
        )
      }
    }

    const existing = await getWebsiteSiteById(tenantId, id)
    if (!existing.site) return NextResponse.json({ error: 'Website site not found' }, { status: 404 })

    if (validated.slug && validated.slug !== existing.site.slug) {
      const slugExists = await findSiteBySlug(validated.slug)
      if (slugExists && slugExists.id !== id) {
        return NextResponse.json({ error: 'Slug already taken' }, { status: 400 })
      }
    }

    const updated = await updateWebsiteSiteById(tenantId, id, validated)
    if (!updated.record) return NextResponse.json({ error: 'Website site not found' }, { status: 404 })

    return NextResponse.json({
      id: updated.record.id,
      name: updated.record.name,
      slug: updated.record.slug,
      status: updated.record.status,
      goalType: validated.goalType ?? existing.site.goalType,
      normalizedPageTree: Boolean(validated.pageTree),
      updatedAt: updated.record.updatedAt,
      compatibility: { mode: updated.mode },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    if (error && typeof error === 'object' && 'moduleId' in error) return handleLicenseError(error)
    console.error('Update website site error:', error)
    return NextResponse.json({ error: 'Failed to update website site' }, { status: 500 })
  }
}
