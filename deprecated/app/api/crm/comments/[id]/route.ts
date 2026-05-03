import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { updateComment, deleteComment } from '@/lib/collaboration/comments'
import { z } from 'zod'

const UpdateCommentSchema = z.object({
  content: z.string().min(1),
})

/**
 * PUT /api/crm/comments/[id]
 * Update a comment
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const { content } = UpdateCommentSchema.parse(body)

    const comment = await updateComment(params.id, content, tenantId)

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
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    await deleteComment(params.id, tenantId)

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
