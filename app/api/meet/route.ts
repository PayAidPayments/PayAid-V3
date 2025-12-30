import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { randomBytes } from 'crypto'

/**
 * GET /api/meet
 * Get all meetings for the current tenant
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
    const status = searchParams.get('status')

    const where: any = {
      tenantId: payload.tenantId,
    }

    if (status) {
      where.status = status
    }

    const meetings = await prisma.meeting.findMany({
      where,
      orderBy: { startTime: 'desc' },
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

    return NextResponse.json({ meetings })
  } catch (error: any) {
    console.error('Error fetching meetings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meetings', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/meet
 * Create a new meeting
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
      return NextResponse.json({ error: 'Tenant or user not found' }, { status: 404 })
    }

    const body = await request.json()
    const { title, description, startTime, endTime, isInstant } = body

    // Generate unique meeting code
    const meetingCode = randomBytes(4).toString('hex').toUpperCase()

    const meeting = await prisma.meeting.create({
      data: {
        tenantId: payload.tenantId,
        title: title || 'New Meeting',
        description: description || null,
        meetingCode,
        startTime: isInstant ? new Date() : (startTime ? new Date(startTime) : new Date()),
        endTime: endTime ? new Date(endTime) : null,
        status: isInstant ? 'in-progress' : 'scheduled',
        hostId: payload.userId,
        createdById: payload.userId,
      },
    })

    return NextResponse.json(meeting, { status: 201 })
  } catch (error: any) {
    console.error('Error creating meeting:', error)
    return NextResponse.json(
      { error: 'Failed to create meeting', details: error.message },
      { status: 500 }
    )
  }
}

