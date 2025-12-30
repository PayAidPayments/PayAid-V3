import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

/**
 * PATCH /api/news/[id]/dismiss
 * Dismiss a news item (hide it from view)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const tenantId = payload.tenantId

    const { id } = await params

    // First check if the news item exists and belongs to this tenant or is general
    const newsItem = await prisma.newsItem.findFirst({
      where: {
        id,
        OR: [
          { tenantId },
          { tenantId: null }, // Can dismiss general news
        ],
      },
    })

    if (!newsItem) {
      return NextResponse.json(
        { error: 'News item not found' },
        { status: 404 }
      )
    }

    // Update the news item
    const updated = await prisma.newsItem.update({
      where: { id },
      data: {
        isDismissed: true,
        dismissedAt: new Date(),
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error dismissing news:', error)
    
    // Handle Prisma database connection errors
    if (error?.code?.startsWith('P1') || error?.message?.includes('connection')) {
      return NextResponse.json(
        {
          error: 'Database connection failed',
          details: error.message,
          code: error.code,
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      {
        error: 'Failed to dismiss news',
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

