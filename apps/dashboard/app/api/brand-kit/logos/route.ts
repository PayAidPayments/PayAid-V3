import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'

const setPrimarySchema = z.object({
  mediaLibraryId: z.string().min(1),
})

// GET /api/brand-kit/logos - list brand-kit logo assets
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [tenant, logos] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: { logo: true },
      }),
      prisma.mediaLibrary.findMany({
        where: {
          tenantId: user.tenantId,
          category: 'BRAND_KIT_LOGO',
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ])

    return NextResponse.json({
      logos: logos.map((item) => ({
        ...item,
        isPrimary: !!tenant?.logo && tenant.logo === item.fileUrl,
      })),
    })
  } catch (error) {
    console.error('Brand kit logos GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch brand kit logos' }, { status: 500 })
  }
}

// POST /api/brand-kit/logos - set primary logo from media library
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = setPrimarySchema.parse(body)

    const media = await prisma.mediaLibrary.findFirst({
      where: {
        id: validated.mediaLibraryId,
        tenantId: user.tenantId,
        category: 'BRAND_KIT_LOGO',
      },
      select: {
        id: true,
        fileUrl: true,
      },
    })

    if (!media) {
      return NextResponse.json({ error: 'Brand kit logo not found' }, { status: 404 })
    }

    await prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        logo: media.fileUrl,
      },
    })

    return NextResponse.json({
      success: true,
      primaryLogoUrl: media.fileUrl,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Brand kit logos POST error:', error)
    return NextResponse.json({ error: 'Failed to set primary logo' }, { status: 500 })
  }
}

