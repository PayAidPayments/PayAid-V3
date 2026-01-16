import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/ai-influencer/videos/[id]
 * Get video status and details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let payload
    try {
      payload = verifyToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    if (!payload.tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const video = await prisma.aIInfluencerVideo.findFirst({
      where: {
        id: params.id,
        tenantId: payload.tenantId,
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        script: {
          select: {
            id: true,
            productName: true,
            variations: true,
            selectedVariation: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return NextResponse.json({ video })
  } catch (error: any) {
    console.error('Error fetching video:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video', details: error.message },
      { status: 500 }
    )
  }
}

