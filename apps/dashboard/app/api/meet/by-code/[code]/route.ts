import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/meet/by-code/[code]
 * Get meeting by code (for join link)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
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
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    if (!payload.tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const { code } = await params
    const meeting = await prisma.meeting.findFirst({
      where: {
        meetingCode: (code || '').toUpperCase(),
        tenantId: payload.tenantId,
      },
      include: {
        host: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    return NextResponse.json(meeting)
  } catch (error: any) {
    console.error('Error fetching meeting by code:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meeting', details: error.message },
      { status: 500 }
    )
  }
}
