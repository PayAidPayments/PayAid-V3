import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// POST /api/help-center/articles/[id]/view - Track article view (public endpoint)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Increment view count
    await prisma.helpCenterArticle.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Track article view error:', error)
    return NextResponse.json(
      { error: 'Failed to track article view' },
      { status: 500 }
    )
  }
}

