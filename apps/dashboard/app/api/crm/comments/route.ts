import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { createComment, getComments } from '@/lib/collaboration/comments'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const CreateCommentSchema = z.object({
  content: z.string().min(1),
  entityType: z.enum(['deal', 'contact', 'task', 'project']),
  entityId: z.string(),
  mentions: z.array(z.string()).optional(),
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        filename: z.string(),
        size: z.number(),
        type: z.string(),
      })
    )
    .optional(),
  parentId: z.string().optional(),
})

/**
 * POST /api/crm/comments
 * Create a new comment
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    
    // Get SalesRep ID from userId
    const salesRep = await prisma.salesRep.findUnique({
      where: { userId },
      select: { id: true },
    })
    
    if (!salesRep) {
      return NextResponse.json(
        { error: 'Sales rep not found for this user' },
        { status: 404 }
      )
    }
    
    const body = await request.json()
    const data = CreateCommentSchema.parse(body)

    const comment = await createComment({
      ...data,
      createdByRepId: salesRep.id,
      tenantId,
    })

    return NextResponse.json({
      success: true,
      data: comment,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/crm/comments
 * Get comments for an entity
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { searchParams } = new URL(request.url)

    const entityType = searchParams.get('entityType') as 'deal' | 'contact' | 'task' | 'project'
    const entityId = searchParams.get('entityId')

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      )
    }

    const comments = await getComments(entityType, entityId, tenantId)

    return NextResponse.json({
      success: true,
      data: comments,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}
