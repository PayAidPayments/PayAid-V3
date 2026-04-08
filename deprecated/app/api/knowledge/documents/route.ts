import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createDocumentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['sop', 'policy', 'contract', 'faq', 'compliance', 'other']).optional(),
  tags: z.array(z.string()).default([]),
  fileUrl: z.string().url(),
  fileName: z.string(),
  fileSize: z.number(),
  fileType: z.string(),
  mimeType: z.string(),
})

// GET /api/knowledge/documents - List all documents
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const where: any = {
      tenantId,
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const documents = await prisma.knowledgeDocument.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
      include: {
        _count: {
          select: {
            chunks: true,
            queries: true,
          },
        },
      },
    })

    return NextResponse.json(documents)
  } catch (error: any) {
    console.error('List documents error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to list documents' },
      { status: 500 }
    )
  }
}

// POST /api/knowledge/documents - Upload a new document
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    const body = await request.json()
    const validated = createDocumentSchema.parse(body)

    const document = await prisma.knowledgeDocument.create({
      data: {
        ...validated,
        tenantId,
        uploadedBy: userId,
      },
    })

    // Note: Document processing is handled via the upload endpoint
    // This endpoint is for creating documents with pre-provided URLs
    // If you need processing, use the upload endpoint instead

    return NextResponse.json(document, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create document error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create document' },
      { status: 500 }
    )
  }
}

