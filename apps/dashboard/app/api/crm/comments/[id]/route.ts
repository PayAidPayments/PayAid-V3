import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { updateComment, deleteComment } from '@/lib/collaboration/comments'
import { z } from 'zod'
import { findIdempotentRequest, markIdempotentRequest } from '@/lib/ai-native/m0-service'

const UpdateCommentSchema = z.object({
  content: z.string().min(1),
})

/**
 * PUT /api/crm/comments/[id]
 * Update a comment
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const idempotencyKey = request.headers.get('x-idempotency-key')?.trim()

    if (idempotencyKey) {
      const existing = await findIdempotentRequest(tenantId, `crm:comment:update:${id}:${idempotencyKey}`)
      const existingCommentId = (existing?.afterSnapshot as { comment_id?: string } | null)?.comment_id
      if (existing && existingCommentId) {
        return NextResponse.json(
          {
            success: true,
            deduplicated: true,
            data: { id: existingCommentId },
          },
          { status: 200 }
        )
      }
    }
    const body = await request.json()
    const { content } = UpdateCommentSchema.parse(body)

    const comment = await updateComment(id, content, tenantId)

    if (idempotencyKey) {
      await markIdempotentRequest(tenantId, userId, `crm:comment:update:${id}:${idempotencyKey}`, {
        comment_id: comment.id,
      })
    }

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
    console.error('Error updating comment:', error)
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/crm/comments/[id]
 * Delete a comment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const idempotencyKey = request.headers.get('x-idempotency-key')?.trim()

    if (idempotencyKey) {
      const existing = await findIdempotentRequest(tenantId, `crm:comment:delete:${id}:${idempotencyKey}`)
      const existingDeleted = (existing?.afterSnapshot as { deleted?: boolean } | null)?.deleted
      if (existing && existingDeleted) {
        return NextResponse.json(
          {
            success: true,
            deduplicated: true,
            message: 'Comment deleted',
          },
          { status: 200 }
        )
      }
    }

    await deleteComment(id, tenantId)

    if (idempotencyKey) {
      await markIdempotentRequest(tenantId, userId, `crm:comment:delete:${id}:${idempotencyKey}`, {
        comment_id: id,
        deleted: true,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Comment deleted',
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}
