import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'

const createMediaSchema = z.object({
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  fileSize: z.number().int().min(0),
  mimeType: z.string().min(1),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  category: z.string().optional(),
  source: z.string().optional(),
  originalPrompt: z.string().optional(),
})

// GET /api/media-library - Get all media for tenant
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const source = searchParams.get('source')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      tenantId: user.tenantId,
    }

    if (category) {
      where.category = category
    }

    if (source) {
      where.source = source
    }

    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ]
    }

    const [media, total] = await Promise.all([
      prisma.mediaLibrary.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.mediaLibrary.count({ where }),
    ])

    return NextResponse.json({
      media,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Get media library error:', error)
    return NextResponse.json(
      { error: 'Failed to get media library' },
      { status: 500 }
    )
  }
}

// POST /api/media-library - Save image to media library
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createMediaSchema.parse(body)

    // Check tenant storage limits
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { maxStorage: true },
    })

    if (tenant) {
      // Calculate current storage usage
      const currentUsage = await prisma.mediaLibrary.aggregate({
        where: { tenantId: user.tenantId },
        _sum: { fileSize: true },
      })

      const currentSizeMB = (currentUsage._sum.fileSize || 0) / (1024 * 1024)
      const newSizeMB = validated.fileSize / (1024 * 1024)

      if (currentSizeMB + newSizeMB > tenant.maxStorage) {
        return NextResponse.json(
          {
            error: 'Storage limit exceeded',
            message: `You have used ${currentSizeMB.toFixed(2)}MB of ${tenant.maxStorage}MB. This file would exceed your limit.`,
            hint: 'Please delete some files or upgrade your plan.',
          },
          { status: 403 }
        )
      }
    }

    const media = await prisma.mediaLibrary.create({
      data: {
        tenantId: user.tenantId,
        uploadedById: user.id,
        ...validated,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(media, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create media library error:', error)
    return NextResponse.json(
      { error: 'Failed to save to media library' },
      { status: 500 }
    )
  }
}

