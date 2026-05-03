import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/meet/[id]
 * Get a specific meeting
 */
export async function GET(
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

    const { id } = await params
    const meeting = await prisma.meeting.findFirst({
      where: {
        id,
        tenantId: payload.tenantId,
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    return NextResponse.json(meeting)
  } catch (error: any) {
    console.error('Error fetching meeting:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meeting', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/meet/[id]
 * Update a meeting (e.g., end meeting)
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

    const body = await request.json()
    const { status, endTime, recordingUrl, transcript } = body

    const { id } = await params
    const meeting = await prisma.meeting.update({
      where: {
        id,
        tenantId: payload.tenantId,
      },
      data: {
        status: status || undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        recordingUrl: recordingUrl || undefined,
        transcript: transcript || undefined,
      },
    })

    return NextResponse.json(meeting)
  } catch (error: any) {
    console.error('Error updating meeting:', error)
    return NextResponse.json(
      { error: 'Failed to update meeting', details: error.message },
      { status: 500 }
    )
  }
}

