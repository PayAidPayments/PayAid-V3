import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

export interface Comment {
  id: string
  content: string
  entityType: 'deal' | 'contact' | 'task' | 'project'
  entityId: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  mentions: string[] // User IDs mentioned
  attachments: Array<{
    id: string
    url: string
    filename: string
    size: number
    type: string
  }>
  replies?: Comment[]
  parentId?: string
}

/**
 * Create a comment on a deal, contact, task, or project
 */
export async function createComment(
  data: {
    content: string
    entityType: 'deal' | 'contact' | 'task' | 'project'
    entityId: string
    createdByRepId: string
    tenantId: string
    mentions?: string[]
    attachments?: Array<{
      url: string
      filename: string
      size: number
      type: string
    }>
    parentId?: string
  }
): Promise<Comment> {
  // Extract mentions from content (@username pattern)
  const mentionPattern = /@(\w+)/g
  const extractedMentions = data.content.match(mentionPattern)?.map((m) => m.slice(1)) || []
  const allMentions = [...new Set([...extractedMentions, ...(data.mentions || [])])]

  // Create comment
  const comment = await prisma.comment.create({
    data: {
      content: data.content,
      entityType: data.entityType,
      entityId: data.entityId,
      createdByRepId: data.createdByRepId,
      tenantId: data.tenantId,
      parentId: data.parentId,
      mentions: allMentions,
      attachments: data.attachments || [],
    },
    include: {
      createdByRep: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
  })

  // Create activity feed entry
  await prisma.activityFeed.create({
    data: {
      tenantId: data.tenantId,
      type: 'comment',
      entityType: data.entityType,
      entityId: data.entityId,
      userId: data.createdByRepId,
      description: `Commented on ${data.entityType}`,
      metadata: {
        commentId: comment.id,
        mentions: allMentions,
      },
    },
  })

  // Notify mentioned users
  if (allMentions.length > 0) {
    await notifyMentions(allMentions, comment.id, data.tenantId)
  }

  return formatComment(comment)
}

/**
 * Get comments for an entity
 */
export async function getComments(
  entityType: 'deal' | 'contact' | 'task' | 'project',
  entityId: string,
  tenantId: string
): Promise<Comment[]> {
  const comments = await prisma.comment.findMany({
    where: {
      entityType,
      entityId,
      tenantId,
      parentId: null, // Only top-level comments
    },
    include: {
      createdByRep: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      replies: {
        include: {
          createdByRep: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return comments.map(formatComment)
}

/**
 * Update a comment
 */
export async function updateComment(
  commentId: string,
  content: string,
  tenantId: string
): Promise<Comment> {
  const comment = await prisma.comment.update({
    where: { id: commentId, tenantId },
    data: {
      content,
      updatedAt: new Date(),
    },
    include: {
      createdByRep: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      replies: {
        include: {
          createdByRep: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  return formatComment(comment)
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string, tenantId: string): Promise<void> {
  await prisma.comment.delete({
    where: { id: commentId, tenantId },
  })
}

/**
 * Format comment for API response
 */
function formatComment(comment: any): Comment {
  return {
    id: comment.id,
    content: comment.content,
    entityType: comment.entityType,
    entityId: comment.entityId,
    createdBy: comment.createdByRepId,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    mentions: comment.mentions || [],
    attachments: comment.attachments || [],
    replies: comment.replies?.map(formatComment) || [],
    parentId: comment.parentId || undefined,
  }
}

/**
 * Notify mentioned users
 */
async function notifyMentions(
  mentions: string[],
  commentId: string,
  tenantId: string
): Promise<void> {
  // In production, this would send push notifications or emails
  // For now, create notification records
  for (const mention of mentions) {
    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { contains: mention, mode: 'insensitive' } },
          { email: { contains: mention, mode: 'insensitive' } },
        ],
      },
    })

    if (user) {
      // Create notification (if notification system exists)
      // await prisma.notification.create({...})
      console.log(`Notifying user ${user.id} about mention in comment ${commentId}`)
    }
  }
}
