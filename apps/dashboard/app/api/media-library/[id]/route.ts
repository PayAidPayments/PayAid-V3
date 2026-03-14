import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'

const updateMediaSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
})

// GET /api/media-library/[id] - Get single media item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const media = await prisma.mediaLibrary.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
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

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    return NextResponse.json(media)
  } catch (error) {
    console.error('Get media error:', error)
    return NextResponse.json(
      { error: 'Failed to get media' },
      { status: 500 }
    )
  }
}

// PATCH /api/media-library/[id] - Update media metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = updateMediaSchema.parse(body)

    const media = await prisma.mediaLibrary.updateMany({
      where: {
        id,
        tenantId: user.tenantId,
      },
      data: validated,
    })

    if (media.count === 0) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    const updated = await prisma.mediaLibrary.findUnique({
      where: { id },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update media error:', error)
    return NextResponse.json(
      { error: 'Failed to update media' },
      { status: 500 }
    )
  }
}

// DELETE /api/media-library/[id] - Delete media
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const media = await prisma.mediaLibrary.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
    })

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    await prisma.mediaLibrary.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete media error:', error)
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    )
  }
}

