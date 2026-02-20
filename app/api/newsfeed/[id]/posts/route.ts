/**
 * Newsfeed Posts API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createPostSchema = z.object({
  content: z.string().min(1),
  attachments: z.array(z.string()).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const validated = createPostSchema.parse(body)

    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { id: true, name: true, email: true },
    })

    const post = await prisma.newsfeedPost.create({
      data: {
        newsfeedId: params.id,
        tenantId,
        authorId: userId,
        authorName: user?.name || 'Unknown',
        content: validated.content,
        attachments: validated.attachments || [],
      },
    })

    return NextResponse.json({ success: true, data: post })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create post', message: error.message }, { status: 500 })
  }
}
