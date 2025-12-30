import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { getFileUrl, extractKeyFromUrl } from '@/lib/storage/file-storage'

/**
 * GET /api/knowledge/documents/[id]/access
 * Get signed URL for document access
 */
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
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Extract storage key from fileUrl
    const key = extractKeyFromUrl(document.fileUrl)
    
    if (!key) {
      // If it's already a public URL or placeholder, return as-is
      return NextResponse.json({
        url: document.fileUrl,
        expiresIn: null,
      })
    }

    // Generate signed URL (valid for 1 hour)
    const signedUrl = await getFileUrl(key, 3600)

    return NextResponse.json({
      url: signedUrl,
      expiresIn: 3600,
    })
  } catch (error: any) {
    console.error('Get document access error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get document access URL' },
      { status: 500 }
    )
  }
}

