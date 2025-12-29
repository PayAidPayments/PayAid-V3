import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

// GET /api/knowledge/documents/[id] - Get document details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    const { id } = await params

    const document = await prisma.knowledgeDocument.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        _count: {
          select: {
            chunks: true,
            queries: true,
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(document)
  } catch (error: any) {
    console.error('Get document error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get document' },
      { status: 500 }
    )
  }
}

// DELETE /api/knowledge/documents/[id] - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    const { id } = await params

    const document = await prisma.knowledgeDocument.findFirst({
      where: {
        id,
        tenantId,
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    await prisma.knowledgeDocument.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete document error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete document' },
      { status: 500 }
    )
  }
}

