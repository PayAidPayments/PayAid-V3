import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/slides
 * Get all presentations for the current tenant
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

    const presentations = await prisma.presentation.findMany({
      where: { tenantId: payload.tenantId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        theme: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ presentations })
  } catch (error: any) {
    console.error('Error fetching presentations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch presentations', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/slides
 * Create a new presentation
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
    const { name, description, theme, template } = body

    // Initialize slides based on template
    let initialSlides: any[] = [
      {
        id: '1',
        type: 'title',
        content: {
          title: 'Untitled Presentation',
          subtitle: '',
        },
      },
    ]

    if (template === 'business') {
      initialSlides = [
        {
          id: '1',
          type: 'title',
          content: { title: 'Business Presentation', subtitle: 'Company Name' },
        },
        {
          id: '2',
          type: 'content',
          content: { title: 'Overview', body: 'Add your content here...' },
        },
      ]
    }

    const presentation = await prisma.presentation.create({
      data: {
        tenantId: payload.tenantId,
        name: name || 'Untitled Presentation',
        description: description || null,
        slides: initialSlides,
        theme: theme || 'default',
        createdById: payload.userId,
        updatedById: payload.userId,
      },
    })

    return NextResponse.json(presentation, { status: 201 })
  } catch (error: any) {
    console.error('Error creating presentation:', error)
    return NextResponse.json(
      { error: 'Failed to create presentation', details: error.message },
      { status: 500 }
    )
  }
}

