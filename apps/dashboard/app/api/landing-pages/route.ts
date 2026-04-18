import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { dbOverloadResponse, isTransientDbOverloadError } from '@/lib/api/db-overload'

const createLandingPageSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  contentJson: z.record(z.any()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
})

// GET /api/landing-pages - List all landing pages
export async function GET(request: NextRequest) {
  try {
    // Check crm module license
    const { tenantId, userId } = await requireModuleAccess(request, 'sales')

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const pageParam = Number(searchParams.get('page') || '1')
    const limitParam = Number(searchParams.get('limit') || '25')
    const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(Math.floor(limitParam), 1), 100) : 25
    const skip = (page - 1) * limit

    const where: any = {
      tenantId: tenantId,
    }

    if (status) where.status = status

    const [pages, total] = await Promise.all([
      prisma.landingPage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          metaTitle: true,
          metaDescription: true,
          createdAt: true,
        },
      }),
      prisma.landingPage.count({ where }),
    ])

    return NextResponse.json({
      pages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    })
  } catch (error) {
    console.error('Get landing pages error:', error)
    return NextResponse.json(
      { error: 'Failed to get landing pages' },
      { status: 500 }
    )
  }
}

// POST /api/landing-pages - Create landing page
export async function POST(request: NextRequest) {
  try {
    // Check crm module license
    const { tenantId, userId } = await requireModuleAccess(request, 'sales')

    const body = await request.json()
    const validated = createLandingPageSchema.parse(body)

    // Check if slug exists
    const existing = await prisma.landingPage.findUnique({
      where: { slug: validated.slug },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Slug already taken' },
        { status: 400 }
      )
    }

    const page = await prisma.landingPage.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        contentJson: validated.contentJson || {},
        metaTitle: validated.metaTitle,
        metaDescription: validated.metaDescription,
        status: 'DRAFT',
        tenantId: tenantId,
      },
    })

    return NextResponse.json(page, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    if (isTransientDbOverloadError(error)) {
      return dbOverloadResponse('Landing page')
    }

    console.error('Create landing page error:', error)
    return NextResponse.json(
      { error: 'Failed to create landing page' },
      { status: 500 }
    )
  }
}
