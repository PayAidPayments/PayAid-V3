import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/documents
 * Get all documents for the current tenant
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

    const documents = await prisma.document.findMany({
      where: { tenantId: payload.tenantId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
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

    return NextResponse.json({ documents })
  } catch (error: any) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/documents
 * Create a new document
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
    const { name, description, content, template } = body

    // Initialize content based on template
    let initialContent: any = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Start typing...' }],
        },
      ],
    }

    if (template === 'proposal') {
      initialContent = {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Business Proposal' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Introduction...' }] },
        ],
      }
    }

    const document = await prisma.document.create({
      data: {
        tenantId: payload.tenantId,
        name: name || 'Untitled Document',
        description: description || null,
        content: content || initialContent,
        htmlContent: null,
        createdById: payload.userId,
        updatedById: payload.userId,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error: any) {
    console.error('Error creating document:', error)
    return NextResponse.json(
      { error: 'Failed to create document', details: error.message },
      { status: 500 }
    )
  }
}

