import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createCampaignSchema = z.object({
  name: z.string().optional(),
  industry: z.string().optional(),
})

/**
 * POST /api/ai-influencer/campaigns
 * Create a new AI influencer campaign
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

    if (!payload.tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = createCampaignSchema.parse(body)

    const campaign = await prisma.aIInfluencerCampaign.create({
      data: {
        tenantId: payload.tenantId,
        name: validated.name || `Campaign ${new Date().toLocaleDateString()}`,
        industry: validated.industry,
      },
    })

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Campaign creation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create campaign',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ai-influencer/campaigns
 * Get all campaigns for the current tenant
 */
export async function GET(request: NextRequest) {
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

    const campaigns = await prisma.aIInfluencerCampaign.findMany({
      where: { tenantId: payload.tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            characters: true,
            scripts: true,
            videos: true,
          },
        },
      },
    })

    return NextResponse.json({ campaigns })
  } catch (error: any) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns', details: error.message },
      { status: 500 }
    )
  }
}

