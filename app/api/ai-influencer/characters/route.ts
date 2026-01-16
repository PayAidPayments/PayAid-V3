import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/ai-influencer/characters
 * Get all characters for the current tenant
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

    const searchParams = request.nextUrl.searchParams
    const campaignId = searchParams.get('campaignId')
    const industry = searchParams.get('industry')

    const where: any = {
      tenantId: payload.tenantId,
    }

    if (campaignId) {
      where.campaignId = campaignId
    }

    if (industry) {
      where.industry = industry
    }

    const characters = await prisma.aIInfluencerCharacter.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        industry: true,
        gender: true,
        ageRange: true,
        imageUrl: true,
        driveFileId: true,
        usageCount: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ characters })
  } catch (error: any) {
    console.error('Error fetching characters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch characters', details: error.message },
      { status: 500 }
    )
  }
}

