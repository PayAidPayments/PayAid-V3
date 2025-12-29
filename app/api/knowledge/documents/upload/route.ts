import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const uploadSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['sop', 'policy', 'contract', 'faq', 'compliance', 'other']).optional(),
  tags: z.array(z.string()).default([]),
  extractedText: z.string().optional(), // For now, accept pre-extracted text
})

// POST /api/knowledge/documents/upload - Upload document with file
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string
    const description = formData.get('description') as string | null
    const category = formData.get('category') as string | null
    const tagsStr = formData.get('tags') as string | null
    const extractedText = formData.get('extractedText') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, DOCX, TXT, and MD files are allowed.' },
        { status: 400 }
      )
    }

    // TODO: Upload file to storage (S3, Cloudinary, etc.)
    // For now, we'll store a placeholder URL
    // In production, upload to your storage service and get the URL
    const fileUrl = `placeholder://${file.name}` // Replace with actual storage URL

    // Determine file type
    const fileTypeMap: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'text/plain': 'txt',
      'text/markdown': 'md',
    }
    const fileType = fileTypeMap[file.type] || 'txt'

    // Parse tags
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : []

    // Create document
    const document = await prisma.knowledgeDocument.create({
      data: {
        tenantId,
        uploadedBy: userId,
        title,
        description: description || undefined,
        category: (category as any) || undefined,
        tags,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType,
        mimeType: file.type,
        extractedText: extractedText || undefined,
        isIndexed: false, // Will be indexed after processing
      },
    })

    // TODO: Queue document processing job
    // - Extract text if not provided
    // - Chunk text
    // - Generate embeddings
    // - Update isIndexed = true

    return NextResponse.json({
      success: true,
      document,
      message: 'Document uploaded successfully. Processing will begin shortly.',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Upload document error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload document' },
      { status: 500 }
    )
  }
}

