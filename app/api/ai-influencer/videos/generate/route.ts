import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { queueVideoGeneration } from '@/lib/ai-influencer/video-job-processor'
import { z } from 'zod'

const generateVideoSchema = z.object({
  campaignId: z.string(),
  characterId: z.string(),
  scriptId: z.string(),
  style: z.enum(['testimonial', 'demo', 'problem-solution']).optional().default('testimonial'),
  cta: z.string().optional(),
})

/**
 * POST /api/ai-influencer/videos/generate
 * Generate AI influencer video using full pipeline (Phase 2)
 */
export async function POST(request: NextRequest) {
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

    if (!payload.tenantId || !payload.userId) {
      return NextResponse.json(
        { error: 'Tenant or user not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validated = generateVideoSchema.parse(body)

    // Verify all related records exist
    const [campaign, character, script] = await Promise.all([
      prisma.aIInfluencerCampaign.findFirst({
        where: { id: validated.campaignId, tenantId: payload.tenantId },
      }),
      prisma.aIInfluencerCharacter.findFirst({
        where: { id: validated.characterId, tenantId: payload.tenantId },
      }),
      prisma.aIInfluencerScript.findFirst({
        where: { id: validated.scriptId, tenantId: payload.tenantId },
      }),
    ])

    if (!campaign || !character || !script) {
      return NextResponse.json(
        { error: 'Campaign, character, or script not found' },
        { status: 404 }
      )
    }

    // Get selected script variation
    const variations = (script.variations as any) || []
    const selectedVariation = script.selectedVariation !== null 
      ? variations[script.selectedVariation] 
      : variations[0] || { text: 'Sample script', duration: 30 }

    // Create video record with "generating" status
    const video = await prisma.aIInfluencerVideo.create({
      data: {
        tenantId: payload.tenantId,
        campaignId: validated.campaignId,
        characterId: validated.characterId,
        scriptId: validated.scriptId,
        status: 'generating',
        duration: selectedVariation.duration || 30,
      },
    })

    // Queue video generation job
    try {
      const job = await queueVideoGeneration({
        videoId: video.id,
        tenantId: payload.tenantId,
        characterId: validated.characterId,
        scriptId: validated.scriptId,
        style: validated.style,
        cta: validated.cta,
      })

      return NextResponse.json({
        video: {
          id: video.id,
          status: 'generating',
          jobId: job.id,
          message: 'Video generation started. The video will be ready shortly.',
        },
      })
    } catch (queueError) {
      // If queue fails, update video status
      await prisma.aIInfluencerVideo.update({
        where: { id: video.id },
        data: {
          status: 'failed',
          errorMessage: queueError instanceof Error ? queueError.message : 'Failed to queue video generation',
        },
      })

      throw queueError
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Video generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to start video generation',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

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

