import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/documents/[id]
 * Get a specific document
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
    const document = await prisma.document.findFirst({
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
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json(document)
  } catch (error: any) {
    console.error('Error fetching document:', error)
    return NextResponse.json(
      { error: 'Failed to fetch document', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/documents/[id]
 * Update a document
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
    const { name, description, content, htmlContent } = body

    const { id } = await params
    
    // Get current document to create version
    const currentDocument = await prisma.document.findFirst({
      where: {
        id,
        tenantId: payload.tenantId,
      },
    })

    if (!currentDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Create version before updating
    await prisma.documentVersion.create({
      data: {
        documentId: id,
        version: currentDocument.version,
        content: currentDocument.content as any,
        htmlContent: currentDocument.htmlContent,
        createdById: payload.userId,
      },
    })

    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        name: name !== undefined ? name : currentDocument.name,
        description: description !== undefined ? description : currentDocument.description,
        content: content !== undefined ? content : currentDocument.content,
        htmlContent: htmlContent !== undefined ? htmlContent : currentDocument.htmlContent,
        version: { increment: 1 },
        updatedById: payload.userId,
      },
    })

    return NextResponse.json(updatedDocument)
  } catch (error: any) {
    console.error('Error updating document:', error)
    return NextResponse.json(
      { error: 'Failed to update document', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/documents/[id]
 * Delete a document
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
    await prisma.document.delete({
      where: {
        id,
        tenantId: payload.tenantId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document', details: error.message },
      { status: 500 }
    )
  }
}

