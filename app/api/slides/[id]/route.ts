import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/slides/[id]
 * Get a specific presentation
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
    const presentation = await prisma.presentation.findFirst({
      where: {
        id,
        tenantId: payload.tenantId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!presentation) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 })
    }

    return NextResponse.json(presentation)
  } catch (error: any) {
    console.error('Error fetching presentation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch presentation', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/slides/[id]
 * Update a presentation
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

    if (!payload.tenantId || !payload.userId) {
      return NextResponse.json({ error: 'Tenant or user not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, slides, theme, settings } = body

    const { id } = await params
    
    // Get current presentation to create version
    const currentPresentation = await prisma.presentation.findFirst({
      where: {
        id,
        tenantId: payload.tenantId,
      },
    })

    if (!currentPresentation) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 })
    }

    // Create version before updating
    await prisma.presentationVersion.create({
      data: {
        presentationId: id,
        version: currentPresentation.version,
        slides: (currentPresentation.slides as any),
        createdById: payload.userId,
      },
    })

    // Update presentation
    const updatedPresentation = await prisma.presentation.update({
      where: { id },
      data: {
        name: name !== undefined ? name : currentPresentation.name,
        description: description !== undefined ? description : currentPresentation.description,
        slides: slides !== undefined ? slides : currentPresentation.slides,
        theme: theme !== undefined ? theme : currentPresentation.theme,
        settings: settings !== undefined ? settings : currentPresentation.settings,
        version: { increment: 1 },
        updatedById: payload.userId,
      },
    })

    return NextResponse.json(updatedPresentation)
  } catch (error: any) {
    console.error('Error updating presentation:', error)
    return NextResponse.json(
      { error: 'Failed to update presentation', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/slides/[id]
 * Delete a presentation
 */
export async function DELETE(
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
    await prisma.presentation.delete({
      where: {
        id,
        tenantId: payload.tenantId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting presentation:', error)
    return NextResponse.json(
      { error: 'Failed to delete presentation', details: error.message },
      { status: 500 }
    )
  }
}

