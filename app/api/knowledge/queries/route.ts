import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

// GET /api/knowledge/queries - Get query history (audit trail)
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      tenantId,
    }

    if (documentId) {
      where.documentId = documentId
    }

    const queries = await prisma.knowledgeQuery.findMany({
      where,
      orderBy: { askedAt: 'desc' },
      take: limit,
      include: {
        document: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json(queries)
  } catch (error: any) {
    console.error('Get queries error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get queries' },
      { status: 500 }
    )
  }
}

